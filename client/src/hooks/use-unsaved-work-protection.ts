import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";

const DISCARD_MESSAGE = "Discard your entry? Your unsaved work will be lost.";

const historyGuards = new Set<(event: PopStateEvent) => boolean | void>();

// main.tsx eagerly imports this module before rendering the router. Native
// popstate targets window itself, where listeners run in registration order
// even with capture=true. A listener installed by a lazy wizard's effect can
// otherwise run after the router has already unmounted that wizard.
if (typeof window !== "undefined") {
  window.addEventListener("popstate", event => {
    for (const guard of Array.from(historyGuards)) {
      if (guard(event) === false) break;
    }
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
 * Navigation is allowed only after the user explicitly confirms discarding it.
 */
export function useUnsavedWorkProtection(isDirty: boolean) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
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
    if (!isDirty) return;
    const gate = gateRef.current!;
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
      if (!gate.authorize(control, dirtyRef.current)) {
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
      if (gate.authorize(control, dirtyRef.current)) {
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
      if (!gate.authorize(control, dirtyRef.current)) {
        block(event);
        return;
      }
      approveExternalUnload(control);
      pendingControlRef.current = control;
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(clearPending, 1000);
    };

    const confirmBackForward = (event: PopStateEvent) => {
      if (!dirtyRef.current) return;
      if (gate.authorize(popstateTarget, dirtyRef.current)) {
        gate.consume(popstateTarget);
        return;
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
    historyGuards.add(confirmBackForward);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("pointerdown", confirmPointerNavigation, true);
      document.removeEventListener("mousedown", confirmPointerNavigation, true);
      document.removeEventListener("click", confirmClickNavigation, true);
      document.removeEventListener("keydown", confirmKeyboardActivation, true);
      historyGuards.delete(confirmBackForward);
      clearPending();
      clearDenied();
    };
  }, [isDirty, navigate]);

  return {
    confirmDiscard: () =>
      !dirtyRef.current ||
      window.confirm(DISCARD_MESSAGE),
  };
}
