---
name: create-design-md
description: Create or update a DESIGN.md from an existing product repository or public website. Use when asked to document an interface's design language, reconstruct its visual system, extract design tokens and guidance from current evidence, or give coding agents persistent UI context. Do not modify product source or promote accidental implementation patterns into design decisions.
---

# Create DESIGN.md

Create a `DESIGN.md` for one product or coherent website. Record the design language that governs it, not every value that happens to exist.

## Boundaries

- Modify only `DESIGN.md`. Do not change product source, dependencies, configuration, or generated files.
- Use the DESIGN.md format contract below. Do not invent a competing schema.
- Do not copy every discovered token or component into the document.
- Do not convert repetition, local styling, or visual preference into product intent.

## 1. Choose the mode

### Repository mode

Use when a local product repository is available. Create or update `DESIGN.md` at the root of the selected product.

If the repository contains multiple deployable products, select the one named by the user. If the request does not identify one and ownership is ambiguous, ask before writing.

Repository evidence may establish normative values, token names, component ownership, and documented rationale.

### URL mode

Use when the user provides a public URL without its source repository. Create a reconstructed `DESIGN.md` draft in the current workspace.

URL mode requires rendered browser access. Inspect the DOM, computed styles, and publicly loaded stylesheets at desktop and mobile widths. Screenshots may support interpretation but cannot establish exact values by themselves.

Inspect the supplied page and shared chrome. For a site-wide request, sample up to three same-origin pages that represent distinct templates.

URL evidence may establish only observable visual patterns and computed values. It cannot establish internal token names, component ownership, undocumented rationale, or whether a pattern is intentionally canonical.

If rendered inspection is unavailable, ask for screenshots or source files. Do not create a DESIGN.md from copy, metadata, or HTML structure alone.

Choose repository mode whenever source is available. A supplied URL may verify rendered presentation but does not replace repository evidence.

## 2. Trace the evidence

In repository mode, inspect in this order:
1. Existing `DESIGN.md` and explicit repository guidance
2. Tokens, themes, variables, and global styles
3. Shared primitives and their variants
4. Representative routes and rendered consumers
5. Surface-local implementations

In URL mode, sample representative elements for:
- colors and surface roles
- typography roles
- spacing and layout
- borders, radii, and elevation
- navigation, buttons, inputs, cards, and repeated content structures
- desktop and mobile presentation

## 3. Validate and Export

Run structural linting:
```bash
designmd lint DESIGN.md
```

Then run one compatibility export:
```bash
designmd export --format css-tailwind DESIGN.md
```
