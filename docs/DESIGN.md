# Recruitment Portal Design Plan & Design System (docs/DESIGN.md)

## 1. Design Philosophy: Clarity, Speed, and Operational Trust
The Recruitment Portal is an enterprise workhorse for recruiters, hiring coordinators, and corporate HR directors who interact with data tables, candidate records, and status pipelines for hours at a time. The interface avoids frivolous decorations, generic templates, or loud gradients in favor of **dense, readable typography**, **high-contrast status signals**, **instant keyboard-friendly workflows**, and **zero visual noise**.

---

## 2. Design Tokens

### 2.1 Color Palette (6 Named Hex Colors)
| Token Name | Hex Code | Role & Usage |
|---|---|---|
| `--color-brand-primary` | `#1A44C2` | **Deep Slate Cobalt**: Main navigational accents, active state badges, primary action buttons |
| `--color-brand-primary-hover`| `#133496` | Hover state for primary buttons |
| `--color-brand-dark` | `#0E1726` | **Midnight Obsidian**: Sidebar background, primary text headings, dark status badges |
| `--color-surface-bg` | `#F8FAFC` | **Crisp Alabaster**: Main workspace background, card gutters, off-white contrast |
| `--color-surface-card` | `#FFFFFF` | **Pure Card White**: Table surfaces, form containers, modal backgrounds |
| `--color-border-subtle` | `#E2E8F0` | **Subtle Slate Border**: Hairline borders (1px) between table cells, cards, and inputs |
| `--color-text-main` | `#1E293B` | **Charcoal Body**: Primary readable text (WCAG AAA contrast on white) |
| `--color-text-muted` | `#64748B` | **Muted Steel**: Captions, timestamps, secondary field labels |

### 2.2 Semantic Status System
All status indicators use both **distinctive color** and **explicit text labels** (never color alone):
- **Approved / Confirmed / Fulfilled:** `--status-success` (`#0D9488` Teal Pine) / Light tint (`#F0FDF4`)
- **Pending / Shortlisted:** `--status-warning` (`#D97706` Warm Amber) / Light tint (`#FFFBEB`)
- **Rejected / Error:** `--status-danger` (`#E11D48` Crimson Rose) / Light tint (`#FFF1F2`)
- **Open / In Progress:** `--status-info` (`#0284C7` Cyan Slate) / Light tint (`#F0F9FF`)
- **Suspended / On Hold / Draft:** `--status-neutral` (`#64748B` Neutral Steel) / Light tint (`#F1F5F9`)

### 2.3 Typography Scale
- **Headings & Numbers:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Weights:** Regular (400) for body, Medium (500) for labels, Semi-Bold (600) for headers and card titles.
- **Sizes:**
  - Micro / Badges: `0.75rem` (12px), uppercase, letter-spacing +0.05em
  - Body / Form Inputs: `0.875rem` (14px), line-height 1.5
  - Section Headers: `1.125rem` (18px), semi-bold
  - Page Titles / KPI Stat Numbers: `1.5rem` - `1.875rem` (24px - 30px)

---

## 3. Structural Layout & ASCII Wireframes

### 3.1 Desktop Multi-Role Layout
```
+-----------------------------------------------------------------------------------------+
| [LOGO] Recruitment Portal        | Global Search (Ctrl+K)    | (Bell) (3) | [Admin v]   |
+-------------------+---------------------------------------------------------------------+
| SIDEBAR (Fixed)   | BREADCRUMBS: Home > Jobs > JOB-2026-0004 > Review Candidates           |
|                   +---------------------------------------------------------------------+
| * Dashboard       | PAGE HEADER: Senior Fullstack Engineer (Acme Pvt Ltd) [OPEN]        |
| * Companies (12)  | Quick Actions: [Edit Job] [Assign Staff] [Close Requirement]        |
| * Jobs (34)       +---------------------------------------------------------------------+
| * Candidates      | STATS STRIP:                                                        |
|   - Database      | [Positions: 3] [Submitted: 8] [Confirmed: 2] [Remaining: 1 (33%)]   |
|   - Bulk Upload   +---------------------------------------------------------------------+
| * Masters         | TABS: [Mapped Candidates (8)] | [Suggested Matches (Top 50)]        |
| * Reports         +------------------------------------+--------------------------------+
| * Settings        | CANDIDATE LIST (40% Width)         | CANDIDATE RESUME & ACTIONS (60%)|
|                   | - John Doe | Score: 92% | [CONFIRM] | [PDF Viewer Embedded Container]|
|                   |   5 yrs exp | React, Node, MySQL   | Name: John Doe                 |
|                   | - Alice Smith | Score: 85%       | Status: SHORTLISTED            |
|                   |   3 yrs exp | Python, React        | Actions:                       |
|                   |                                    | [Shortlist] [Confirm] [Reject] |
+-------------------+------------------------------------+--------------------------------+
| Footer: v1.0.0 Enterprise Edition | System Status: All Systems Operational              |
+-----------------------------------------------------------------------------------------+
```

### 3.2 Mobile Layout (< 768px)
- Sidebar transforms into a smooth animated **Offcanvas drawer** triggered by a top-left hamburger button.
- Complex split views (such as Candidate List + Resume Preview) collapse into stacked swipeable tabs:
  - Tab 1: Candidate Card summary with one-tap status action sheet.
  - Tab 2: Full-screen modal / preview for resumes.

---

## 4. UI Quality Floor & Accessibility
1. **Focus Rings:** Every interactive button, input, and link has a visible focus ring: `outline: 2px solid #1A44C2; outline-offset: 2px;`.
2. **Contrast Ratio:** Body copy exceeds 7:1 against card backgrounds; badges exceed 4.5:1 (WCAG AA compliant).
3. **Skeleton Loading:** Data tables and dashboard cards render animated placeholder skeletons during API calls, eliminating content layout shifts (CLS < 0.05).
4. **Empty States:** When zero records match a filter, display an explicit icon, descriptive explanation ("No candidates match your experience filter"), and a clear recovery action button ("Reset Filters").
5. **Toast Notifications:** Standardized toast messages:
   - Success: `toast.success('Candidate confirmed successfully')`
   - Warning: `toast.warning('Remark is required to reject')`
   - Error: `toast.error(apiError.message)`
