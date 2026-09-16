# DESIGN SYSTEM SPECIFICATION — LOCALIZE AI & MOVIE DUBBING
> Reconstructed and extracted from `https://aidubbing.io/movie-dubbing` with `@google/design.md`, `/awesome-design`, `/ui-skills-root`, and `/impeccable` guidelines.

---

## 1. Product Identity & Design Direction

- **Product Archetype**: Autonomous AI Post-Production Studio & Multilingual Film Localization Platform
- **Visual Direction**: High-Fidelity Studio Precision meets Clean Modern SaaS ("Electric Violet & Crisp Paper")
- **Core Emotional Tone**: Professional, Authoritative, Cinematic, Intelligent, Fluid
- **Primary Use Case**: Film Directors, Indie Filmmakers, Studios, and Global Creators localizing multi-speaker cinema with character-consistent voice cloning, acoustic mastering, isometric syllable matching, and defect repair.

---

## 2. Color Tokens & Semantic Palette

### 2.1 Brand & Accent Colors
| Token Name | CSS Variable | Hex Code | Purpose / Usage |
|---|---|---|---|
| **Brand Primary** | `--primary-color` / `--violet` | `#7248EA` | Main CTAs, active states, key focus borders, brand badges |
| **Brand Primary Hover** | `--violet-hover` | `#6847FF` | Primary button hover state, link hovers |
| **Brand Primary Deep** | `--accent-color` | `#6A33E9` | Gradient anchors, deep violet accents, active pressed states |
| **Brand Primary Tint** | `--violet-soft` / `--violet-2` | `#F2EEFF` | Secondary button fills, card badges, selection highlights |
| **Brand Primary Ultralight** | `--violet-3` | `#F8F6FF` | Table row hover, subtle input focus background |
| **Secondary Mint** | `--secondary-color` | `#00D4AA` | Real-time sync lock indicator, 100% QA score, waveform stems |

### 2.2 Neutral & Surface Hierarchy
| Token Name | CSS Variable | Hex Code | Purpose / Usage |
|---|---|---|---|
| **Canvas Background** | `--bg` / `--bg-primary` | `#FBFBFD` | Page body background, high-clarity canvas |
| **Paper / Card Surface** | `--paper` | `#FFFFFF` | Elevating card surface, dialogs, dropzones, inspector panes |
| **Surface Secondary** | `--bg-secondary` | `#F8F9FA` | Sidebar panels, secondary tab trays, metadata rails |
| **Surface Soft** | `--soft` | `#F2F0F8` | Inactive step badges, disabled chip surfaces |
| **Dark Foundation** | `--ink` / `--text-primary` | `#1A1A1A` | Primary headlines, modal titles, high-contrast labels |
| **Deep Charcoal** | `--black` | `#07060C` | Studio video player bezel, timeline background |
| **Muted Text** | `--muted` / `--text-secondary` | `#575268` | Subtitles, descriptive paragraphs, secondary labels |
| **Subtle Text** | `--text-light` | `#9E9E9E` | Timestamps, file size metadata, placeholders |
| **Line / Border Subtle** | `--line` | `#DBD8E8` | Card outlines, divider rules, inactive tab borders |
| **Line / Border Focus** | `--border-color` | `#BD98EC` | Input focus rings, dropzone dashed border, active tabs |
| **Dark Studio Shell** | `--bg-dark` | `#111827` | Video preview console, audio mixdown transport controls |

### 2.3 Semantic & QA Defect Status Colors
| Status | Text Color | Background Fill | Border | Usage in Pipeline |
|---|---|---|---|---|
| **Success / Passed** | `#14804A` | `#F0F9EB` | `#C2E7B0` | QA score ≥ 85, stem rendered, subtitles aligned |
| **Danger / Defect** | `#B42318` | `#FEF0F0` | `#FDE2E2` | Timing overflow, audio clipping, retry triggered |
| **Warning / Attention** | `#A96F00` | `#FDF6EC` | `#F5DAB1` | Syllable stretch > 1.25x, potential accent drift |
| **Info / Telemetry** | `#409EFF` | `#ECF5FF` | `#B3D8FF` | Agent decision stream, Grafana event emitted |

---

## 3. Typography & Hierarchy

### 3.1 Font Stacks
```css
/* Primary Interface & Headings */
font-family: 'Roboto', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Timecode, Audio Specs, Hashes, Codecs & Monospace */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
```

### 3.2 Type Scale
| Role | Size | Line Height | Weight | Letter Spacing | CSS Utility |
|---|---|---|---|---|---|
| **Display H1** | `2.5rem` (40px) | `1.15` | `700` | `-0.025em` | `text-4xl font-bold tracking-tight` |
| **Section H2** | `1.875rem` (30px) | `1.2` | `700` | `-0.02em` | `text-3xl font-bold tracking-tight` |
| **Subhead H3** | `1.25rem` (20px) | `1.35` | `600` | `-0.01em` | `text-xl font-semibold` |
| **Card / Item Title** | `1rem` (16px) | `1.4` | `600` | `0em` | `text-base font-semibold` |
| **Body Regular** | `0.875rem` (14px) | `1.5` | `400` | `0em` | `text-sm font-normal` |
| **Body Small** | `0.8125rem` (13px) | `1.45` | `400` | `0em` | `text-[13px] font-normal` |
| **Caption / Timestamp** | `0.75rem` (12px) | `1.35` | `500` | `0.02em` | `text-xs font-medium uppercase font-mono` |

---

## 4. Spacing, Radii & Elevation

### 4.1 Spatial Rhythm
```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```
- **Page Container Max Width**: `1200px` (`max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8`)
- **Card Padding**: `20px` to `24px` (`p-5` to `p-6`)

### 4.2 Border Radii
| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `--radius-sm` | `6px` | `rounded-[6px]` | Language chips, timecode tags, small badges |
| `--radius-md` | `10px` | `rounded-[10px]` | Standard buttons, text inputs, dropdown menus |
| `--radius-lg` | `16px` | `rounded-[16px]` | Studio pipeline cards, inspector dialogs |
| `--radius-xl` | `20px` | `rounded-[20px]` | Media dropzones, hero upload cards, preview player |
| `--radius-pill`| `9999px` | `rounded-full` | Primary action CTAs, status indicator pills, avatars |

### 4.3 Elevation & Shadows
```css
/* Crisp Card Elevation */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);

/* Floating Panel Elevation */
--shadow-float: 0 4px 16px rgba(0, 0, 0, 0.08);

/* Dramatic Modal & Backdrop Elevation */
--shadow-modal: 0 20px 50px rgba(26, 20, 55, 0.12);

/* Electric Violet Glow for Hero CTAs */
--shadow-glow: 0 4px 14px rgba(114, 72, 234, 0.28);
--shadow-glow-hover: 0 6px 20px rgba(114, 72, 234, 0.42);
```

---

## 5. Component Patterns & Visual Language

### 5.1 Hero Video Upload & Drag-and-Drop Dropzone
- **Container**: `bg-[#FFFFFF] border-2 border-dashed border-[#BD98EC] rounded-[20px] p-8 md:p-12 text-center transition-all duration-300`
- **Active / Dragging State**: `border-[#7248EA] bg-[#F2EEFF] shadow-[0_4px_20px_rgba(114,72,234,0.18)] scale-[1.01]`
- **Upload Button**: Solid violet pill (`bg-[#7248EA] text-white px-8 py-3.5 rounded-full font-semibold shadow-[0_4px_14px_rgba(114,72,234,0.28)] hover:bg-[#6847FF] hover:scale-[1.02] active:scale-[0.98] transition-all`)
- **Format Hint**: `text-xs text-[#575268] mt-3` indicating `.mp4`, `.mov`, `.mkv` with subtitle & vocal stem support.

### 5.2 3-Step Guided Localization Cards
1. **Step 1: Ingest & Narrative Analysis** (Story Analyst & vocal stem separation).
2. **Step 2: Script Localization & Voice Synthesis** (Isometric quotas, neural voice cloning, speech timing alignment).
3. **Step 3: Studio Mixdown & QA Review** (Sidechain ducking, subtitle sync, broadcast MP4 export).
- **Structure**: 3-column responsive grid (`grid grid-cols-1 md:grid-cols-3 gap-6`).
- **Badge**: Circular step counter `size-8 rounded-full bg-[#7248EA] text-white font-bold flex items-center justify-center text-sm`.

### 5.3 Post-Production Crew & QA Defect Cards
- **Crew Agent Pill**: `inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#F2EEFF] text-[#7248EA] border border-[#BD98EC]/30`
- **Defect Card**: `border border-[#FDE2E2] bg-[#FEF0F0]/50 rounded-[12px] p-4 flex items-start gap-3`
  - Defect Label: `text-[#B42318] font-semibold text-sm`
  - Fix Proposal: `text-xs text-[#575268] mt-1`
  - Targeted Retry Trigger: Soft danger button (`px-3 py-1 rounded-[6px] bg-[#B42318] text-white text-xs hover:bg-[#911D13] transition-colors`)

### 5.4 Audio & Stem Mixer Visualizer
- **Dark Studio Console**: `bg-[#07060C] text-white rounded-[16px] p-5 border border-white/10`
- **Stem Tracks**:
  - `Vocals / Dub Track`: Purple waveform accent (`#7248EA`)
  - `Music & M&E Track`: Teal / Mint waveform accent (`#00D4AA`)
  - `Sidechain Ducking Envelope`: Amber marker (`#A96F00`) showing `-6dB` compression during dialogue bursts.

---

## 6. Motion & Micro-Interactions

### 6.1 Standard Transition Tokens
```css
--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: transform 0.22s cubic-bezier(0.23, 1, 0.32, 1);
```

### 6.2 Keyframe Animations
```css
@keyframes pulse-violet {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(114, 72, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(114, 72, 234, 0);
  }
}

@keyframes waveform-active {
  0%, 100% { height: 6px; }
  50% { height: 28px; }
}

.animate-pulse-violet {
  animation: pulse-violet 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## 7. Direct Code Export (Tailwind & CSS Variables)

### 7.1 Tailwind Config Theme Extension (`tailwind.config.js`)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        studio: {
          primary: '#7248EA',
          primaryHover: '#6847FF',
          accent: '#6A33E9',
          soft: '#F2EEFF',
          tint: '#F8F6FF',
          mint: '#00D4AA',
          ink: '#1A1A1A',
          black: '#07060C',
          muted: '#575268',
          subtle: '#9E9E9E',
          line: '#DBD8E8',
          borderFocus: '#BD98EC',
          canvas: '#FBFBFD',
          dark: '#111827',
        },
        qa: {
          success: '#14804A',
          successBg: '#F0F9EB',
          danger: '#B42318',
          dangerBg: '#FEF0F0',
          warning: '#A96F00',
          warningBg: '#FDF6EC',
          info: '#409EFF',
          infoBg: '#ECF5FF',
        }
      },
      borderRadius: {
        'studio-sm': '6px',
        'studio-md': '10px',
        'studio-lg': '16px',
        'studio-xl': '20px',
      },
      boxShadow: {
        'studio-card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'studio-float': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'studio-glow': '0 4px 14px rgba(114, 72, 234, 0.28)',
        'studio-glow-hover': '0 6px 20px rgba(114, 72, 234, 0.42)',
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    }
  }
};
```

### 7.2 Canonical CSS Custom Properties (`globals.css`)
```css
:root {
  --primary-color: #7248ea;
  --primary-hover: #6847ff;
  --accent-color: #6a33e9;
  --secondary-color: #00d4aa;
  --violet-soft: #f2eeff;
  --violet-tint: #f8f6ff;

  --text-primary: #1a1a1a;
  --text-secondary: #575268;
  --text-light: #9e9e9e;
  --bg-primary: #fbfbfd;
  --bg-secondary: #f8f9fa;
  --paper: #ffffff;
  --bg-dark: #111827;
  --border-color: #bd98ec;
  --line-color: #dbd8e8;

  --qa-success: #14804a;
  --qa-danger: #b42318;
  --qa-warning: #a96f00;
  --qa-info: #409eff;

  --border-radius: 12px;
  --border-radius-large: 20px;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-heavy: 0 20px 50px rgba(26, 20, 55, 0.12);
  --shadow-glow: 0 4px 14px rgba(114, 72, 234, 0.28);
}
```
