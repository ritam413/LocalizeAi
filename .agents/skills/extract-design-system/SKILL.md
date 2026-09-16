---
name: extract-design-system
description: Extract design tokens (colors, typography, spacing, border radius, shadows, CSS variables) and design systems from any public website URL. Generates canonical DESIGN.md, JSON token files, and CSS/Tailwind variables using extract-design-system and @google/design.md. Accessible via /extract-design-system or /extract-tokens slash command.
---

# Extract Design System & Tokens

Use this skill when asked to extract the design system, color palette, typography, spacing, or visual language from a public website URL into a project's `DESIGN.md` and code tokens.

---

## 1. Quick Invocation

```bash
# Basic extraction from URL
extract-design-system <url>

# Dark mode extraction
extract-design-system <url> --dark-mode

# Mobile viewport extraction
extract-design-system <url> --mobile

# Heavy JS / dynamic web app extraction
extract-design-system <url> --slow
```

---

## 2. Workflow Pipeline

1. **Extract**:
   Run the CLI against the target website:
   ```bash
   extract-design-system <target_url>
   ```
   This generates extracted token data, raw CSS custom properties, and normalized color/type palettes.

2. **Generate `DESIGN.md`**:
   Format the extracted tokens into a canonical `DESIGN.md` at the project root following the `@google/design.md` specification.

3. **Validate & Lint**:
   Validate that the `DESIGN.md` conforms to standard schema rules:
   ```bash
   designmd lint DESIGN.md
   ```

4. **Export to Code (Tailwind / CSS)**:
   Export tokens directly into your project's styling layer:
   ```bash
   # For Tailwind v4 / modern CSS:
   designmd export --format css-tailwind DESIGN.md

   # For Tailwind v3 theme.extend JSON:
   designmd export --format json-tailwind DESIGN.md

   # For W3C standard tokens:
   designmd export --format dtcg DESIGN.md

   # For pure CSS custom properties:
   designmd export --format css-vars DESIGN.md
   ```

5. **Audit Codebase Drift (Optional)**:
   Scan project files for hardcoded hex codes or arbitrary values:
   ```bash
   extract-design-system audit ./src
   ```

---

## 3. Related Skills in the Flow

- **`/create-design-md`**: Use for deep manual inspection & reconstruction of `DESIGN.md` in URL or Repo mode.
- **`/awesome-design`**: Use when adopting established brand styles (Linear, Stripe, Supabase, Apple, Vercel).
- **`/baseline-ui`**: Quick visual hygiene, hierarchy, and token application pass.
- **`/adversarial-review`** & **`/council-review`**: Stress-test UI components and design token choices.
- **`/ui-skills-root`**: Route to the best UI skills and tools for the current task.
