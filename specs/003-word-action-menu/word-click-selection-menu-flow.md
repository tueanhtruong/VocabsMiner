# Word Click → SelectionMenu Anchor Flow

Documents the end-to-end logic for how clicking a word in PassagePanel causes
SelectionMenu to open and stick to that exact word.

---

## Files involved

| File                                 | Role                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| `PassagePanel/index.tsx`             | Orchestrator – wires hooks and child components          |
| `PassagePanel/PassageText.tsx`       | Renders tokenised passage; fires `onWordClick`           |
| `PassagePanel/useWordClick.ts`       | State: `popupState` + `anchorEl`                         |
| `PassagePanel/SelectionMenu.tsx`     | Mantine Menu with a virtual fixed trigger                |
| `PassagePanel/useWordTranslation.ts` | Fires translation request when `popupState.word` changes |

---

## Step-by-step flow

### 1 — User clicks a word

`PassageText` splits each passage segment into tokens and renders every
non-whitespace token as a clickable `<span>` or `<mark>`:

```tsx
// PassageText.tsx
<span onClick={(e) => handleTokenClick(token, e.currentTarget)}>{token}</span>
```

`handleTokenClick` normalises the token (strips punctuation, trims), then
calls the prop:

```ts
onWordClick(normalizedWord, e.currentTarget); // element = the clicked <span>/<mark>
```

---

### 2 — `useWordClick` stores word + DOM element

```ts
// useWordClick.ts
const handleWordClick = useCallback((word: string, element: HTMLElement) => {
  setPopupState({ word }); // { word: "example" }
  setAnchorEl(element); // the exact <span>/<mark> the user clicked
}, []);
```

`PassagePanel` consumes this hook:

```ts
const { popupState, anchorEl, handleWordClick, resetPopupState } =
  useWordClick();
```

---

### 3 — `SelectionMenu` renders when `anchorEl` is set

`SelectionMenu` returns `null` while `anchorEl` is `null`. As soon as
`anchorEl` is truthy the component mounts a **hidden zero-size trigger button**
and opens Mantine's `<Menu>`:

```tsx
// SelectionMenu.tsx  (simplified)
if (!anchorEl) return null;

<Menu
  opened={Boolean(popupState && anchorEl)}
  position="bottom-start"
  floatingStrategy="fixed"
  withinPortal
  zIndex={9999}
>
  <Menu.Target>
    <button ref={triggerRef} style={{ position: "fixed", width: 0, height: 0, … }} />
  </Menu.Target>
  <Menu.Dropdown>…</Menu.Dropdown>
</Menu>
```

---

### 4 — Trigger positioning: ref callback timing

The trigger button must be at the word's viewport coordinates **before**
Floating UI's `useLayoutEffect` runs and computes the dropdown position.

A `useEffect` fires **after** `useLayoutEffect`, so the trigger would still be
at `(0, 0)` when Floating UI reads it — the dropdown would appear at the top of
the screen instead of near the word.

The fix uses a **ref callback** (`useCallback`), which fires during React's
commit phase, before any layout effects:

```ts
// SelectionMenu.tsx
const triggerRef = useCallback(
  (node: HTMLButtonElement | null) => {
    if (node && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      node.style.top = `${rect.bottom}px`; // viewport Y – bottom edge of word
      node.style.left = `${rect.left}px`; // viewport X – left edge of word
    }
  },
  [anchorEl], // re-runs whenever anchorEl changes (new word clicked)
);
```

Execution order on first click:

```
1. React commits DOM  →  trigger button mounts at (0, 0)
2. Ref callbacks fire →  triggerRef(node) positions trigger at (rect.bottom, rect.left) ✓
3. useLayoutEffect    →  Floating UI floating.update() reads trigger at correct pos ✓
4. useEffect          →  translation / intersection-observer effects run
5. Browser paints     →  dropdown appears below the clicked word ✓
```

---

### 5 — Floating UI places the dropdown

`<Menu>` is configured with:

| Prop               | Value            | Effect                                                                                               |
| ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `position`         | `"bottom-start"` | Open below the trigger, left-aligned                                                                 |
| `floatingStrategy` | `"fixed"`        | Use `position: fixed` for the dropdown — escapes all `overflow` containers                           |
| `withinPortal`     | `true`           | Render dropdown in Mantine's shared portal node at `document.body` — avoids clipping by any ancestor |
| `offset`           | `8`              | 8 px gap between trigger bottom and dropdown top                                                     |
| `zIndex`           | `9999`           | Always on top of Drawer (z-index 200) and sticky header (z-index 1000)                               |

The trigger is `position: fixed` with `width: 0 / height: 0`, so Floating UI
sees a zero-size reference point at the bottom-left of the clicked word.
The `flip` middleware promotes to `"top-start"` automatically if there is
insufficient space below.

---

### 6 — Menu content

The dropdown contains two items that are always visible:

1. **Translation item** — disabled/non-interactive, shows the Vietnamese
   translation (streamed from `useWordTranslation` via Google Translate).
2. **Add vocabulary item** — calls `onGenerateDraft` → API draft generation →
   opens the vocabulary form pre-filled.

If the word is already in the vocabulary list (`isSelectedWordDuplicated`) the
Add item is disabled and an amber warning is shown.

---

### 7 — Menu dismissal

The menu closes when:

- The user clicks outside the trigger/dropdown (`clickOutsideEvents:
["mousedown", "touchstart", "keydown"]`)
- `onChange(false)` fires → `onClose()` → `resetPopupState()` → sets
  `popupState = null`, `anchorEl = null` → `SelectionMenu` returns `null`
- The clicked word scrolls out of view: an `IntersectionObserver` (in
  `PassagePanel`) watches `anchorEl` against the scroll container and calls
  `resetPopupState()` when it leaves the viewport.

---

## Drawer mode note

In Drawer mode Mantine's `Drawer.Content` section has
`transform: translateX(0)` applied as an inline transition style. This makes
the section a **CSS containing block for `position: fixed` descendants**, so
the trigger is positioned relative to the section instead of the viewport.

For a left-side drawer that starts at viewport `(0, 0)` the offsets are
identical, so behaviour is correct. The ref-callback fix is still required —
without it the trigger is at `(0, 0)` when Floating UI computes, causing the
dropdown to appear behind the Drawer's sticky header.
