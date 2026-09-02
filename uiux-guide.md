# UI/UX Guide for AI-Built Interfaces

Use this guide as a practical checklist and prompt context when asking an AI agent to design, build, review, or refactor digital products. It combines core UX laws, interaction design principles, accessibility requirements, frontend quality guardrails, visual polish rules, and implementation heuristics so generated interfaces are usable, accessible, responsive, and production-ready.

> **Prime directive:** never optimize only for how the UI looks in a static screenshot. Optimize for user goals, clarity, speed, trust, accessibility, error recovery, responsive behavior, and every interactive state.

---

## 1. AI Design/Build Operating Rules

When building any UI, the AI should follow this sequence:

1. **Understand the user goal** — Who is using this? What are they trying to finish? What is the primary action?
2. **Define hierarchy** — Decide what must be seen first, second, and third.
3. **Reduce choices** — Remove, group, defer, or progressively disclose anything not needed for the immediate task.
4. **Use familiar patterns** — Prefer conventions users already know unless there is a strong reason to innovate.
5. **Design every state** — Default, hover, focus, active, selected, disabled, loading, empty, error, success, offline, long-content, and permission-denied states.
6. **Make it accessible** — Semantic HTML, labels, contrast, keyboard support, screen-reader clarity, reduced motion.
7. **Make it responsive** — Verify at 320px, 768px, 1024px, and 1440px.
8. **Polish details** — Spacing scale, typography, optical alignment, hit areas, animation restraint, icon consistency.
9. **Test the real flow** — Click/tab through the UI, not just inspect code.
10. **Remove AI-looking defaults** — No generic purple gradients, oversized rounded cards, fake dashboards, lorem ipsum, or stock bento grids unless they fit the product.

---

## 2. Core UX Laws and How to Apply Them

### Hick’s Law
**Definition:** The time it takes to make a decision increases with the number and complexity of choices.

**Use it by:**
- Limiting visible primary actions.
- Grouping related options.
- Using defaults and recommendations.
- Hiding advanced settings behind progressive disclosure.
- Breaking complex workflows into steps.

**AI checklist:**
- [ ] Is there only one obvious primary CTA per section?
- [ ] Are secondary actions visually quieter?
- [ ] Can choices be grouped, filtered, or deferred?

---

### Fitts’s Law
**Definition:** Targets are faster to hit when they are larger and closer to the user’s pointer/finger path.

**Use it by:**
- Making common actions large enough.
- Placing primary CTAs near the end of the user’s reading/action path.
- Keeping destructive actions away from frequent actions.
- Ensuring touch targets are at least **44×44px** on mobile and preferably **40×40px+** in dense desktop UIs.

**AI checklist:**
- [ ] Are buttons and controls easy to click/tap?
- [ ] Are frequently used actions closest to where the user already is?
- [ ] Are dangerous actions separated and confirmed?

---

### Miller’s Law
**Definition:** People can hold only a limited number of items in working memory. The classic number is 7±2, but modern UX should usually chunk even more aggressively.

**Use it by:**
- Chunking information into small groups.
- Avoiding long unstructured lists.
- Using summaries, tabs, accordions, cards, and headings.
- Keeping forms short or step-based.

**AI checklist:**
- [ ] Is information chunked into meaningful groups?
- [ ] Are long forms split or visually organized?
- [ ] Does the user have to remember something from a previous screen? If yes, bring it forward.

---

### Gestalt Principles
**Definition:** Users perceive whole patterns before individual parts.

**Use it by:**
- Designing layout relationships intentionally.
- Grouping related controls visually.
- Using consistent spacing, alignment, color, and shape.
- Making hierarchy visible before details.

**AI checklist:**
- [ ] Do related items look related?
- [ ] Do unrelated items have enough separation?
- [ ] Is the page scannable in 3 seconds?

---

### Doherty Threshold
**Definition:** Productivity improves when the system responds within about **400ms**, keeping users in flow.

**Use it by:**
- Showing instant feedback for actions.
- Optimistically updating safe UI changes.
- Using skeletons instead of blank waits.
- Keeping animations short and purposeful.

**AI checklist:**
- [ ] Does every click produce immediate feedback?
- [ ] Are slow operations acknowledged with progress, skeletons, or status text?
- [ ] Are loading states useful, not decorative?

---

### Jakob’s Law
**Definition:** Users spend most of their time on other products, so they expect your product to work like products they already know.

**Use it by:**
- Following platform conventions.
- Using familiar navigation, forms, modals, filters, and menus.
- Avoiding novelty in critical flows.

**AI checklist:**
- [ ] Would this interaction feel familiar to users of similar apps?
- [ ] Are standard patterns used for common tasks?
- [ ] Is innovation reserved for product value, not basic controls?

---

### Zeigarnik Effect
**Definition:** People remember incomplete tasks better than completed ones.

**Use it by:**
- Showing progress indicators.
- Saving drafts.
- Making unfinished steps visible.
- Encouraging return to incomplete workflows.

**AI checklist:**
- [ ] Does the UI show what is done, current, and remaining?
- [ ] Are drafts or unfinished tasks recoverable?
- [ ] Can the user resume without remembering context?

---

### Aesthetic-Usability Effect
**Definition:** Users often perceive attractive interfaces as easier to use.

**Use it by:**
- Creating visual harmony without sacrificing clarity.
- Using spacing, typography, rhythm, and contrast carefully.
- Avoiding visual noise and inconsistent styling.

**AI checklist:**
- [ ] Does polish improve trust and comprehension?
- [ ] Is beauty supporting usability rather than hiding complexity?
- [ ] Are visual details consistent across the product?

---

### Pareto Principle / 80-20 Rule
**Definition:** A small number of features or actions often produce most user value.

**Use it by:**
- Prioritizing the top user tasks.
- Making the most-used 20% of actions fastest.
- Removing or demoting rarely used controls.

**AI checklist:**
- [ ] What are the top 1–3 user actions?
- [ ] Are they prominent and fast?
- [ ] Are edge-case tools available but not dominant?

---

### Serial Position Effect
**Definition:** Users remember the first and last items in a sequence better than the middle.

**Use it by:**
- Putting the most important navigation items first or last.
- Starting pages with a strong orientation.
- Ending flows with clear confirmation and next step.

**AI checklist:**
- [ ] Are critical items placed at memorable positions?
- [ ] Is the page opening clear?
- [ ] Does the final state tell the user what happened and what to do next?

---

### Tesler’s Law / Law of Complexity Conservation
**Definition:** Every system has irreducible complexity. If the product hides it from users, the design or engineering must absorb it.

**Use it by:**
- Simplifying user-facing workflows.
- Automating defaults carefully.
- Keeping advanced complexity available when needed.
- Not oversimplifying to the point of losing control or trust.

**AI checklist:**
- [ ] What complexity can the system handle for the user?
- [ ] What complexity must remain visible for trust or control?
- [ ] Are advanced options accessible without overwhelming beginners?

---

### Postel’s Law / Robustness Principle
**Definition:** Be liberal in what you accept and conservative in what you send.

**Use it by:**
- Accepting forgiving input formats.
- Handling typos, spaces, casing, and partial entries where safe.
- Returning clear, structured, predictable outputs.
- Never letting malformed input crash the UI.

**AI checklist:**
- [ ] Are inputs forgiving?
- [ ] Are validation messages helpful and specific?
- [ ] Does the UI recover gracefully from bad input or network failures?

---

### Parkinson’s Law
**Definition:** Work expands to fill the time available.

**Use it by:**
- Setting visible time boundaries.
- Encouraging focused completion.
- Avoiding unnecessarily long setup flows.
- Using deadlines, timers, or lightweight constraints when useful.

**AI checklist:**
- [ ] Can the user complete the task quickly?
- [ ] Are unnecessary steps removed?
- [ ] Does the UI help users move forward instead of endlessly configure?

---

### Von Restorff Effect / Isolation Effect
**Definition:** An item that stands out is more likely to be remembered.

**Use it by:**
- Making the primary CTA visually distinct.
- Highlighting critical alerts, selected states, and recommended choices.
- Avoiding too many highlights, which destroys contrast.

**AI checklist:**
- [ ] Is the most important thing visually distinct?
- [ ] Are highlights rare and meaningful?
- [ ] Are destructive highlights reserved for true risk?

---

### Law of Proximity
**Definition:** Items close together are perceived as related.

**Use it by:**
- Placing labels close to inputs.
- Grouping controls with their content.
- Increasing spacing between unrelated sections.

**AI checklist:**
- [ ] Are labels, controls, and help text visually connected?
- [ ] Is spacing used to communicate relationships?

---

### Law of Similarity
**Definition:** Items that look similar are perceived as having similar function or importance.

**Use it by:**
- Keeping same-level actions visually consistent.
- Using different styles for different types of actions.
- Avoiding visual similarity between safe and destructive actions.

**AI checklist:**
- [ ] Do similar elements behave similarly?
- [ ] Are different actions visually distinct enough?

---

### Law of Common Region
**Definition:** Items enclosed in the same boundary are perceived as grouped.

**Use it by:**
- Using cards, panels, fieldsets, rows, and containers intentionally.
- Avoiding unnecessary boxes around everything.
- Using common regions for meaningful groups only.

**AI checklist:**
- [ ] Does each card/panel represent one coherent concept?
- [ ] Are there too many boxes causing visual clutter?

---

### Law of Prägnanz
**Definition:** People interpret complex images in the simplest possible form.

**Use it by:**
- Simplifying layout shapes.
- Reducing competing visual treatments.
- Using clean alignment and predictable structure.

**AI checklist:**
- [ ] Can the layout be understood at a glance?
- [ ] Are decorative details making comprehension harder?

---

### Law of Continuity
**Definition:** The eye follows lines, curves, and paths, perceiving continuous patterns.

**Use it by:**
- Aligning content to guide reading flow.
- Keeping forms and tables visually linear.
- Avoiding broken alignment that interrupts scanning.

**AI checklist:**
- [ ] Does the user’s eye naturally move through the flow?
- [ ] Are related items aligned along a clear path?

---

### Law of Closure
**Definition:** People mentally complete incomplete shapes or patterns.

**Use it by:**
- Using partial visual cues carefully.
- Designing recognizable icons and progress indicators.
- Avoiding ambiguous incomplete UI elements.

**AI checklist:**
- [ ] Are icons and visual metaphors recognizable?
- [ ] Are partial states clear, not confusing?

---

## 3. Extra UX Laws and Heuristics Worth Applying

### Nielsen’s Usability Heuristics
- Show system status.
- Match real-world language.
- Give user control and undo.
- Stay consistent.
- Prevent errors before they happen.
- Prefer recognition over recall.
- Support shortcuts for expert users.
- Keep design minimal.
- Help users recognize, diagnose, and recover from errors.
- Provide help when needed.

### Law of Least Astonishment
Interfaces should behave the way users reasonably expect. Avoid surprising defaults, hidden destructive behavior, or unconventional controls in critical flows.

### Peak-End Rule
Users judge experiences disproportionately by the emotional peak and ending. Make stressful moments reassuring and final confirmations clear.

### Goal-Gradient Effect
People move faster as they feel closer to completion. Use progress bars, step counts, and completion cues in multi-step flows.

### Cognitive Load Theory
Reduce intrinsic, extraneous, and memory load. Prefer clear labels, examples, defaults, and inline guidance.

### Progressive Disclosure
Show essential controls first. Reveal advanced controls only when relevant.

### Recognition Over Recall
Make options visible or searchable. Do not force users to remember codes, prior settings, hidden commands, or earlier context.

### Error Prevention Over Error Messaging
Prevent invalid actions where possible. Disable impossible actions with explanation, confirm destructive actions, and validate early.

### Forgiveness and Recovery
Support undo, autosave, draft recovery, retry, back navigation, and non-destructive exploration.

---

## 4. Information Architecture Rules

### Navigation
- Use clear labels, not clever labels.
- Keep primary navigation stable.
- Highlight the current location.
- Put high-frequency destinations first.
- Use breadcrumbs for deep hierarchies.
- Do not hide essential navigation behind mystery icons.

### Page Structure
Every page should answer:
1. Where am I?
2. What can I do here?
3. What should I do next?
4. What changed after my action?

### Content Hierarchy
- One `h1` per page.
- Use `h2` for major sections and `h3` for subsections.
- Do not skip heading levels for styling.
- Put the most important content above secondary details.
- Use summaries before dense detail.

### Scannability
- Use meaningful headings.
- Keep paragraphs short.
- Use bullets for lists.
- Use tables for comparison.
- Use whitespace to separate concepts.
- Use visual emphasis sparingly.

---

## 5. Interaction Design Rules

### Buttons and Actions
- One primary action per decision area.
- Primary buttons should use strong contrast.
- Secondary buttons should be quieter.
- Destructive actions need clear labeling and often confirmation.
- Button labels should be verbs: `Save invoice`, `Invite member`, `Delete file`.
- Avoid vague labels like `Submit`, `OK`, or `Click here` when context is weak.

### Forms
- Label every input.
- Keep labels visible; avoid placeholder-only labels.
- Group related fields.
- Use inline validation after user interaction, not before typing.
- Explain required formatting with examples.
- Preserve input after errors.
- Support autofill where appropriate.
- Use the correct input type: `email`, `tel`, `url`, `number`, `date`, `search`.
- Show password requirements before failure.
- Prefer one-column forms for readability.

### Modals and Dialogs
- Use modals only for focused interruptions.
- Trap focus inside the modal.
- Return focus to the trigger on close.
- Support Escape to close when safe.
- Make destructive confirmations explicit.
- Avoid stacking multiple modals.

### Tables and Data Dense UI
- Align numbers right and text left.
- Use tabular numbers for changing or comparable values.
- Keep headers sticky for long tables when useful.
- Support sorting, filtering, and search.
- Make empty states actionable.
- Show units in headers or values consistently.

### Search and Filters
- Search should tolerate casing, spacing, and partial matches.
- Show active filters clearly.
- Let users remove filters individually and all at once.
- Avoid zero-result dead ends; suggest recovery.

---

## 6. Visual Design System Rules

### Design Tokens
Prefer semantic tokens over raw values:

```css
/* Good */
background: var(--color-background);
color: var(--color-foreground);
border-color: var(--color-border);

/* Avoid */
background: #ffffff;
color: #111827;
border-color: #e5e7eb;
```

Recommended token categories:
- `background`, `foreground`
- `card`, `card-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `ring`, `input`
- `success`, `warning`, `info`

### Color
- Maintain contrast: **4.5:1** for normal text, **3:1** for large text and UI components.
- Do not rely only on color for meaning.
- Reserve saturated colors for actions, status, or emphasis.
- Support dark mode intentionally, not by inverting everything.
- Prefer OKLCH/HSL token systems over scattered hex codes.

### Typography
- Define display, heading, body, label, caption, and code styles.
- Use `text-wrap: balance` for headings.
- Use `text-wrap: pretty` for long body copy where supported.
- Use tabular numbers for prices, timers, metrics, counters, and financial values.
- Use consistent line height: tighter for headings, relaxed for body.
- Avoid tiny low-contrast text.

### Spacing
- Use a consistent spacing scale, usually 4px increments.
- Related items should be closer than unrelated items.
- Padding should match component density.
- Avoid arbitrary one-off values unless there is an optical reason.

### Radius
Use concentric border radius:

```text
outer radius = inner radius + padding
```

Example: if an inner button has `8px` radius and the card padding is `8px`, the outer card should be around `16px` radius.

### Shadows and Borders
- Use borders for structure and state.
- Use shadows for elevation.
- Keep shadows subtle and layered.
- Avoid heavy shadow stacks that make the UI look template-generated.

### Icons
- Use one icon family per surface.
- Match icon stroke to text weight: around `1.5px` with regular text, `2px` with semibold.
- Use `currentColor` so icons inherit state.
- Use outline icons by default; filled icons can indicate active state.
- Provide accessible labels for icon-only buttons.

---

## 7. Motion and Micro-Interaction Rules

### Timing
- Instant feedback for controls: 0–100ms.
- Hover/focus transitions: 100–150ms.
- Small UI transitions: 150–250ms.
- Larger entrances: 250–350ms.
- Avoid long animations in productivity flows.

### Easing
- Prefer natural easing such as `cubic-bezier(0.2, 0, 0, 1)`.
- Use `ease-out` for entrances.
- Use subtle exits; exits should usually be faster and less dramatic.

### Animation Properties
Animate only performant properties:
- `transform`
- `opacity`
- `filter` carefully

Avoid animating layout-heavy properties:
- `height`
- `width`
- `top/left`
- `margin`
- `padding`

### Rules
- Never use `transition: all`.
- Make animations interruptible for hover/focus/press states.
- Use `scale(0.96)` for tactile press feedback; do not go below `0.95`.
- Do not animate high-frequency actions in distracting ways.
- Respect `prefers-reduced-motion`.
- Motion must not be the only feedback channel.

---

## 8. Accessibility Requirements

### Semantic HTML
Prefer native elements:
- Use `<button>` for actions.
- Use `<a>` for navigation.
- Use `<label>` for form labels.
- Use proper heading levels.
- Use lists for lists and tables for tabular data.

### Keyboard
- Everything interactive must be reachable by Tab.
- Focus order must match visual order.
- Focus indicators must be visible.
- Enter/Space should activate buttons.
- Escape should close dismissible overlays when safe.
- Arrow keys should work in menus, tabs, comboboxes, and listboxes where appropriate.

### Screen Readers
- Icon-only buttons need `aria-label`.
- Dynamic status changes need `role="status"` or `aria-live` where appropriate.
- Error messages should be connected to fields with `aria-describedby`.
- Invalid fields should use `aria-invalid="true"`.
- Avoid noisy live regions.

### Contrast and Visual Accessibility
- Normal text: at least 4.5:1 contrast.
- Large text and UI boundaries: at least 3:1.
- Do not communicate state only through color.
- Avoid thin text on dark backgrounds.
- Maintain visible focus states in both light and dark themes.

### Reduced Motion
Use:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Responsive Design Rules

### Mobile First
Start with the smallest useful layout, then enhance:

```text
320px  → core content, single column, large tap targets
768px  → two-column opportunities, persistent navigation if useful
1024px → richer layout, side panels, tables
1440px → max-width constraints, better density, no stretched content
```

### Rules
- Avoid horizontal scrolling except for intentional data tables.
- Keep touch targets large enough.
- Stack complex panels on mobile.
- Use responsive typography and spacing.
- Do not let line lengths become too wide; aim around 45–75 characters for prose.
- Test with real content, long names, empty data, and error states.

---

## 10. Performance and Perceived Speed

### Core Rules
- Keep interaction feedback under 100ms where possible.
- Keep main flow response under the Doherty Threshold when possible.
- Use skeletons for content loading.
- Use optimistic updates only when rollback is safe.
- Avoid layout shifts.
- Lazy-load below-the-fold media.
- Compress images and use correct dimensions.
- Prefer CSS transforms/opacity for animation.

### Loading States
Good loading states:
- Preserve layout shape.
- Explain what is loading if wait is long.
- Avoid blocking the whole page unnecessarily.
- Do not use spinners where skeletons would communicate structure better.

### Empty States
Every empty state should include:
1. What happened.
2. Why it matters.
3. What the user can do next.

Example:

```text
No projects yet
Create your first project to organize files, tasks, and notes in one place.
[Create project]
```

### Error States
Every error should include:
1. Human-readable problem.
2. Recovery action.
3. Whether data is safe.
4. Contact/debug details only when useful.

Bad: `Error 500`

Good: `We couldn’t save your changes. Your draft is still here. Check your connection and try again.`

---

## 11. Frontend Implementation Quality

### Component Architecture
- Prefer composition over over-configured components.
- Keep components focused.
- Separate data-fetching containers from presentational components.
- Colocate component tests, stories, hooks, and types when appropriate.
- Split components that exceed roughly 200 lines unless there is a strong reason.

### State Management
Use the simplest state model that works:

```text
useState              → local UI state
lifted state          → 2–3 related components
context               → theme/auth/locale/read-heavy app state
URL search params     → filters, tabs, pagination, shareable state
React Query/SWR       → server state and caching
global store          → complex shared client state
```

### Forms and Validation
- Use schema validation where possible.
- Validate client-side for speed and server-side for correctness.
- Do not erase user input after failure.
- Disable submit only when the reason is obvious, or show the reason.
- Show success confirmation after submit.

### Code Quality
- Use semantic names.
- Keep design tokens centralized.
- Avoid inline styles unless dynamic values require them.
- Avoid duplicate layout systems.
- Avoid introducing a new styling library into an existing project without need.
- Match project conventions before adding patterns.

---

## 12. Tailwind / Utility CSS Rules

If using Tailwind:

- Prefer semantic component tokens when available.
- Use `size-*` for square icon buttons in Tailwind v4.
- Use responsive utilities mobile-first.
- Use `focus-visible:*` for keyboard focus.
- Use `disabled:pointer-events-none disabled:opacity-50` carefully; disabled controls may still need explanation.
- Use `motion-safe:` and `motion-reduce:` for animation.
- Avoid arbitrary values unless they map to a real design need.
- Avoid giant unreadable class strings; extract variants with CVA or a component abstraction.

Example button baseline:

```tsx
<button className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96]">
  Save changes
</button>
```

---

## 13. Anti-AI-Aesthetic Checklist

Avoid these unless explicitly part of the brand:

- Purple/indigo gradient hero sections everywhere.
- Excessive glassmorphism.
- Random glowing blobs.
- Over-rounded `rounded-2xl` cards everywhere.
- Shadow-heavy cards with no hierarchy.
- Generic bento grids that do not match content priority.
- Fake metrics and fake testimonials.
- Placeholder lorem ipsum.
- Same spacing for every section.
- Icons from mixed libraries.
- Dashboards full of charts with no decisions attached.
- Decorative badges that do not communicate useful status.

Replace with:

- Product-specific information hierarchy.
- Realistic content and edge cases.
- Clear user path.
- Brand-appropriate color and type.
- Purposeful layout, not template layout.
- Fewer, stronger visual decisions.

---

## 14. Conversion and Product UX Rules

### Landing Pages
- Lead with the specific user pain and outcome.
- Make the hero section answer: what is this, who is it for, why should I care?
- Use one primary CTA.
- Show proof before asking for trust.
- Use concrete benefits, not vague adjectives.
- Handle objections near the CTA.
- Make pricing/scope clear when relevant.

### SaaS/Product Flows
- Optimize onboarding for first value, not account setup.
- Use sample data where empty dashboards would feel dead.
- Explain permissions before requesting them.
- Let users skip non-critical setup.
- Celebrate meaningful completion, not every tiny action.

### E-commerce/Booking
- Keep price, availability, delivery/slot, and cancellation policy visible.
- Avoid surprise costs late in checkout.
- Make comparison easy.
- Preserve cart/session state.
- Make support and refund paths findable.

---

## 15. Trust, Safety, and Ethical UX

- Do not use dark patterns.
- Do not hide cancellation or destructive consequences.
- Do not preselect paid add-ons without clear consent.
- Do not create fake scarcity or fake social proof.
- Distinguish actual results from goals or projections.
- Be transparent about AI-generated outputs and uncertainty when relevant.
- Protect user data with clear permission boundaries.
- Ask only for information needed for the task.

---

## 16. UI Review Checklist for AI Agents

Before saying a UI is done, verify:

### UX
- [ ] Primary user goal is obvious.
- [ ] Primary CTA is clear.
- [ ] Choices are reduced or grouped.
- [ ] Navigation is predictable.
- [ ] User always knows current state.
- [ ] Errors are preventable or recoverable.

### Visual Design
- [ ] Uses design tokens or a consistent style system.
- [ ] Typography hierarchy is clear.
- [ ] Spacing follows a scale.
- [ ] Related items are grouped by proximity/common region.
- [ ] Icons are consistent.
- [ ] No generic AI aesthetic.

### Accessibility
- [ ] Semantic HTML.
- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Labels are connected to inputs.
- [ ] Contrast passes WCAG AA.
- [ ] Screen-reader-only labels exist for icon-only controls.
- [ ] Reduced motion is respected.

### Responsive
- [ ] Works at 320px.
- [ ] Works at 768px.
- [ ] Works at 1024px.
- [ ] Works at 1440px.
- [ ] No unintended horizontal overflow.

### States
- [ ] Loading.
- [ ] Empty.
- [ ] Error.
- [ ] Success.
- [ ] Disabled.
- [ ] Hover.
- [ ] Focus.
- [ ] Active/pressed.
- [ ] Long content.
- [ ] No permissions/offline if relevant.

### Performance
- [ ] No major layout shift.
- [ ] Images are optimized.
- [ ] Interactions provide quick feedback.
- [ ] Animations use transform/opacity.
- [ ] No `transition: all`.

---

## 17. AI Prompt Template for Building Better UI

Copy this into UI-building prompts:

```md
Build this UI with production-quality UX and visual design.

Follow these rules:
- Apply Hick’s Law: reduce visible choices and make the primary action obvious.
- Apply Fitts’s Law: make frequent actions large, close, and easy to hit.
- Apply Miller’s Law: chunk information; do not overload working memory.
- Apply Gestalt principles: use proximity, similarity, common region, continuity, closure, and prägnanz to create clear structure.
- Apply Jakob’s Law: use familiar patterns for navigation, forms, modals, and controls.
- Apply Doherty Threshold: every interaction should show feedback quickly; use skeletons/optimistic UI where appropriate.
- Apply Aesthetic-Usability Effect: make the UI polished, but never at the cost of clarity.
- Apply Tesler’s Law: absorb complexity in the system where possible; reveal advanced controls only when needed.
- Apply Postel’s Law: accept forgiving input and show helpful validation.
- Apply Von Restorff Effect: make only the most important CTA or status stand out.

Implementation requirements:
- Use semantic HTML.
- Make all controls keyboard-accessible.
- Add visible focus states.
- Use accessible labels and ARIA only where needed.
- Meet WCAG AA contrast.
- Respect prefers-reduced-motion.
- Use design tokens/semantic colors.
- Use a consistent spacing and typography scale.
- Design loading, empty, error, success, disabled, hover, focus, active, and long-content states.
- Make it responsive at 320px, 768px, 1024px, and 1440px.
- Avoid generic AI aesthetics: no random purple gradients, fake bento dashboards, oversized rounded cards, or placeholder content.
- Verify the real interaction flow before calling it complete.
```

---

## 18. Quick Law-to-Design Mapping

| Law / Principle | Design Action |
|---|---|
| Hick’s Law | Reduce and group choices |
| Fitts’s Law | Larger, closer targets for frequent actions |
| Miller’s Law | Chunk information |
| Gestalt | Make relationships visible |
| Doherty Threshold | Feedback within flow-preserving speed |
| Jakob’s Law | Use familiar product patterns |
| Zeigarnik Effect | Show progress and incomplete tasks |
| Aesthetic-Usability | Polish increases perceived usability |
| Pareto Principle | Prioritize top user tasks |
| Serial Position | Put key items first/last |
| Tesler’s Law | Move complexity away from users carefully |
| Postel’s Law | Forgiving input, predictable output |
| Parkinson’s Law | Reduce unnecessary time/steps |
| Von Restorff | Highlight one important thing |
| Proximity | Place related items close |
| Similarity | Same look means same role |
| Common Region | Containers imply grouping |
| Prägnanz | Simplify visual interpretation |
| Continuity | Align flows for natural scanning |
| Closure | Use recognizable partial forms carefully |

---

## 19. Final Acceptance Standard

A UI is not complete until it is:

- **Useful:** solves the user’s actual task.
- **Clear:** hierarchy and next action are obvious.
- **Fast:** feedback is immediate and loading is handled.
- **Accessible:** keyboard, contrast, labels, and screen readers work.
- **Responsive:** mobile, tablet, laptop, and desktop layouts are intentional.
- **Forgiving:** errors are prevented, explained, and recoverable.
- **Polished:** spacing, typography, motion, icons, radius, and surfaces feel deliberate.
- **Trustworthy:** no fake proof, dark patterns, or misleading states.
- **Implemented cleanly:** follows project conventions and design tokens.
- **Verified:** tested through real user paths and edge states.

If any of these are missing, the AI should keep iterating instead of declaring the UI done.
