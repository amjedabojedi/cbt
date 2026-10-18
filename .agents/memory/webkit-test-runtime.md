---
name: WebKit test runtime
description: Nix-specific constraints when installing and validating the iPhone browser engine.
---

Use the browser revision installed by the project's Playwright version, with a Nix-compatible runtime. A successful browser-process launch alone does not prove compatibility; create a page and render content before running the journeys.

**Why:** Older preinstalled Nix WebKit builds could start under newer Playwright while hanging on page creation. The current downloaded Ubuntu runtime needed compatible ELF library/interpreter paths and a 64-bit Mesa EGL vendor configuration to render on NixOS. Broad library-directory searches also encountered 32-bit variants.

**How to apply:** Install into the isolated runner's documented browser cache, not an inherited home-cache location. Check the actual page-rendering operation without inheriting workspace credentials. Keep runtime repair outside application code and do not substitute Chromium, bypass assertions, or assume a Nix browser revision matches based on its ability to start.
