# Lobby Display: Win an Epic USA Trip

Touchscreen page for the UniFi Connect Display in Leader's lobbies (1920 x 1080, dark theme). It explains the promo, how to win, and which products sit in each range. It shows no prices and has no purchase buttons.

Live page: https://3stankyle.github.io/ui-miami-lobby-display/

Node: `CH-LOBBY` in `context/01-knowledge-graph.md`. The `context/` folder and project rules are kept in the private `ui-miami-promo-notes` repo. Clone this repo into that one as `lobby-display/`; see `HANDOFF.md` there.

## Run it

It is a static site with no build step.

```bash
cd lobby-display
python -m http.server 8765
# open http://127.0.0.1:8765
```

Test shortcuts: `?tab=event`, `?open=access`, `?open=enterprise`, `?open=protect`, `?open=how` (the How It Works overlay, which no button opens now), and `?idle=7000` for a 7-second idle reset.

`python -m http.server` is fine for a quick look, but it ignores Range requests, so you can't scrub the video with it.

## Put it on the display

1. Use the GitHub Pages address above, which rebuilds on every push to `main`. To host it elsewhere, use a web server that supports HTTP Range requests, because the video is about 47 MB and loops. Have it send `Cache-Control: no-cache` for `.html`, `.css` and `.js` files if you can.
2. In UniFi Connect, set the display to Web Mode and enter the address.
3. Check video playback, touch scrolling and the fonts on the real display. This build has only been tested in desktop Chrome.

## Swap the video

The current file is `assets/video/miami-reel.mp4`: 1920 x 1080, H.264, 46.6 seconds, with the audio and metadata removed. The hero area is 1400 x 788 at 16:9. The fades hide the left 112 px of that area and soften about the next 200 px on the left and about 150-200 px on the other sides, so keep important content near the middle of the frame.

1. Prepare the new file without re-encoding: `ffmpeg -i new.mp4 -map 0:v:0 -c:v copy -an -map_metadata -1 -map_chapters -1 -movflags +faststart lobby-display/assets/video/new.mp4`. It should be an H.264 MP4, 1920 x 1080 or smaller. It plays muted.
2. At the top of `js/app.js`, set `CONFIG.video.src` to the new file.
3. Check every shot for third-party livery (see the rocket-art question in `context/08-open-questions.md`). The fine print already covers launch viewing and illustrative imagery.
4. Run `python lobby-display/tools/build_catalog.py --stamp-only` so displays fetch the changed files.

## Refresh the products

```bash
python lobby-display/tools/build_catalog.py
```

This re-reads the `leader` CLI and store.ui.com, then rewrites `js/catalog.js`, downloads any new renders, and regenerates `context/09-lobby-product-list.md`. It also updates the `?v=` version numbers in `index.html`, so open displays fetch the new files on their next automatic reload, at most every 6 hours while idle.

To change how a product is sorted, edit the rules at the top of `tools/build_catalog.py`. Don't hand-edit `js/catalog.js`.

The tool copies fields into `js/catalog.js` from a fixed list, so prices and stock never reach the page.

## Change promo wording

Update `context/01-knowledge-graph.md` first, then the `COPY`, `EVENT`, `PRIZES` and `WAYS` blocks in `js/app.js` and the matching text in `index.html`. Finish with `python lobby-display/tools/build_catalog.py --stamp-only`.

## Kiosk behaviour

- The page is designed at 1920 x 1080 and fills whatever size the player reports, with no bars. On a screen that isn't exactly 16:9, the extra width or height goes to the video and the columns, and the video crops to suit: about 17% of its height in a 1916 x 941 window and about 30% on a 2560 x 1080 ultrawide. At 1920 x 1080 there's no crop.
- The video fades into the black on all four sides. To change a fade, edit `.hero::after` in `css/app.css`.
- After 90 seconds without a touch, overlays close, the promo panel returns to The Prize and the video resumes (`CONFIG.idleMs`).
- The video pauses behind overlays. On the home screen, it reloads itself if it fails or stops moving.
- The 6-hour reload only runs if the server responds, so a network outage leaves the running page in place.
- Text selection, long-press menus and pinch zoom are turned off.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page shell, with node IDs and pending questions in a comment |
| `css/app.css` | Styles and design tokens |
| `js/app.js` | Content, overlays, tabs, idle reset, video |
| `js/catalog.js` | Generated product data |
| `tools/build_catalog.py` | Rebuilds the product data and renders |
| `assets/fonts/` | D-DIN Regular and Bold (SIL Open Font License, unmodified), because the display won't have them installed |
| `assets/logos/` | LEADER and UBIQUITI lockup, UniFi Partner Program badge |
| `assets/products/` | Official product renders from store.ui.com |
| `assets/video/` | Hero video, `miami-reel.mp4` |
