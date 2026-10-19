---
name: Navigation role parity
description: Role and selected-client consistency across desktop and phone navigation.
---

Keep one primary phone menu, with the same role-appropriate destinations as desktop.

**Why:** The user reported inconsistent phone behavior. Independent phone menus had diverged: the header menu omitted administration tools while a floating menu exposed a different route list.

**How to apply:** Keep route and label definitions shared. Check clients, administrators, and therapists both with and without a selected client. Returning to My Clients must clear selection locally and on the server. Do not replace role-specific tools with a generic personal-client menu on phones.

Check phone controls against the configured device dimensions, not only DOM visibility or layout-viewport intersection.

**Why:** A page wider than a phone can expand the browser's layout viewport. Tests can then call a footer visible even though it falls below the actual screenshot. This occurred while administration content exceeded the phone width.

**How to apply:** Assert page, drawer, and footer bounding boxes against the test device width/height. Disable finite animations when capturing diagnostic screenshots so transitional frames are not mistaken for broken layouts.

Check inner scroll positions and content coordinates after switching tabs; a correctly sized outer viewport does not prove that the content remains readable.

**Why:** The admin phone dashboard kept the document within the viewport, but selecting its last tab horizontally scrolled the entire main pane and clipped headings and counters. Document-width and main-column bounds alone missed it.

**How to apply:** Check that headings and essential values remain inside the device bounds after interaction. Localize horizontal scrolling to the tab strip or table rather than the whole content pane. Include bottom shortcuts in role/context parity checks, not only the drawer and sidebar.

Treat bottom links as role-aware shortcuts, not as the full destination list.

**Why:** The user explicitly required role/context-appropriate phone shortcuts without removing destinations from the full menu, while preserving both therapist client-return behavior and client navigation.

**How to apply:** Keep all destinations in the full menu even when they are not among the bottom shortcuts. A therapist's return shortcut must clear selected-client context rather than merely change the URL.
