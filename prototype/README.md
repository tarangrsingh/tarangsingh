# Minimal rebuild — prototype

Six pages, a single stylesheet and two small scripts, built from the real
content of the live site. Open `index.html` directly; there is no build step.

## What the prototype applies

**Round 0 — one vocabulary.** Every colour, size, space and radius is a token
in the `:root` block of `base.css`, and nothing outside that block introduces a
new one. 5 type sizes (was 20), 2 weights, 1 radius (was 14), 12 hex colours
(was 38 plus 405 inline `rgba()`).

**Round 1 — no ambient layers.** No background photo behind a scrim, no cursor
atoms, no re-implemented scrollbar, no `backdrop-filter`, no scroll-driven
animation. 0 `@keyframes` (was 34), 2 transitions (was 178), 0 requestAnimationFrame
loops (was 3). `prefers-reduced-motion` has nothing left to switch off, which is
the test of whether the motion was carrying information.

**Round 2 — real navigation.** The same four links sit in the header of every
page, so no page is a dead end. The live site's inner pages can only go back
home, which makes Research → Scholastic a two-click trip through a dropdown.
The theme control is a labelled word, not an unexplained glyph.

**Round 3 — content in its natural form.** Research, education, updates and
ideas are all the same `.entry` component: a date in the margin, a body beside
it. Seven exam results became a table with a percentile column, because the
comparison is the point and seven numerals in seven bordered tiles hid it.
Keyword pills became one quiet line of text with the same words in it.

**Round 4 — one stylesheet.** The live site repeats 192 lines of CSS verbatim
inside all seven pages, so a nav change is a seven-file edit. Here the shared
shell is twelve lines of markup per page and all style lives in `base.css`.

## Numbers

|                        | live site        | prototype |
| ---------------------- | ---------------- | --------- |
| HTML, all pages        | 287 KB           | 24 KB     |
| CSS                    | 52 KB + inline   | 11 KB     |
| JS                     | 73 KB, 10 files  | 1.7 KB, 2 files |
| Images                 | 1.9 MB           | 38 KB     |
| Home page weight       | ~800 KB          | ~100 KB   |
| DOM tags, home         | 202              | 52        |

## What is deliberately kept

The dark-first palette, the ~68-character measure, the portrait, and the
resonator trace on the research page — a notch-coupled S21 sweep drawn to
scale, with real axes. It is the one graphic that carries information rather
than atmosphere, so it is the one graphic that stays.

## Known gaps

- The contact form has no `action`; `form.js` fakes the submit states. The live
  page posts to FormSubmit.
- Two links on the research page are placeholders (`#`) for the NIUS study and
  certificate.
- Theme preference follows the OS by default and is remembered after the first
  toggle. The live site ignores the OS setting entirely.
