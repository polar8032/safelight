# Safelight

A photo library and non-destructive photo editor that runs entirely in the browser. Editing happens on the GPU (WebGL2); your original files are never changed.

## Features

- **Library:** import or drag and drop, star ratings, pick/reject flags, color labels, keywords, titles and captions, camera metadata, search and filters, albums and smart albums (rename, delete, drag photos onto them), virtual copies.
- **Organizing:** select several photos (Ctrl/Shift-click or right-click on desktop; Select or long-press on phones) and use the action bar to rate, flag, label, add to or remove from an album, export or delete. Deleted photos go to Recently deleted with Undo, and are removed for good after 30 days unless restored.
- **Editing:** white balance (auto and pick-a-neutral), auto tone, exposure, contrast, highlights, shadows, whites, blacks, texture, clarity, dehaze, vibrance, saturation.
- **Advanced editing:** point and region tone curves, per-color hue/saturation/luminance, black-and-white mix, color-grading wheels, sharpening and noise reduction, lens corrections, perspective transform, vignette, grain, calibration.
- **Tools:** crop with auto straighten, healing, cloning, red-eye removal, and up to 8 masks per photo (linear, radial, brush, brightness range, color range).
- **Workflow:** undo history, snapshots, built-in and custom presets with an amount slider, copy/paste and sync settings, before/after split view, histogram with clipping warnings, keyboard shortcuts.
- **Looks:** over 60 one-click looks with live previews on your own photo: color film, black-and-white film and cinema styles (halation, diffusion glow, anamorphic flare, light leaks, fade, film dust and scratches, borders, color grain, letterbox), plus everyday, portrait and landscape looks. Each has an intensity slider, and you can import your own 3D LUTs (`.cube`).
- **Export:** JPEG, PNG or WebP, resizing, file naming, optional watermark; several photos export as one .zip.
- **Camera RAW:** decoded with LibRaw (WebAssembly) at full 16-bit precision so highlights can be recovered. If a file cannot be decoded, the camera's embedded JPEG preview is used instead.

## Phone and installing as an app

On a phone, Safelight switches to a dedicated layout: the photo on top, one tool sheet below and a tab bar at the bottom (Looks, Light, Color, Effects, Optics, Tools, History). Pinch to zoom, double-tap to zoom to 100%, swipe sideways to move between photos, and press and hold the photo (or the "Hold: before" button) to see the original. Drag the handle above the panel to make it taller or shorter.

Sliders are built for touch: swiping up or down over them scrolls the panel, only a sideways drag changes a value, the value moves relative to where it was (a tap never makes it jump), it clicks into place at the default, double-tap resets it, and tapping the number lets you type an exact value.

It is an installable web app. When it is served over HTTPS (for example from GitHub Pages):
- **Android / Chrome / Edge:** use the Install button in the top bar, or the browser menu's Install app.
- **iPhone / iPad:** in Safari, tap Share, then Add to Home Screen.

Once installed it opens full screen and works offline. Photos stay on the device.

## Running it

No build step. Serve the folder over HTTP and open it in a current Chrome, Edge, Firefox or Safari:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk will not work, because the RAW decoder loads as a module and a Web Worker.

Your library is stored in the browser's IndexedDB on that device.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| G / E | Library / Edit |
| 0–5 | Rating |
| P / X / U | Pick / Reject / Unflag |
| 6–9 | Red / yellow / green / blue label |
| ← → | Previous / next photo |
| R / Q / M / W | Crop / Heal / Masks / White-balance picker |
| J | Clipping warnings |
| \ / Y | Before / split view |
| Z | Zoom 100% / fit |
| Ctrl+Z / Ctrl+Shift+Z | Undo / redo |
| Ctrl+C / Ctrl+V | Copy / paste settings |
| Ctrl+E | Export |

## Files

- `index.html` — layout and styles
- `manifest.webmanifest`, `sw.js`, `icons/` — installable app and offline support
- `scripts/build-artifact.py` — writes the page body to `build/artifact.html` for publishing as a Claude artifact
- `app.js` — library, panels, tools, history, presets, export
- `engine.js` — WebGL2 develop pipeline
- `util.js` — storage, EXIF, RAW loading, zip writer, curves, sample photos
- `vendor/libraw/` — libraw-wasm 1.6.0 (ISC) with LibRaw (LGPL 2.1 / CDDL 1.0); see `vendor/libraw/NOTICE.txt`

## Not included

AI masking (subject, sky, people), AI noise reduction, generative removal, HDR and panorama merge, automatic perspective correction, lens profiles, face recognition, maps, books, print, slideshows and cloud sync.
