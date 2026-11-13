# Safelight

A photo library and non-destructive photo editor that runs entirely in the browser. Editing happens on the GPU (WebGL2); your original files are never changed.

## Features

- **Library:** import or drag and drop, star ratings, pick/reject flags, color labels, keywords, titles and captions, camera metadata, search and filters, collections, smart collections, virtual copies.
- **Editing:** white balance (auto and pick-a-neutral), auto tone, exposure, contrast, highlights, shadows, whites, blacks, texture, clarity, dehaze, vibrance, saturation.
- **Advanced editing:** point and region tone curves, per-color hue/saturation/luminance, black-and-white mix, color-grading wheels, sharpening and noise reduction, lens corrections, perspective transform, vignette, grain, calibration.
- **Tools:** crop and straighten, healing, cloning, red-eye removal, and up to 8 masks per photo (linear, radial, brush, brightness range, color range).
- **Workflow:** undo history, snapshots, built-in and custom presets with an amount slider, copy/paste and sync settings, before/after split view, histogram with clipping warnings, keyboard shortcuts.
- **Export:** JPEG, PNG or WebP, resizing, file naming, optional watermark; several photos export as one .zip.
- **Camera RAW:** decoded with LibRaw (WebAssembly) at full 16-bit precision so highlights can be recovered. If a file cannot be decoded, the camera's embedded JPEG preview is used instead.

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
- `app.js` — library, panels, tools, history, presets, export
- `engine.js` — WebGL2 develop pipeline
- `util.js` — storage, EXIF, RAW loading, zip writer, curves, sample photos
- `vendor/libraw/` — libraw-wasm 1.6.0 (ISC) with LibRaw (LGPL 2.1 / CDDL 1.0); see `vendor/libraw/NOTICE.txt`

## Not included

AI masking (subject, sky, people), AI noise reduction, generative removal, HDR and panorama merge, automatic perspective correction, lens profiles, face recognition, maps, books, print, slideshows and cloud sync.
