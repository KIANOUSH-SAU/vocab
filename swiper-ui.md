# Nibble-style Swiping Vocabulary UI — Build Spec

A complete specification for a swipe-based vocabulary learning screen inspired by the Nibble app. Use this file as a single source of truth when implementing the UI in React, React Native, SwiftUI, or plain HTML.

The deliverable is one screen: a stack of vocabulary cards the user drags left ("still learning") or right ("I know it"), with a tap-to-flip reveal of the translation, a progress bar, a streak counter, and a completion screen.

---

## 1. Goals and feel

The screen should feel calm, modern, and playful — closer to a journaling app than to a flashcard tool. One accent color carries the whole interface; everything else is whitespace and one soft neutral. The interaction should feel physical: cards rotate as you drag, "Got it" / "Study" stamps fade in as you cross intent, and a swipe past the threshold lets the card fly off with momentum.

Avoid: rainbow palettes, drop shadows everywhere, multiple competing accent colors, dense typography, icon-heavy chrome.

---

## 2. Design tokens

### Colors

| Token          | Hex                    | Use                                                                     |
| -------------- | ---------------------- | ----------------------------------------------------------------------- |
| `--brand-50`   | `#EEEDFE`              | Soft purple fills (pills, streak chip, close-button bg, completion orb) |
| `--brand-100`  | `#E0DCF1`              | Inactive progress segments                                              |
| `--brand-300`  | `#7F77DD`              | Current progress segment                                                |
| `--brand-600`  | `#534AB7`              | Primary purple — brand accent, primary button, translation text         |
| `--brand-800`  | `#3C3489`              | Headings inside the phone, pill text                                    |
| `--canvas`     | `#FAF8FF`              | Phone background (warm lavender white)                                  |
| `--surface`    | `#FFFFFF`              | Card surface                                                            |
| `--ink`        | `#1A1733`              | Main word color                                                         |
| `--ink-2`      | `#6B6585`              | Secondary text (phonetic, example sentence)                             |
| `--ink-3`      | `#9994B0`              | Tertiary text (hints, labels, stat labels)                              |
| `--rule`       | `rgba(83,74,183,0.12)` | Hairline dividers inside cards                                          |
| `--border`     | `rgba(83,74,183,0.16)` | Card and stat-card borders                                              |
| `--success-bg` | (white card stamp)     | "Got it" stamp background `rgba(255,255,255,0.92)`                      |
| `--success-fg` | `#0F6E56`              | "Got it" stamp text + border                                            |
| `--warn-bg`    | `#FAECE7`              | "Still learning" button background                                      |
| `--warn-fg`    | `#993C1D`              | "Still learning" button text + "Study" stamp                            |

The host page background sits behind the phone shell — use a neutral surface color from the host design system (e.g. `--color-background-secondary`) so the phone reads as a mockup.

### Typography

Two weights only: 400 regular, 500 medium. No 600 / 700.

| Element                      | Size | Weight | Family       | Notes                                                                     |
| ---------------------------- | ---- | ------ | ------------ | ------------------------------------------------------------------------- |
| Word (hero)                  | 42px | 500    | sans         | letter-spacing -0.015em, line-height 1.05                                 |
| Translation reveal           | 23px | 500    | sans         | brand-600 color                                                           |
| Section heading (completion) | 24px | 500    | sans         | brand-800 color                                                           |
| Stat value                   | 22px | 500    | sans         | brand-800 color                                                           |
| Button label                 | 15px | 500    | sans         | —                                                                         |
| Body / example sentence      | 14px | 400    | serif italic | bolded foreign word inside example uses brand-600, weight 500, not italic |
| Phonetic                     | 15px | 400    | serif italic | ink-2 color                                                               |
| Pill / label                 | 11px | 500    | sans         | uppercase, letter-spacing 0.09em                                          |
| Hint row                     | 11px | 400    | sans         | ink-3 color                                                               |

Sentence case everywhere. No all-caps except the small 11px pill/label text where letter-spacing makes it readable.

### Spacing, radii, sizing

| Token                   | Value                             |
| ----------------------- | --------------------------------- |
| Phone width             | 360px                             |
| Phone outer radius      | 36px                              |
| Phone padding           | 18px sides, 18px top, 22px bottom |
| Card radius             | 24px                              |
| Card padding            | 24px                              |
| Card stack height       | 430px                             |
| Button radius           | 18px                              |
| Button height           | 56px                              |
| Pill / chip radius      | 999px                             |
| Stat card radius        | 14px                              |
| Close button            | 34px square circle, brand-50 fill |
| Streak chip             | 5px 10px padding, brand-50 fill   |
| Progress segment height | 6px                               |
| Progress segment gap    | 4px                               |
| Stamp padding           | 6px 14px                          |
| Stamp radius            | 8px                               |

### Depth in the card stack

No drop shadows on cards. Depth is conveyed by:

1. Visible 0.5px border on every card (`--border`).
2. Cards behind the top one are translated down 8px per layer and scaled to `1 - depth * 0.04`.
3. Cards beyond depth 2 are hidden (opacity 0).

This keeps the surface flat while still reading as a stack.

---

## 3. Layout structure

```
[shell — host secondary bg, lg radius, 28px vertical padding, centers the phone]
  [phone — 360 wide, canvas bg, 36px radius, 0.5px border, overflow hidden, position: relative]
    [top bar — flex row, 10px gap, 16px bottom margin]
      [close button — 34px circle, brand-50 fill, ti-x icon]
      [progress — flex 1, row of segments with 4px gap]
      [streak chip — flame icon + count, brand-50 fill]
    [card stack — position relative, 430px tall, contains 1–3 absolutely-positioned cards]
      [card] ... [card] ... [top card]
    [hint row — small text, 3 columns: left-arrow + Still learning | tap-to-flip | I know it + right-arrow]
    [action row — flex row, 12px gap]
      [Still learning button — warn-bg, warn-fg, bookmark icon]
      [I know it button — brand-600, white text, check icon]
    [completion overlay — absolute inset 0, canvas bg, hidden until session ends]
      [orb — 88px circle, brand-50, trophy icon]
      [title — "Session complete"]
      [subtitle — one calm line]
      [stats row — 3 stat cards: Known / Review / Minutes]
      [restart link]
```

The completion overlay is in normal flow but positioned absolutely over the phone interior. Don't use `position: fixed` — many embed environments collapse it.

---

## 4. Card anatomy

Each card, top to bottom:

1. **Part-of-speech pill** — small uppercase chip aligned left, brand-50 fill with brand-800 text. Example: `Noun · Spanish`.
2. **Word** — the big hero. 42px, weight 500, ink color. Anchored at top so the card silhouette feels stable as you swipe.
3. **Phonetic** — IPA-style transcription in serif italic, ink-2.
4. **Hairline divider** — 1px, `--rule`, with 20px space above and 14px below.
5. **"Translation" label** — 11px uppercase ink-3, sits on its own.
6. **Translation text** — 23px brand-600, weight 500. Hidden by default (`opacity: 0; transform: translateY(6px)`). When the card has the `flipped` class, it animates in over 300ms.
7. **Example sentence** — pushed to the bottom with `margin-top: auto`. Serif italic, ink-2, with the foreign word wrapped in `<b>` styled as brand-600 / weight 500 / not italic.
8. **"Tap to reveal translation" hint** — absolutely positioned 84px from the card bottom, fades out when flipped.
9. **Two swipe stamps** — `Got it` (top-right, rotate +12°, success-fg) and `Study` (top-left, rotate -12°, warn-fg). Both `opacity: 0` until the user drags.

The example sentence is intentionally always visible. It provides context without revealing the meaning, because it uses the foreign word itself, not the translation.

---

## 5. Interaction model

### Drag

Use Pointer Events so mouse and touch share one code path. On the top card:

- `pointerdown`: capture pointer, record start `(sx, sy)`, set `dragging = true`, set `moved = false`, add a `.dragging` class that disables CSS transitions.
- `pointermove`: compute `dx = clientX - sx`, `dy = clientY - sy`. If either exceeds 5px, mark `moved = true`. Apply `transform: translate(dx, dy * 0.3) rotate(dx * 0.06deg)` — the dampened vertical movement and gentle rotation are what make it feel physical. Set right-stamp opacity to `min(1, |dx|/120)` when `dx > 0`, left-stamp otherwise.
- `pointerup` / `pointercancel`:
  - If not `moved`: toggle the `.flipped` class on the card (tap).
  - Else if `|dx| > 110`: commit the swipe — see below.
  - Else: clear the inline transform and stamp opacities; CSS transition springs the card back.

### Commit (swipe-out)

Add `.gone-r` or `.gone-l` to the card. CSS:

```
.card.gone-r { transform: translateX(540px) rotate(22deg) !important; opacity: 0; }
.card.gone-l { transform: translateX(-540px) rotate(-22deg) !important; opacity: 0; }
```

Transition duration: 340ms with `cubic-bezier(.2, .8, .2, 1)`.

After the transition (set a 340ms `setTimeout`), advance the index. If finished, show the completion overlay. Otherwise re-render the stack so the next card becomes the new top.

### Tap to flip

Detected inside `pointerup` when `moved === false`. Toggles a `.flipped` class that fades the translation in and the hint out. No 3D flip — just a fade so the layout doesn't jump.

### Buttons

The bottom two buttons call the same `swipeOut(-1)` / `swipeOut(+1)` function the gesture commits to. This way every analytics event and side effect runs through one path.

### Streak rules

- Right swipe ("I know it"): increment `streak`, increment `known`.
- Left swipe ("Still learning"): reset `streak` to 0, increment `review`.

These are placeholder rules — replace with whatever your spaced-repetition model needs.

---

## 6. State machine

For a React port, the hook returns:

```ts
type CardState = {
  cards: VocabCard[]; // immutable for the session
  index: number; // current top card
  streak: number;
  known: number;
  review: number;
  flippedIds: Set<string>; // which cards have been flipped at least once
  status: "active" | "complete";
};

type Actions = {
  markKnown: () => void; // calls swipeOut(+1)
  markReview: () => void; // calls swipeOut(-1)
  flipCurrent: () => void;
  restart: () => void;
  abort: () => void; // close-button handler
};
```

Drag math (current `dx`, stamp opacities, rotation) is local view state inside the card component — it never enters the hook. The hook only learns about a swipe when it commits.

Progress segments are derived: `cards.map((_, i) => i < index ? 'done' : i === index ? 'current' : 'pending')`.

---

## 7. Accessibility

- Add a visually-hidden `<h2>` describing the screen for screen readers, e.g. "Vocabulary practice: swipe right to mark as known, left to keep studying, tap a card to reveal its translation."
- Both buttons must be keyboard-reachable and labeled. They duplicate the swipe gesture so the screen is usable without a pointer.
- Tabler icons (`<i class="ti ti-x">`, `ti-flame`, `ti-pointer`, `ti-bookmark`, `ti-check`, `ti-trophy`, `ti-arrow-left`, `ti-arrow-right`) are decorative — give each `aria-hidden="true"` and rely on the surrounding text. Icon-only buttons (the close button) need an `aria-label`.
- Provide `prefers-reduced-motion` support: shorten the swipe transition to 0ms and skip the rotation when set.
- Don't rely on color alone for the success / warning states — the stamp text and button labels carry the meaning too.

---

## 8. Reference implementation (HTML / CSS / JS)

A single self-contained file. Drop this into an empty HTML page to verify the visuals before porting to your framework.

```html
<h2 class="sr-only">
  Vocabulary practice: swipe right to mark as known, left to keep studying, tap
  to reveal the translation.
</h2>
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .nv-shell {
    background: #f3f1ec;
    border-radius: 12px;
    padding: 28px 0;
    display: flex;
    justify-content: center;
    font-family: system-ui, sans-serif;
  }
  .nv-phone {
    width: 360px;
    background: #faf8ff;
    border-radius: 36px;
    border: 0.5px solid rgba(0, 0, 0, 0.08);
    padding: 18px 18px 22px;
    position: relative;
    overflow: hidden;
  }
  .nv-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0 16px;
  }
  .nv-close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eeedfe;
    color: #3c3489;
    border: none;
    cursor: pointer;
    font-size: 17px;
  }
  .nv-progress {
    flex: 1;
    display: flex;
    gap: 4px;
  }
  .nv-pseg {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #e0dcf1;
    transition: background 0.25s;
  }
  .nv-pseg.done {
    background: #534ab7;
  }
  .nv-pseg.curr {
    background: #7f77dd;
  }
  .nv-streak {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 500;
    color: #3c3489;
    background: #eeedfe;
    padding: 5px 10px;
    border-radius: 999px;
  }
  .nv-streak i {
    font-size: 15px;
    color: #d85a30;
  }
  .nv-stack {
    position: relative;
    height: 430px;
    margin: 4px 0 14px;
  }
  .nv-card {
    position: absolute;
    inset: 0;
    background: #fff;
    border-radius: 24px;
    border: 0.5px solid rgba(83, 74, 183, 0.16);
    padding: 24px;
    display: flex;
    flex-direction: column;
    transition:
      transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 0.25s;
    touch-action: none;
    user-select: none;
    will-change: transform;
    cursor: grab;
  }
  .nv-card.dragging {
    transition: none;
    cursor: grabbing;
  }
  .nv-card.gone-r {
    transform: translateX(540px) rotate(22deg) !important;
    opacity: 0;
  }
  .nv-card.gone-l {
    transform: translateX(-540px) rotate(-22deg) !important;
    opacity: 0;
  }
  .nv-pos {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #3c3489;
    background: #eeedfe;
    padding: 5px 11px;
    border-radius: 999px;
  }
  .nv-word {
    font-size: 42px;
    font-weight: 500;
    color: #1a1733;
    margin: 20px 0 6px;
    line-height: 1.05;
    letter-spacing: -0.015em;
  }
  .nv-phon {
    font-size: 15px;
    color: #6b6585;
    font-family: Georgia, serif;
    font-style: italic;
  }
  .nv-divider {
    height: 1px;
    background: rgba(83, 74, 183, 0.12);
    margin: 20px 0 14px;
  }
  .nv-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #9994b0;
    margin-bottom: 6px;
  }
  .nv-trans {
    font-size: 23px;
    font-weight: 500;
    color: #3c3489;
    line-height: 1.25;
    opacity: 0;
    transform: translateY(6px);
    transition:
      opacity 0.3s,
      transform 0.3s;
    min-height: 30px;
  }
  .nv-card.flipped .nv-trans {
    opacity: 1;
    transform: translateY(0);
  }
  .nv-card.flipped .nv-tap {
    opacity: 0;
  }
  .nv-sent {
    font-size: 14px;
    color: #6b6585;
    line-height: 1.55;
    margin-top: auto;
    font-family: Georgia, serif;
    font-style: italic;
  }
  .nv-sent b {
    color: #534ab7;
    font-style: normal;
    font-weight: 500;
  }
  .nv-tap {
    position: absolute;
    bottom: 84px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 12px;
    color: #9994b0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .nv-stamp {
    position: absolute;
    top: 30px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 8px;
    opacity: 0;
    border: 1.5px solid currentColor;
    background: rgba(255, 255, 255, 0.92);
    pointer-events: none;
  }
  .nv-stamp.know {
    right: 24px;
    transform: rotate(12deg);
    color: #0f6e56;
  }
  .nv-stamp.learn {
    left: 24px;
    transform: rotate(-12deg);
    color: #993c1d;
  }
  .nv-hint {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #9994b0;
    margin: 0 4px 14px;
    align-items: center;
  }
  .nv-actions {
    display: flex;
    gap: 12px;
  }
  .nv-btn {
    flex: 1;
    height: 56px;
    border-radius: 18px;
    border: none;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition:
      transform 0.12s,
      filter 0.12s;
  }
  .nv-btn:active {
    transform: scale(0.97);
  }
  .nv-btn:hover {
    filter: brightness(0.96);
  }
  .nv-btn-learn {
    background: #faece7;
    color: #993c1d;
  }
  .nv-btn-know {
    background: #534ab7;
    color: #fff;
  }
  .nv-done {
    position: absolute;
    inset: 0;
    background: #faf8ff;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 36px;
    border-radius: 36px;
  }
  .nv-done.show {
    display: flex;
  }
  .nv-done h3 {
    font-size: 24px;
    font-weight: 500;
    color: #3c3489;
    margin: 18px 0 8px;
  }
  .nv-done p {
    font-size: 14px;
    color: #6b6585;
    margin: 0 0 22px;
    line-height: 1.5;
  }
  .nv-orb {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #eeedfe;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #534ab7;
    font-size: 42px;
  }
  .nv-stats {
    display: flex;
    gap: 10px;
    width: 100%;
  }
  .nv-stat {
    flex: 1;
    background: #fff;
    border-radius: 14px;
    padding: 14px 10px;
    border: 0.5px solid rgba(83, 74, 183, 0.16);
  }
  .nv-stat .v {
    font-size: 22px;
    font-weight: 500;
    color: #3c3489;
  }
  .nv-stat .l {
    font-size: 10px;
    color: #9994b0;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    margin-top: 3px;
  }
  .nv-restart {
    margin-top: 18px;
    background: transparent;
    border: none;
    color: #534ab7;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    .nv-card,
    .nv-card.gone-r,
    .nv-card.gone-l {
      transition: opacity 0.15s;
    }
    .nv-card.gone-r,
    .nv-card.gone-l {
      transform: none !important;
    }
  }
</style>
<div class="nv-shell">
  <div class="nv-phone">
    <div class="nv-top">
      <button class="nv-close" aria-label="Close session">×</button>
      <div class="nv-progress" id="nvProg"></div>
      <div class="nv-streak">
        <span aria-hidden="true">🔥</span><span id="nvStreak">0</span>
      </div>
    </div>
    <div class="nv-stack" id="nvStack"></div>
    <div class="nv-hint">
      <span>← Still learning</span>
      <span>Tap to flip</span>
      <span>I know it →</span>
    </div>
    <div class="nv-actions">
      <button class="nv-btn nv-btn-learn" id="nvLearn">Still learning</button>
      <button class="nv-btn nv-btn-know" id="nvKnow">I know it</button>
    </div>
    <div class="nv-done" id="nvDone">
      <div class="nv-orb">★</div>
      <h3>Session complete</h3>
      <p>Nice rhythm. Come back tomorrow to keep the streak going.</p>
      <div class="nv-stats">
        <div class="nv-stat">
          <div class="v" id="nvKnown">0</div>
          <div class="l">Known</div>
        </div>
        <div class="nv-stat">
          <div class="v" id="nvReview">0</div>
          <div class="l">Review</div>
        </div>
        <div class="nv-stat">
          <div class="v">2:14</div>
          <div class="l">Minutes</div>
        </div>
      </div>
      <button class="nv-restart" id="nvRestart">Start another session</button>
    </div>
  </div>
</div>
<script>
  (function () {
    const words = [
      {
        pos: "Noun · Spanish",
        word: "Mariposa",
        phon: "/ma.ɾiˈpo.sa/",
        trans: "Butterfly",
        sent: "Una <b>mariposa</b> azul se posó en la ventana.",
      },
      {
        pos: "Noun · Spanish",
        word: "Atardecer",
        phon: "/a.taɾ.deˈθeɾ/",
        trans: "Sunset · dusk",
        sent: "Caminamos juntos hasta el <b>atardecer</b>.",
      },
      {
        pos: "Adjective · Spanish",
        word: "Soñador",
        phon: "/so.ɲaˈðoɾ/",
        trans: "Dreamy · dreamer",
        sent: "Tiene una mirada <b>soñadora</b> y curiosa.",
      },
      {
        pos: "Verb · Spanish",
        word: "Susurrar",
        phon: "/su.suˈraɾ/",
        trans: "To whisper",
        sent: "El viento parecía <b>susurrar</b> entre los árboles.",
      },
      {
        pos: "Noun · Spanish",
        word: "Madrugada",
        phon: "/ma.ðɾuˈɣa.ða/",
        trans: "Early dawn",
        sent: "Salimos de viaje en plena <b>madrugada</b>.",
      },
    ];
    const stack = document.getElementById("nvStack");
    const prog = document.getElementById("nvProg");
    const streakEl = document.getElementById("nvStreak");
    const done = document.getElementById("nvDone");
    let idx = 0,
      streak = 0,
      known = 0,
      review = 0;
    function renderProgress() {
      prog.innerHTML = "";
      for (let i = 0; i < words.length; i++) {
        const s = document.createElement("div");
        s.className =
          "nv-pseg" + (i < idx ? " done" : i === idx ? " curr" : "");
        prog.appendChild(s);
      }
    }
    function makeCard(i, depth) {
      const w = words[i];
      const c = document.createElement("div");
      c.className = "nv-card";
      c.style.transform =
        "translateY(" + depth * 8 + "px) scale(" + (1 - depth * 0.04) + ")";
      c.style.zIndex = 10 - depth;
      c.style.opacity = depth > 2 ? 0 : 1;
      c.innerHTML =
        '<span class="nv-pos">' +
        w.pos +
        "</span>" +
        '<div class="nv-word">' +
        w.word +
        "</div>" +
        '<div class="nv-phon">' +
        w.phon +
        "</div>" +
        '<div class="nv-divider"></div>' +
        '<div class="nv-label">Translation</div>' +
        '<div class="nv-trans">' +
        w.trans +
        "</div>" +
        '<div class="nv-sent">' +
        w.sent +
        "</div>" +
        '<div class="nv-tap">Tap to reveal translation</div>' +
        '<div class="nv-stamp learn">Study</div>' +
        '<div class="nv-stamp know">Got it</div>';
      return c;
    }
    function render() {
      stack.innerHTML = "";
      for (let d = 2; d >= 0; d--) {
        const i = idx + d;
        if (i < words.length) stack.appendChild(makeCard(i, d));
      }
      renderProgress();
      streakEl.textContent = streak;
      const top = stack.lastChild;
      if (top) attachDrag(top);
    }
    function swipeOut(dir) {
      const top = stack.lastChild;
      if (!top) return;
      top.classList.add(dir > 0 ? "gone-r" : "gone-l");
      if (dir > 0) {
        known++;
        streak++;
      } else {
        review++;
        streak = 0;
      }
      setTimeout(() => {
        idx++;
        if (idx >= words.length) {
          document.getElementById("nvKnown").textContent = known;
          document.getElementById("nvReview").textContent = review;
          done.classList.add("show");
          renderProgress();
          streakEl.textContent = streak;
        } else {
          render();
        }
      }, 340);
    }
    function attachDrag(card) {
      let sx = 0,
        sy = 0,
        dx = 0,
        dy = 0,
        dragging = false,
        moved = false;
      const stampR = card.querySelector(".nv-stamp.know");
      const stampL = card.querySelector(".nv-stamp.learn");
      card.addEventListener("pointerdown", (e) => {
        dragging = true;
        moved = false;
        sx = e.clientX;
        sy = e.clientY;
        dx = 0;
        dy = 0;
        card.classList.add("dragging");
        try {
          card.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      card.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        dx = e.clientX - sx;
        dy = e.clientY - sy;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
        const rot = dx * 0.06;
        card.style.transform =
          "translate(" + dx + "px," + dy * 0.3 + "px) rotate(" + rot + "deg)";
        const o = Math.min(1, Math.abs(dx) / 120);
        stampR.style.opacity = dx > 0 ? o : 0;
        stampL.style.opacity = dx < 0 ? o : 0;
      });
      const finish = () => {
        if (!dragging) return;
        dragging = false;
        card.classList.remove("dragging");
        if (!moved) {
          card.classList.toggle("flipped");
          return;
        }
        if (Math.abs(dx) > 110) {
          swipeOut(dx > 0 ? 1 : -1);
        } else {
          card.style.transform = "";
          stampR.style.opacity = 0;
          stampL.style.opacity = 0;
        }
      };
      card.addEventListener("pointerup", finish);
      card.addEventListener("pointercancel", finish);
    }
    document
      .getElementById("nvLearn")
      .addEventListener("click", () => swipeOut(-1));
    document
      .getElementById("nvKnow")
      .addEventListener("click", () => swipeOut(1));
    document.getElementById("nvRestart").addEventListener("click", () => {
      idx = 0;
      streak = 0;
      known = 0;
      review = 0;
      done.classList.remove("show");
      render();
    });
    render();
  })();
</script>
```

---

## 9. Porting to React (`session.tsx` + `useExerciseSession.ts`)

`useExerciseSession.ts` owns the state machine and emits the actions:

```ts
export function useExerciseSession(cards: VocabCard[]) {
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [known, setKnown] = useState(0);
  const [review, setReview] = useState(0);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const markKnown = useCallback(() => {
    setKnown((k) => k + 1);
    setStreak((s) => s + 1);
    setIndex((i) => i + 1);
  }, []);

  const markReview = useCallback(() => {
    setReview((r) => r + 1);
    setStreak(0);
    setIndex((i) => i + 1);
  }, []);

  const flipCurrent = useCallback(() => {
    const id = cards[index]?.id;
    if (id) setFlipped((f) => ({ ...f, [id]: !f[id] }));
  }, [cards, index]);

  const restart = useCallback(() => {
    setIndex(0);
    setStreak(0);
    setKnown(0);
    setReview(0);
    setFlipped({});
  }, []);

  const status = index >= cards.length ? "complete" : "active";

  return {
    index,
    streak,
    known,
    review,
    flipped,
    status,
    markKnown,
    markReview,
    flipCurrent,
    restart,
  };
}
```

`session.tsx` renders the shell, top bar, stack, hint row, action buttons, and completion overlay. The card stack maps `cards.slice(index, index + 3).reverse()` so the top card is the last DOM node (highest z-index by paint order). The drag handler lives inside the `<Card>` component as local state and calls `markKnown` / `markReview` only on commit.

A common gotcha: don't put drag transforms in React state — you'll re-render at 60fps. Keep them on a ref or apply the inline style directly via `element.style.transform` in the pointer handler. Only the commit goes through `setState`.

---

## 10. Acceptance checklist

A correct implementation passes all of these:

- The screen renders 3 cards visible in a stack (or fewer near the end), each offset 8px down and scaled 4% smaller than the one above.
- Dragging the top card moves it 1:1 horizontally, applies a subtle rotation, and dampens vertical motion to 30%.
- "Got it" and "Study" stamps fade in based on horizontal drag direction and magnitude, capping at 100% opacity around 120px.
- Releasing under 110px springs back; over 110px the card flies off and the next card becomes interactive.
- Tapping (no drag, under 5px movement) toggles the translation reveal.
- The two action buttons trigger the same commit path as the gestures.
- The progress bar shows one segment per card, lit segments for completed, a brighter segment for the current.
- The streak chip increments on right-swipes and resets on left-swipes.
- After the last card, the completion overlay shows known / review counts and a restart link.
- The screen is keyboard-usable and screen-reader-labeled.
- Honor `prefers-reduced-motion`.

If all of these check out, the visual match to the reference is faithful.
