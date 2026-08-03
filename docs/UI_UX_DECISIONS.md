# 🎨 UI/UX Architecture & Decisions (`docs/UI_UX_DECISIONS.md`)

Design decisions for Virtual Analytical Lab RC1.

---

## 1. Design System Principles
- **Thumb Zone Layout**: Primary actions (`▶ Run Experiment`, `Inject Sample`) in the bottom 1/3 of the screen.
- **60/30/10 Color Hierarchy**:
  - 60% Neutral base (`#0f172a` dark mode, `#ffffff` light mode)
  - 30% Secondary structure (`#1e293b` surfaces, `#475569` text)
  - 10% High-contrast brand accent (`#0284c7` primary, `#22c55e` success)
- **Minimum Touch Targets**: $44\times 44\text{px}$ touch targets for mobile.
- **Accessibility**: Focus ring tokens (`--focus-ring`) meeting WCAG 2.4.11.
