import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";

const DISCARD_MESSAGE = "Discard your entry? Your unsaved work will be lost.";

// Register before React mounts: the router's external-store subscriber can
// synchronously unmount a form before a later popstate listener gets its turn.
type BackForwardGuard = (event: PopStateEvent) => boolean;
const registryKey = Symbol.for("resilience.unsaved-work-navigation");
const browserWindow = typeof window === "undefined" ? undefined :
  window as Window & { [registryKey]?: Set<BackForwardGuard> };
// Eager and lazy Vite imports may instantiate this module separately. Share
// both the early listener and its active guards across those module instances.
const backForwardGuards = browserWindow?.[registryKey] ?? new Set<BackForwardGuard>();
if (browserWindow && !browserWindow[registryKey]) {
  browserWindow[registryKey] = backForwardGuards;
  window.addEventListener("popstate", event => {
    Array.from(backForwardGuards).every(guard => guard(event));
  }, true);
}

/** Shares one confirmation across pointer-down/mouse-down/click for a single control. */
export class NavigationConfirmationGate {
  private authorizedTarget: object | null = null;

  constructor(private readonly confirm: () => boolean) {}

  authorize(target: object, isDirty: boolean) {
    if (!isDirty) return true;
    if (this.authorizedTarget === target) return true;
    const accepted = this.confirm();
    this.authorizedTarget = accepted ? target : null;
    return accepted;
  }

  consume(target: object) {
    if (this.authorizedTarget !== target) return false;
    this.authorizedTarget = null;
    return true;
  }

  clear() {
    this.authorizedTarget = null;
  }
}

/**
 * Protects sensitive wizard input without persisting it in browser storage.
 * Draft navigation requires discard confirmation. In-app navigation while a
 * save is pending is blocked instead; discarding cannot cancel an issued write.
 */
export function useUnsavedWorkProtection(isDirty: boolean, isSaving = false) {
  const dirtyRef = useRef(isDirty || isSaving);
  dirtyRef.current = isDirty || isSaving;
  const savingRef = useRef(isSaving);
  savingRef.current = isSaving;
  const [location, navigate] = useLocation();
  const search = useSearch();
  const currentRoute = `${location}${search ? (search.startsWith("?") ? search : `?${search}`) : ""}`;
  const acceptedLocationRef = useRef(currentRoute);
  acceptedLocationRef.current = currentRoute;
  const pendingControlRef = useRef<Element | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const approvedUnloadRef = useRef(false);
  const gateRef = useRef<NavigationConfirmationGate | null>(null);
  if (!gateRef.current) {
    gateRef.current = new NavigationConfirmationGate(() => window.confirm(DISCARD_MESSAGE));
  }

  useEffect(() => {
    if (!isDirty && !isSaving) return;
    const gate = gateRef.current!;
    const authorizeNavigation = (target: object) => {
      if (savingRef.current) {
        gate.clear();
        return false;
      }
      return gate.authorize(target, dirtyRef.current);
    };
    const popstateTarget = {};
    let deniedControl: Element | null = null;
    let deniedTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDenied = () => {
      deniedControl = null;
      if (deniedTimer) clearTimeout(deniedTimer);
      deniedTimer = null;
    };

    const clearPending = () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      pendingControlRef.current = null;
      gate.clear();
    };

    const beforeUnload = (event: BeforeUnloadEvent) => {
      // Browsers only allow a native leave-page warning for reload/tab close.
      // Never reuse a draft-discard approval while a write is in flight.
      if (savingRef.current) {
        event.preventDefault();
        event.returnValue = "";
        return;
      }
      if (approvedUnloadRef.current) {
        approvedUnloadRef.current = false;
        return;
      }
      // The click/pointer confirmation already approved this full-page navigation.
      if (pendingControlRef.current) {
        clearPending();
        return;
      }
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const getNavigationControl = (event: Event): Element | null => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest(
        "a[href], [role='tab'], [role='menuitem'], [data-navigation], [data-navigate], [data-route], [data-wizard-close]"
      );
      if (!control || control.closest("[data-unsaved-work-scope]")) return null;
      if (control instanceof HTMLAnchorElement && control.href === window.location.href) return null;
      return control;
    };

    const approveExternalUnload = (control: Element) => {
      if (
        control instanceof HTMLAnchorElement &&
        control.target !== "_blank" &&
        new URL(control.href).origin !== window.location.origin
      ) {
        approvedUnloadRef.current = true;
        setTimeout(() => { approvedUnloadRef.current = false; }, 1500);
      }
    };

    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const confirmPointerNavigation = (event: PointerEvent | MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented) return;
      const control = getNavigationControl(event);
      // One pointer gesture can emit pointerdown, mousedown and click even when
      // its first event was cancelled. Never ask again for that same gesture.
      if (event.type === "pointerdown") clearDenied();
      if (control && deniedControl === control) {
        block(event);
        return;
      }
      if (!control) {
        if (pendingControlRef.current) clearPending();
        return;
      }
      if (pendingControlRef.current && pendingControlRef.current !== control) clearPending();
      if (!authorizeNavigation(control)) {
        clearPending();
        deniedControl = control;
        deniedTimer = setTimeout(clearDenied, 1000);
        block(event);
        return;
      }
      pendingControlRef.current = control;
      approveExternalUnload(control);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      // If a pointer press is released outside the control (no click), discard the one-shot approval.
      pendingTimerRef.current = setTimeout(clearPending, 1000);
    };

    const confirmClickNavigation = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented) return;
      const control = getNavigationControl(event);
      if (!control) return;
      if (savingRef.current) {
        clearPending();
        block(event);
        return;
      }
      if (deniedControl === control) {
        block(event);
        clearDenied();
        return;
      }
      if (gate.consume(control)) {
        approveExternalUnload(control);
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
        pendingControlRef.current = null;
        return;
      }
      if (authorizeNavigation(control)) {
        gate.consume(control);
        approveExternalUnload(control);
        return;
      }
      clearPending();
      block(event);
    };

    const confirmKeyboardActivation = (event: KeyboardEvent) => {
      if (!dirtyRef.current || !["Enter", " "].includes(event.key)) return;
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest(
        "a[href], [role='tab'], [role='menuitem'], [data-navigation], [data-navigate], [data-route]"
      );
      if (!control || control.closest("[data-unsaved-work-scope]")) return;
      if (!authorizeNavigation(control)) {
        block(event);
        return;
      }
      approveExternalUnload(control);
      pendingControlRef.current = control;
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(clearPending, 1000);
    };

    const confirmBackForward = (event: PopStateEvent) => {
      if (!dirtyRef.current) return true;
      if (authorizeNavigation(popstateTarget)) {
        gate.consume(popstateTarget);
        return true;
      }
      event.stopImmediatePropagation();
      // Restore the last accepted router location before React commits the popstate update.
      navigate(acceptedLocationRef.current);
      return false;
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("pointerdown", confirmPointerNavigation, true);
    document.addEventListener("mousedown", confirmPointerNavigation, true);
    document.addEventListener("click", confirmClickNavigation, true);
    document.addEventListener("keydown", confirmKeyboardActivation, true);
    backForwardGuards.add(confirmBackForward);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("pointerdown", confirmPointerNavigation, true);
      document.removeEventListener("mousedown", confirmPointerNavigation, true);
      document.removeEventListener("click", confirmClickNavigation, true);
      document.removeEventListener("keydown", confirmKeyboardActivation, true);
      backForwardGuards.delete(confirmBackForward);
      clearPending();
      clearDenied();
    };
  }, [isDirty, isSaving, navigate]);

  return {
    confirmDiscard: () =>
      !savingRef.current && (
        !dirtyRef.current ||
        window.confirm(DISCARD_MESSAGE)
      ),
  };
}
