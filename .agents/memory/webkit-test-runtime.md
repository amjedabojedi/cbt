---
name: WebKit test runtime
description: Nix-specific constraints when installing and validating the iPhone browser engine.
---

Use the browser revision installed by the project's Playwright version, with a Nix-compatible runtime. A successful browser-process launch alone does not prove compatibility; create a page and render content before running the journeys.

**Why:** Older preinstalled Nix WebKit builds could start under newer Playwright while hanging on page creation. The current downloaded Ubuntu runtime needed compatible ELF library/interpreter paths and a 64-bit Mesa EGL vendor configuration to render on NixOS. Broad library-directory searches also encountered 32-bit variants.

**How to apply:** Install into the isolated runner's documented browser cache, not an inherited home-cache location. Check the actual page-rendering operation without inheriting workspace credentials. Keep runtime repair outside application code and do not substitute Chromium, bypass assertions, or assume a Nix browser revision matches based on its ability to start.

Keep the native dependency pin separate from the Playwright browser revision; a workspace's default Nix channel is not an ABI guarantee.

**Why:** Ubuntu WebKit libraries depend on specific SONAMEs, while Nix packages can expose a different default ABI. Playwright's Ubuntu `ldconfig` heuristic also cannot discover a valid pinned Nix closure even after all ELF dependencies resolve.

**How to apply:** Use explicit ABI-compatible packages from a hash-pinned closure, validate x86-64 ELF and dependency resolution (including Mesa's driver output), then require offline page rendering before recording dependency validation. Never globally disable checks or pass a host-validation bypass into app/journey processes.

Coordinate runtime setup and browser use with a kernel lock; never delete a live lockfile or treat a partially patched browser as repairable in place.

**Why:** File locks protect an inode, so unlinking the file lets concurrent commands acquire different locks. Interrupted ELF writes may be corrupt even if Playwright's download-complete marker remains present.

**How to apply:** Hold the same cache lock through setup and the entire WebKit journey/shutdown, retain it in active runtime children, and reinstall an interrupted revision before patching again. Run concurrency and negative setup probes in disposable checkouts, not by allowing caller-selected browser paths. Even setup that fails before downloading can create a lockfile and invalidate a subsequent clean-cache check.

Declare runtime orchestration tools in the pure CI shell, not just native browser dependencies.

**Why:** A working development host can hide missing commands that a clean worker needs before browser rendering even starts.

**How to apply:** When adding a setup or runner subprocess, verify its executable is supplied by the pinned CI toolchain. Validate both clean setup and real page rendering/journeys rather than trusting the host PATH or a dependency marker.

Keep application-owned runtime sentinels outside Playwright's browser-folder naming namespace.

**Why:** Playwright garbage-collects unreferenced cache entries with browser-name prefixes, including sibling interruption markers. A warm-cache test double can miss this download-time behavior.

**How to apply:** Preserve interruption evidence across downloads and simulate upstream garbage collection in recovery tests. Require a fresh browser-cache setup as well as reusable-cache checks.
