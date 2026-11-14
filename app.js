/* Safelight — application */
'use strict';
const h = U.h, $ = (s) => document.querySelector(s);

/* ============================== schema ============================== */
const Z8 = () => [0, 0, 0, 0, 0, 0, 0, 0];
function defaults() {
  return {
    temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
    texture: 0, clarity: 0, dehaze: 0, vibrance: 0, saturation: 0, bw: false,
    curve: { rgb: [[0, 0], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] },
    pcHigh: 0, pcLight: 0, pcDark: 0, pcShadow: 0, pcS1: 25, pcS2: 50, pcS3: 75,
    hslH: Z8(), hslS: Z8(), hslL: Z8(), bwMix: Z8(),
    gsH: 220, gsS: 0, gsL: 0, gmH: 40, gmS: 0, gmL: 0, ghH: 45, ghS: 0, ghL: 0, ggH: 40, ggS: 0, ggL: 0, gradeBlend: 50, gradeBalance: 0,
    sharpen: 0, sharpRadius: 1, sharpDetail: 25, sharpMask: 0, nrLum: 0, nrDetail: 50, nrColor: 0,
    distortion: 0, lensVig: 0, lensVigMid: 50, caRed: 0, caBlue: 0, defPurple: 0, defGreen: 0,
    tVert: 0, tHorz: 0, tRot: 0, tAspect: 0, tScale: 100, tX: 0, tY: 0,
    vig: 0, vigMid: 50, vigRound: 0, vigFeather: 50, vigHigh: 0, grain: 0, grainSize: 25, grainRough: 50, grainColor: 0, halation: 0, glow: 0, letterbox: 0, lut: null, flare: 0, fade: 0, leak: 0, leakHue: 25, leakPos: 60, damage: 0, border: 0, borderBottom: 0, borderColor: 'white', tilt: 0, tiltPos: 50, tiltWidth: 15, tiltFeather: 20,
    calShadow: 0, calRH: 0, calRS: 0, calGH: 0, calGS: 0, calBH: 0, calBS: 0,
    crop: null, orient: 0, flipH: false, flipV: false,
    masks: [], spots: [], look: null
  };
}
const DEF = defaults();
const GROUPS = {
  treatment: ['Treatment', ['bw']],
  wb: ['White balance', ['temp', 'tint']],
  tone: ['Tone', ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks']],
  presence: ['Presence', ['texture', 'clarity', 'dehaze', 'vibrance', 'saturation']],
  curve: ['Tone curve', ['curve', 'pcHigh', 'pcLight', 'pcDark', 'pcShadow', 'pcS1', 'pcS2', 'pcS3']],
  mixer: ['Color mixer', ['hslH', 'hslS', 'hslL', 'bwMix']],
  grading: ['Color grading', ['gsH', 'gsS', 'gsL', 'gmH', 'gmS', 'gmL', 'ghH', 'ghS', 'ghL', 'ggH', 'ggS', 'ggL', 'gradeBlend', 'gradeBalance']],
  detail: ['Detail', ['sharpen', 'sharpRadius', 'sharpDetail', 'sharpMask', 'nrLum', 'nrDetail', 'nrColor']],
  lens: ['Lens corrections', ['distortion', 'lensVig', 'lensVigMid', 'caRed', 'caBlue', 'defPurple', 'defGreen']],
  transform: ['Transform', ['tVert', 'tHorz', 'tRot', 'tAspect', 'tScale', 'tX', 'tY']],
  effects: ['Effects', ['vig', 'vigMid', 'vigRound', 'vigFeather', 'vigHigh', 'grain', 'grainSize', 'grainRough', 'grainColor', 'halation', 'glow', 'letterbox', 'flare', 'fade', 'leak', 'leakHue', 'leakPos', 'damage', 'border', 'borderBottom', 'borderColor', 'tilt', 'tiltPos', 'tiltWidth', 'tiltFeather']],
  lut: ['LUT', ['lut']],
  calibration: ['Calibration', ['calShadow', 'calRH', 'calRS', 'calGH', 'calGS', 'calBH', 'calBS']],
  crop: ['Crop & orientation', ['crop', 'orient', 'flipH', 'flipV']],
  masks: ['Masks', ['masks']],
  spots: ['Healing', ['spots']]
};
const HUES = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'];
const HUE_COL = ['#e0433c', '#ec8a2c', '#e8cf35', '#4fb548', '#3fc1c4', '#3f6fe0', '#8b52d6', '#d64bb0'];
const LABELS = { red: '#d9534f', yellow: '#e2bf3c', green: '#62b357', blue: '#4f8fe0', purple: '#9a6fd6' };
const MASK_ADJ = [['exposure', 'Exposure', -4, 4, 0.01], ['contrast', 'Contrast', -100, 100, 1], ['highlights', 'Highlights', -100, 100, 1], ['shadows', 'Shadows', -100, 100, 1], ['whites', 'Whites', -100, 100, 1], ['blacks', 'Blacks', -100, 100, 1], ['temp', 'Temperature', -100, 100, 1], ['tint', 'Tint', -100, 100, 1], ['texture', 'Texture', -100, 100, 1], ['clarity', 'Clarity', -100, 100, 1], ['dehaze', 'Dehaze', -100, 100, 1], ['saturation', 'Saturation', -100, 100, 1]];
const maskAdj0 = () => Object.fromEntries(MASK_ADJ.map(a => [a[0], 0]));
const isDefault = (k, v) => JSON.stringify(v) === JSON.stringify(DEF[k]);
const isEdited = (p) => Object.keys(DEF).some(k => !isDefault(k, p[k]));

/* ============================== presets ============================== */
const CRV = (rgb, r, g, b) => ({ rgb: rgb || [[0, 0], [1, 1]], r: r || [[0, 0], [1, 1]], g: g || [[0, 0], [1, 1]], b: b || [[0, 0], [1, 1]] });
const FADE = (lo, hi) => [[0, lo], [0.25, 0.25 + lo * 0.4], [0.75, 0.75 - (1 - hi) * 0.3], [1, hi]];
const SOFT_S = [[0, 0], [0.25, 0.22], [0.75, 0.79], [1, 1]];
const HARD_S = [[0, 0], [0.22, 0.15], [0.5, 0.5], [0.78, 0.86], [1, 1]];
/* Look finder tags: describe what you saw (mood, light, feel, genre, colors) instead of naming a film. */
const TAG_GROUPS = [
  ['Mood', ['warm', 'cold', 'neutral']],
  ['Light', ['day', 'night', 'golden']],
  ['Feel', ['gritty', 'dreamy', 'clean', 'vintage', 'dark', 'bright', 'pastel', 'neon']],
  ['Genre', ['thriller', 'action', 'sci-fi', 'romance', 'horror', 'western', 'drama', 'comedy', 'fantasy', 'war', 'noir', 'documentary', 'music-video']],
  ['Colors', ['teal-orange', 'teal', 'blue', 'green', 'yellow', 'magenta', 'sepia', 'bw', 'splash']]
];
const LOOK_TAGS = {
  'Portrait 400': 'warm clean pastel day', 'Everyday 200': 'warm day clean', 'Slide 50': 'day clean bright', 'Expired Stock': 'vintage warm dreamy', 'Seventies Print': 'vintage warm yellow',
  'Pastel Negative': 'pastel bright dreamy', 'Cool Matte': 'cold pastel', 'Instant Print': 'vintage dreamy warm', 'Super 8': 'vintage warm gritty', 'Cross Process': 'vintage green yellow',
  'Light Leak Dream': 'dreamy warm vintage', 'Contact Sheet': 'vintage clean', 'Home Video 90s': 'vintage gritty music-video', '80s Video Tape': 'vintage gritty music-video magenta',
  'Teal & Orange': 'action teal-orange warm', 'Tungsten Night': 'night cold teal thriller', 'Bleach Bypass': 'war gritty thriller dark', 'Day for Night': 'night blue cold thriller dark',
  'Neon Noir': 'night neon noir sci-fi magenta', 'Golden Epic': 'golden warm fantasy action', 'Desert Bleach': 'western warm gritty yellow day', 'Emerald Thriller': 'thriller green dark',
  'Anamorphic Night': 'night sci-fi blue thriller cold', 'Summer Blockbuster': 'action bright teal-orange day', 'Moonlight Blue': 'night blue cold drama', 'Western Dust': 'western warm vintage gritty sepia',
  'Arthouse Fade': 'drama pastel dreamy', 'Dread': 'horror dark green', 'Cold Future': 'sci-fi cold teal clean', 'Red Planet': 'sci-fi warm yellow', 'Three-Strip': 'vintage bright drama',
  'Neon Rain': 'night sci-fi magenta neon dreamy', 'Silver Screen': 'bw noir vintage', 'Old Reel': 'bw vintage sepia gritty',
  'Teal Night Chase': 'thriller action night cold teal-orange gritty', 'Spy Steel': 'thriller cold blue clean', 'Romance Glow': 'romance warm dreamy golden', 'Desert Haze': 'sci-fi warm dreamy golden yellow',
  'Neon City': 'sci-fi night neon magenta teal', 'Sun-Baked Yellow': 'thriller drama warm yellow gritty day', 'War Grit': 'war gritty green dark', 'Superhero Punch': 'action bright clean teal-orange',
  'Fantasy Gold': 'fantasy warm golden dreamy', 'Candlelit Period': 'drama warm dark vintage night', 'Pastel Storybook': 'comedy pastel bright vintage dreamy', 'Zombie Green': 'horror green dark gritty',
  'Cold Case': 'thriller cold teal clean', 'Deep Sea Teal': 'sci-fi cold teal', 'Western Sunset': 'western warm golden', 'Arctic Thriller': 'thriller cold bright blue',
  'Bleached Memory': 'drama dreamy vintage bright', 'Documentary Natural': 'documentary clean neutral day', 'Music Video Haze': 'music-video pastel dreamy magenta',
  'Classic 400': 'bw gritty vintage', 'Fine Grain 100': 'bw clean', 'Pushed 3200': 'bw gritty dark', 'Red Filter': 'bw dark', 'Infrared Glow': 'bw dreamy', 'Film Noir': 'bw noir dark',
  'Sepia Print': 'bw sepia vintage', 'Cyanotype': 'bw blue vintage', 'Lith Print': 'bw gritty vintage', 'Silver Gelatin': 'bw clean', 'Selenium Print': 'bw vintage', 'Soft Matte Mono': 'bw pastel dreamy',
  'Punch': 'bright', 'Golden Hour': 'golden warm', 'Blue Hour': 'night blue cold', 'Clean Neutral': 'clean neutral', 'Nocturne': 'night dark', 'Soft Skin': 'dreamy', 'High Key': 'bright', 'Low Key': 'dark',
  'Clear Air': 'clean day', 'Green Season': 'green day', 'Red Splash': 'splash', 'Blue Splash': 'splash blue', 'Yellow Splash': 'splash yellow', 'Duotone Teal & Rose': 'teal magenta pastel', 'Duotone Indigo & Gold': 'blue yellow'
};
const BUILTIN = [
  /* ---- colour film emulations (original looks, descriptive names) ---- */
  ['Film · Color', 'Portrait 400', { contrast: -6, highlights: -12, curve: CRV(FADE(0.035, 0.98)), hslS: [-4, -8, -6, -10, 0, -6, 0, 0], hslL: [0, 6, 0, 0, 0, 0, 0, 0], ghH: 45, ghS: 10, gsH: 195, gsS: 6, grain: 18, grainSize: 30, halation: 8 }],
  ['Film · Color', 'Everyday 200', { temp: 6, vibrance: 12, saturation: 6, curve: CRV(SOFT_S), ghH: 50, ghS: 12, gsH: 210, gsS: 8, hslH: [0, 0, -8, 12, 0, 0, 0, 0], grain: 22, grainSize: 32 }],
  ['Film · Color', 'Slide 50', { contrast: 28, blacks: -14, saturation: 16, vibrance: 10, curve: CRV(HARD_S), hslS: [6, 4, 0, 12, 10, 18, 6, 0], hslL: [0, 0, 0, -6, 0, -10, 0, 0], grain: 6, vig: -12 }],
  ['Film · Color', 'Expired Stock', { temp: 12, tint: 10, saturation: -15, curve: CRV(FADE(0.12, 0.9)), gsH: 170, gsS: 20, ghH: 50, ghS: 20, grain: 36, grainRough: 70, grainColor: 35, halation: 15, vig: -15 }],
  ['Film · Color', 'Seventies Print', { temp: 18, tint: 6, saturation: -10, curve: CRV(FADE(0.06, 0.95), [[0, 0], [0.5, 0.54], [1, 1]], null, [[0, 0.04], [0.5, 0.46], [1, 0.9]]), ghH: 40, ghS: 22, grain: 25 }],
  ['Film · Color', 'Pastel Negative', { exposure: 0.3, contrast: -20, highlights: -20, shadows: 20, saturation: -10, vibrance: 10, curve: CRV(FADE(0.08, 0.97)), hslL: [0, 10, 6, 0, 0, 0, 0, 0], ghH: 330, ghS: 8, grain: 12 }],
  ['Film · Color', 'Cool Matte', { temp: -8, saturation: -12, curve: CRV(FADE(0.09, 0.95)), gsH: 200, gsS: 18, ghH: 210, ghS: 6, grain: 14 }],
  ['Film · Color', 'Instant Print', { contrast: -10, temp: 8, saturation: -5, curve: CRV(FADE(0.07, 0.93), null, null, [[0, 0.08], [1, 0.95]]), gsH: 190, gsS: 15, ghH: 50, ghS: 15, glow: 10, vig: -22, vigFeather: 70, grain: 15, border: 30, borderBottom: 70, borderColor: 'cream' }],
  ['Film · Color', 'Super 8', { temp: 15, contrast: 20, saturation: 10, texture: -18, curve: CRV(FADE(0.06, 0.94)), grain: 55, grainSize: 70, grainRough: 80, grainColor: 40, vig: -40, vigRound: 60, vigFeather: 60, halation: 20, glow: 10 }],
  ['Film · Color', 'Cross Process', { curve: CRV(null, [[0, 0], [0.3, 0.24], [0.75, 0.84], [1, 1]], [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]], [[0, 0.12], [0.5, 0.5], [1, 0.86]]), saturation: 10, contrast: 10, grain: 15 }],
  /* ---- cinema ---- */
  ['Cinema', 'Teal & Orange', { contrast: 15, gsH: 195, gsS: 30, ghH: 35, ghS: 26, gradeBalance: 10, hslS: [0, 10, -20, -30, 10, 0, -30, -20], hslH: [0, -10, -20, 30, 0, -10, 0, 0], vig: -10, letterbox: 2.39 }],
  ['Cinema', 'Tungsten Night', { temp: -14, contrast: 10, halation: 45, glow: 12, gsH: 190, gsS: 20, ghH: 30, ghS: 10, grain: 25, grainColor: 20, letterbox: 2.39 }],
  ['Cinema', 'Bleach Bypass', { saturation: -45, contrast: 40, clarity: 15, curve: CRV(HARD_S), gsH: 210, gsS: 6, grain: 15, letterbox: 1.85 }],
  ['Cinema', 'Day for Night', { exposure: -1.3, temp: -45, tint: 5, saturation: -30, contrast: 15, highlights: -40, gsH: 220, gsS: 30, vig: -30, letterbox: 2.39 }],
  ['Cinema', 'Neon Noir', { contrast: 25, saturation: 15, gsH: 230, gsS: 30, ghH: 320, ghS: 20, halation: 30, glow: 15, vig: -25, hslH: [0, 0, 0, 20, 10, 10, 0, 0], letterbox: 2.39 }],
  ['Cinema', 'Golden Epic', { temp: 12, contrast: 18, highlights: -15, ghH: 40, ghS: 20, gsH: 200, gsS: 15, halation: 15, vig: -12, letterbox: 2.2 }],
  ['Cinema', 'Desert Bleach', { temp: 20, saturation: -25, contrast: 20, curve: CRV(FADE(0.05, 0.97)), ghH: 42, ghS: 30, gsH: 30, gsS: 10, grain: 20, letterbox: 2.39 }],
  ['Cinema', 'Emerald Thriller', { tint: -20, contrast: 25, saturation: -20, gsH: 140, gsS: 25, ghH: 90, ghS: 15, curve: CRV(HARD_S), letterbox: 2.39 }],
  ['Film · Color', 'Light Leak Dream', { temp: 10, leak: 55, leakHue: 22, leakPos: 70, fade: 18, saturation: -6, grain: 22, halation: 10 }],
  ['Film · Color', 'Contact Sheet', { contrast: 12, curve: CRV(SOFT_S), grain: 24, grainSize: 30, border: 10, borderColor: 'black', damage: 12 }],
  ['Film · Color', 'Home Video 90s', { temp: 8, saturation: 14, texture: -40, clarity: -10, caRed: 60, caBlue: -45, grain: 30, grainSize: 60, grainColor: 55, fade: 14, vig: -10 }],
  ['Cinema', 'Anamorphic Night', { temp: -10, contrast: 15, flare: 50, halation: 25, gsH: 215, gsS: 25, ghH: 30, ghS: 10, grain: 15, letterbox: 2.39 }],
  ['Cinema', 'Summer Blockbuster', { contrast: 25, vibrance: 20, clarity: 10, gsH: 190, gsS: 28, ghH: 35, ghS: 30, flare: 15, letterbox: 2.39 }],
  ['Cinema', 'Moonlight Blue', { exposure: -0.4, temp: -25, saturation: -20, gsH: 220, gsS: 35, ghH: 200, ghS: 10, fade: 20, letterbox: 2.39 }],
  ['Cinema', 'Western Dust', { temp: 22, saturation: -30, contrast: 25, ghH: 38, ghS: 30, gsH: 25, gsS: 15, grain: 30, fade: 15, damage: 15, letterbox: 2.76 }],
  ['Cinema', 'Arthouse Fade', { contrast: -15, fade: 40, saturation: -20, gsH: 160, gsS: 12, ghH: 30, ghS: 10, grain: 18, letterbox: 1.85 }],
  ['Cinema', 'Dread', { saturation: -55, contrast: 30, tint: -8, blacks: -15, gsH: 150, gsS: 20, vig: -45, grain: 30, letterbox: 2.39 }],
  ['Cinema', 'Cold Future', { temp: -20, tint: -6, contrast: 20, clarity: 10, hslS: [-10, -30, -20, 0, 10, 10, 0, 0], gsH: 190, gsS: 30, ghH: 185, ghS: 15, flare: 20, letterbox: 2.39 }],
  ['Cinema', 'Red Planet', { temp: 30, tint: 6, contrast: 20, dehaze: 15, hslH: [0, -10, -20, -40, 0, 0, 0, 0], ghH: 25, ghS: 35, gsH: 15, gsS: 20, letterbox: 2.39 }],
  ['Cinema', 'Three-Strip', { saturation: 30, contrast: 20, hslS: [20, 10, 0, 10, 0, 20, 0, 0], curve: CRV(SOFT_S), fade: 5, grain: 12, letterbox: 1.85 }],
  ['Cinema', 'Neon Rain', { temp: -12, contrast: 20, saturation: 20, gsH: 240, gsS: 30, ghH: 300, ghS: 25, halation: 35, flare: 30, glow: 15, letterbox: 2.39 }],
  ['Cinema', 'Silver Screen', { bw: true, contrast: 30, glow: 15, grain: 25, vig: -25, letterbox: 1.37 }],
  ['Cinema', 'Old Reel', { bw: true, contrast: 20, gsH: 35, gsS: 15, ghH: 40, ghS: 10, damage: 60, grain: 50, grainRough: 80, fade: 25, vig: -40, glow: 10, letterbox: 1.37 }],
  ['Cinema', 'Teal Night Chase', { temp: -15, contrast: 25, blacks: -15, gsH: 195, gsS: 35, ghH: 30, ghS: 15, halation: 15, letterbox: 2.39 }],
  ['Cinema', 'Spy Steel', { temp: -12, saturation: -30, contrast: 20, clarity: 10, gsH: 205, gsS: 20, ghH: 200, ghS: 8, letterbox: 2.39 }],
  ['Cinema', 'Romance Glow', { temp: 14, contrast: -10, highlights: -15, saturation: -5, glow: 25, fade: 10, ghH: 35, ghS: 20, gsH: 20, gsS: 8, letterbox: 1.85 }],
  ['Cinema', 'Desert Haze', { temp: 25, saturation: -25, contrast: -5, dehaze: -20, fade: 15, ghH: 38, ghS: 30, gsH: 30, gsS: 20, letterbox: 2.39 }],
  ['Cinema', 'Neon City', { contrast: 25, saturation: 25, gsH: 190, gsS: 35, ghH: 310, ghS: 30, halation: 30, glow: 15, flare: 15, letterbox: 2.39 }],
  ['Cinema', 'Sun-Baked Yellow', { temp: 30, tint: -10, contrast: 25, saturation: -10, ghH: 50, ghS: 35, gsH: 45, gsS: 15, letterbox: 2.39 }],
  ['Cinema', 'War Grit', { saturation: -55, contrast: 35, clarity: 25, tint: -10, gsH: 100, gsS: 12, grain: 30, letterbox: 1.85 }],
  ['Cinema', 'Superhero Punch', { contrast: 30, vibrance: 30, clarity: 15, gsH: 210, gsS: 15, ghH: 35, ghS: 20, flare: 20, letterbox: 2.39 }],
  ['Cinema', 'Fantasy Gold', { temp: 15, contrast: 10, vibrance: 10, glow: 20, ghH: 42, ghS: 28, gsH: 160, gsS: 15 }],
  ['Cinema', 'Candlelit Period', { exposure: -0.3, temp: 22, contrast: 15, shadows: -10, ghH: 35, ghS: 25, gsH: 25, gsS: 10, vig: -30, grain: 15, letterbox: 1.85 }],
  ['Cinema', 'Pastel Storybook', { contrast: -12, saturation: 10, hslL: [10, 10, 10, 0, 10, 5, 10, 10], hslS: [-10, 10, 10, -20, 0, -10, 10, 10], fade: 15, ghH: 30, ghS: 10, gsH: 330, gsS: 8 }],
  ['Cinema', 'Zombie Green', { tint: -20, saturation: -40, contrast: 30, blacks: -15, gsH: 120, gsS: 25, ghH: 80, ghS: 10, vig: -35, grain: 20, letterbox: 2.39 }],
  ['Cinema', 'Cold Case', { temp: -10, tint: -6, saturation: -25, contrast: 15, gsH: 180, gsS: 25, ghH: 190, ghS: 8 }],
  ['Cinema', 'Deep Sea Teal', { temp: -30, tint: -10, saturation: 10, dehaze: 10, gsH: 185, gsS: 40, ghH: 175, ghS: 20, letterbox: 2.39 }],
  ['Cinema', 'Western Sunset', { temp: 28, contrast: 25, saturation: 10, ghH: 30, ghS: 30, gsH: 20, gsS: 20, vig: -20, letterbox: 2.76 }],
  ['Cinema', 'Arctic Thriller', { exposure: 0.2, temp: -25, saturation: -35, contrast: 10, fade: 8, gsH: 210, gsS: 20, letterbox: 2.39 }],
  ['Cinema', 'Bleached Memory', { exposure: 0.4, saturation: -40, contrast: -15, glow: 25, fade: 25, ghH: 45, ghS: 12 }],
  ['Cinema', 'Documentary Natural', { contrast: 6, vibrance: 8, highlights: -10, shadows: 8, sharpen: 20 }],
  ['Cinema', 'Music Video Haze', { tint: 15, saturation: 10, glow: 30, fade: 20, flare: 10, ghH: 320, ghS: 20, gsH: 250, gsS: 20 }],
  ['Film · Color', '80s Video Tape', { temp: 6, saturation: 20, texture: -45, caRed: 70, caBlue: -50, grain: 35, grainSize: 70, grainColor: 60, fade: 15, vig: -10 }],
  ['Creative', 'Red Splash', { contrast: 15, hslS: [0, -100, -100, -100, -100, -100, -100, 0] }],
  ['Creative', 'Blue Splash', { contrast: 15, hslS: [-100, -100, -100, -100, 0, 0, -100, -100] }],
  ['Creative', 'Yellow Splash', { contrast: 15, hslS: [-100, 0, 0, -100, -100, -100, -100, -100] }],
  ['Creative', 'Duotone Teal & Rose', { bw: true, contrast: 10, gsH: 190, gsS: 50, ghH: 340, ghS: 40 }],
  ['Creative', 'Duotone Indigo & Gold', { bw: true, contrast: 15, gsH: 240, gsS: 50, ghH: 45, ghS: 45 }],
  /* ---- black & white film ---- */
  ['Film · B&W', 'Classic 400', { bw: true, contrast: 25, bwMix: [10, 10, 5, 0, -5, -15, -5, 0], grain: 32, grainSize: 35, grainRough: 55 }],
  ['Film · B&W', 'Fine Grain 100', { bw: true, contrast: 12, clarity: 8, curve: CRV(SOFT_S), grain: 10, grainSize: 15 }],
  ['Film · B&W', 'Pushed 3200', { bw: true, contrast: 50, blacks: -25, whites: 15, clarity: 20, grain: 60, grainSize: 55, grainRough: 75, vig: -15 }],
  ['Film · B&W', 'Red Filter', { bw: true, contrast: 25, bwMix: [40, 30, 15, -10, -40, -60, -20, 10] }],
  ['Film · B&W', 'Infrared Glow', { bw: true, contrast: 20, bwMix: [10, 30, 50, 80, 20, -80, -30, 0], glow: 35, grain: 20 }],
  ['Film · B&W', 'Film Noir', { bw: true, contrast: 55, blacks: -30, vig: -45, vigFeather: 60, glow: 10, grain: 25 }],
  ['Film · B&W', 'Sepia Print', { bw: true, curve: CRV(FADE(0.05, 0.96)), gsH: 30, gsS: 25, gmH: 35, gmS: 20, ghH: 45, ghS: 12, grain: 15 }],
  ['Film · B&W', 'Cyanotype', { bw: true, contrast: 10, ggH: 205, ggS: 35, gsH: 215, gsS: 30 }],
  ['Film · B&W', 'Lith Print', { bw: true, contrast: 45, blacks: -20, gsH: 25, gsS: 30, ghH: 30, ghS: 8, grain: 40, grainRough: 90 }],
  ['Film · B&W', 'Silver Gelatin', { bw: true, contrast: 22, clarity: 14, whites: 10, blacks: -12, grain: 18, grainSize: 30, bwMix: [10, 14, 8, -10, -14, -20, -5, 5] }],
  ['Film · B&W', 'Selenium Print', { bw: true, contrast: 12, shadows: 10, gsH: 265, gsS: 18, ghH: 38, ghS: 12, gradeBalance: -10, vig: -12 }],
  ['Film · B&W', 'Soft Matte Mono', { bw: true, contrast: -10, curve: CRV([[0, 0.09], [0.3, 0.3], [0.75, 0.76], [1, 0.95]]), grain: 10 }],
  /* ---- everyday ---- */
  ['Color', 'Punch', { contrast: 28, vibrance: 28, clarity: 12, texture: 10, blacks: -8, whites: 8 }],
  ['Color', 'Golden Hour', { temp: 16, tint: 4, vibrance: 18, highlights: -12, ghH: 42, ghS: 18, gsH: 220, gsS: 8 }],
  ['Color', 'Blue Hour', { temp: -18, tint: 6, contrast: 10, gsH: 230, gsS: 22, ghH: 200, ghS: 6, vibrance: 10 }],
  ['Color', 'Clean Neutral', { contrast: 8, highlights: -18, shadows: 18, vibrance: 8, sharpen: 30 }],
  ['Color', 'Nocturne', { exposure: -0.3, dehaze: 15, clarity: 15, temp: -10, vibrance: 15, vig: -25, blacks: -10 }],
  ['Portrait', 'Soft Skin', { texture: -22, clarity: -10, highlights: -12, shadows: 8, sharpen: 20, hslL: [4, 8, 0, 0, 0, 0, 0, 0], hslS: [-4, -6, 0, 0, 0, 0, 0, 0] }],
  ['Portrait', 'High Key', { exposure: 0.6, contrast: -18, highlights: -30, shadows: 30, whites: 15, vibrance: -5 }],
  ['Portrait', 'Low Key', { exposure: -0.5, contrast: 20, shadows: -15, blacks: -20, vig: -30, vigFeather: 70 }],
  ['Landscape', 'Clear Air', { dehaze: 22, clarity: 18, vibrance: 22, highlights: -25, shadows: 20, texture: 10 }],
  ['Landscape', 'Green Season', { hslH: [0, 0, -15, 10, 0, 0, 0, 0], hslS: [0, 0, 15, 20, 10, 10, 0, 0], hslL: [0, 0, 5, 5, 0, -10, 0, 0], vibrance: 12 }]
].map(([group, name, values]) => ({ id: 'b:' + name, group, name, values, builtin: true, tags: LOOK_TAGS[name] || '' }));

/* ============================== state ============================== */
const S = {
  view: 'library', photos: [], collections: [], userPresets: [], luts: [], lookGroup: null, mtab: null,
  sel: new Set(), cur: null, source: { kind: 'all' }, lastImport: null,
  filter: { q: '', rating: 0, flag: 'all', label: 'any', sort: 'capture', cell: 190 },
  tool: null, zoom: 0, center: [0.5, 0.5], compare: 'off', split: 0.5, showClip: false, stageBg: 'mid',
  heal: { mode: 'heal', size: 3, feather: 40, opacity: 100 }, selSpot: -1,
  selMask: -1, maskCreate: null, maskOverlay: true, brush: { size: 6, feather: 60, flow: 60, erase: false },
  cropAspect: 'original', cropPortrait: false, constrain: true,
  curveCh: 'rgb', curveMode: 'point', mixMode: 'hsl', mixProp: 'all',
  clip: null, lastPreset: null, picking: null
};
let engine = null, img = null, imgFor = null, brushState = null;
const imgCache = new Map();
const ph = () => S.photos.find(p => p.id === S.cur);
const P = () => ph() && ph().edits;

function toast(msg, ms = 2600, action) {
  document.querySelectorAll('.toast').forEach(x => x.remove());
  const t = h('div', { class: 'toast', role: 'status' }, h('span', { text: msg }));
  const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 240); };
  if (action) t.append(h('button', { class: 'btn sm tact', onclick: () => { close(); action.fn(); } }, action.label));
  document.body.appendChild(t); setTimeout(close, action ? Math.max(ms, 6000) : ms);
}
const live = () => S.photos.filter(p => !p.deleted);
const selIds = () => [...S.sel].filter(id => S.photos.some(p => p.id === id));
const saveTimers = new Map();
function savePhoto(p, now) {
  clearTimeout(saveTimers.get(p.id));
  const go = () => U.DB.put('photos', p);
  if (now) return go();
  saveTimers.set(p.id, setTimeout(go, 500));
}
const saveColls = () => S.collections.forEach(c => U.DB.put('collections', c));

/* ============================== import ============================== */
async function decodeSource(rec) {
  if (imgCache.has(rec.id)) return imgCache.get(rec.id);
  let src = null;
  if (rec.raw) {
    const buf = await rec.blob.arrayBuffer();
    const r = await U.decodeRaw(buf, Math.min(engine.MAXTEX, 8192));
    if (r) src = { half: r.half, w: r.w, h: r.h, rawDecoded: true, exif: r.exif };
    else { const pv = await U.extractRawPreview(rec.blob); if (pv) src = await bitmapFrom(pv.blob); }
  } else src = await bitmapFrom(rec.blob);
  if (!src) return null;
  imgCache.set(rec.id, src);
  if (imgCache.size > 4) { const k = imgCache.keys().next().value; const v = imgCache.get(k); if (v && v.close) v.close(); imgCache.delete(k); }
  return src;
}
async function bitmapFrom(blob) {
  let b = await createImageBitmap(blob);
  const max = Math.min(engine.MAXTEX, 8192);
  if (Math.max(b.width, b.height) > max) {
    const s = max / Math.max(b.width, b.height); const nb = await createImageBitmap(b, { resizeWidth: Math.round(b.width * s), resizeHeight: Math.round(b.height * s), resizeQuality: 'high' }); b.close(); b = nb;
  }
  return b;
}
async function makeThumb(src, edits, mid) {
  const handle = engine.loadImage(src);
  const brush = buildBrush(edits, handle, mid);
  const id = engine.renderSmall(handle, edits, 360, brush);
  engine.freeImage(handle);
  const c = document.createElement('canvas'); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
  return c.toDataURL('image/jpeg', 0.82);
}
async function importFiles(files, opts = {}) {
  const list = [...files].filter(f => f.type.startsWith('image/') || U.RAW_EXT.test(f.name));
  if (!list.length) { toast('No photos found. Safelight opens JPEG, PNG, WebP, AVIF, GIF, HEIC (Safari) and camera RAW files.'); return; }
  const batch = U.uid(); let done = 0, failed = 0;
  const busy = showBusy(`Importing 0 of ${list.length}…`);
  for (const f of list) {
    try {
      const raw = U.RAW_EXT.test(f.name);
      const rec = { id: U.uid(), blob: f, raw, name: f.name };
      let exif = f.exif || {};
      if (!raw && /jpe?g$/i.test(f.type)) exif = Object.assign(U.parseExif(await f.slice(0, 262144).arrayBuffer()), exif);
      if (raw) exif = U.parseExif(await f.slice(0, 1048576).arrayBuffer());
      const src = await decodeSource(rec);
      if (!src) { failed++; continue; }
      if (src.exif) exif = Object.assign({}, exif, Object.fromEntries(Object.entries(src.exif).filter(([, v]) => v != null && v !== '')));
      const w = src.half ? src.w : src.width, hh = src.half ? src.h : src.height;
      await U.DB.put('images', rec);
      const edits = defaults();
      const p = {
        id: U.uid(), imageId: rec.id, name: f.name, size: f.size, w, h: hh, raw, rawMode: raw ? (src.half ? 'full' : 'preview') : null, exif,
        importedAt: Date.now(), captureAt: exif.captureAt || U.exifDate(exif.dateOriginal) || U.exifDate(exif.dateTime) || f.lastModified || Date.now(),
        rating: 0, flag: 0, label: null, keywords: opts.keywords || [], title: '', caption: '', sample: !!opts.sample, batch,
        edits, history: [{ label: 'Import', edits: U.clone(edits) }], hIndex: 0, snapshots: [], thumb: await makeThumb(src, edits, 'x')
      };
      S.photos.push(p); await U.DB.put('photos', p); done++;
    } catch (e) { console.error(e); failed++; }
    busy.textContent = `Importing ${done + failed} of ${list.length}…`;
  }
  busy.remove();
  S.lastImport = batch;
  if (!opts.sample && navigator.storage && navigator.storage.persist && !inFrame) navigator.storage.persist().catch(() => {});
  if (!opts.sample) toast(`Imported ${done} photo${done === 1 ? '' : 's'}${failed ? `, ${failed} could not be read` : ''}.`);
  const first = S.photos.find(p => p.batch === batch);
  if (first) { S.cur = first.id; S.sel = new Set([first.id]); }
  renderAll();
}
function showBusy(text) { const b = h('div', { class: 'busy', text }); $('#center').appendChild(b); return b; }

/* ============================== filtering ============================== */
function matchesSmart(p, r) {
  if (r.minRating && p.rating < r.minRating) return false;
  if (r.flag === 'pick' && p.flag !== 1) return false;
  if (r.flag === 'reject' && p.flag !== -1) return false;
  if (r.flag === 'none' && p.flag !== 0) return false;
  if (r.label && r.label !== 'any' && p.label !== r.label) return false;
  if (r.keyword && !p.keywords.some(k => k.toLowerCase().includes(r.keyword.toLowerCase()))) return false;
  if (r.edited && !isEdited(p.edits)) return false;
  return true;
}
function visiblePhotos() {
  const src = S.source, f = S.filter;
  let list = S.photos.filter(p => {
    if (src.kind === 'trash') return !!p.deleted;
    if (p.deleted) return false;
    if (src.kind === 'import' && p.batch !== S.lastImport) return false;
    if (src.kind === 'picks' && p.flag !== 1) return false;
    if (src.kind === 'edited' && !isEdited(p.edits)) return false;
    if (src.kind === 'col') { const c = S.collections.find(c => c.id === src.id); if (!c || !c.photos.includes(p.id)) return false; }
    if (src.kind === 'smart') { const c = S.collections.find(c => c.id === src.id); if (!c || !matchesSmart(p, c.rules)) return false; }
    if (src.kind === 'kw' && !p.keywords.includes(src.id)) return false;
    if (f.q) { const q = f.q.toLowerCase(); if (![p.name, p.title, p.caption, ...p.keywords].join(' ').toLowerCase().includes(q)) return false; }
    if (f.rating && p.rating < f.rating) return false;
    if (f.flag === 'pick' && p.flag !== 1) return false;
    if (f.flag === 'reject' && p.flag !== -1) return false;
    if (f.flag === 'none' && p.flag !== 0) return false;
    if (f.label !== 'any' && p.label !== f.label) return false;
    return true;
  });
  const sorters = { capture: (a, b) => a.captureAt - b.captureAt, import: (a, b) => a.importedAt - b.importedAt, name: (a, b) => a.name.localeCompare(b.name), rating: (a, b) => b.rating - a.rating || a.captureAt - b.captureAt };
  return list.sort(sorters[f.sort] || sorters.capture);
}

/* ============================== shell ============================== */
function setView(v) {
  if (v === 'edit' && (!ph() || ph().deleted)) { if (S.source.kind === 'trash') S.source = { kind: 'all' }; S.cur = null; const l = visiblePhotos(); if (!l.length) { toast('Import a photo first.'); return; } S.cur = l[0].id; S.sel = new Set([S.cur]); }
  if (S.view === 'edit' && v !== 'edit') finishEditing();
  S.view = v; S.tool = null; S.picking = null;
  $('#mLib').classList.toggle('on', v === 'library'); $('#mEdit').classList.toggle('on', v === 'edit');
  try { localStorage.setItem('safelight.view', v); } catch (e) {}
  renderAll();
}
function renderAll() {
  if (S.view === 'library') { renderLibLeft(); renderLibCenter(); renderLibRight(); }
  else { renderEditLeft(); renderEditCenter(); renderEditRight(); }
  renderStrip(); renderTabbar();
}
function section(id, title, body, opts = {}) {
  let closed = false; try { closed = localStorage.getItem('safelight.sec.' + id) === '0'; } catch (e) {}
  if (opts.open && localStorage.getItem('safelight.sec.' + id) == null) closed = false;
  const el = h('div', { class: 'sec' + (closed ? ' closed' : '') + (opts.mod ? ' mod' : ''), id: 'sec-' + id });
  const head = h('h3', { onclick: (e) => { if (e.target.closest('.act')) return; el.classList.toggle('closed'); try { localStorage.setItem('safelight.sec.' + id, el.classList.contains('closed') ? '0' : '1'); } catch (e2) {} } },
    h('span', { class: 'dot' }), title, opts.action || null, h('span', { class: 'chev', html: '&#9662;' }));
  el.append(head, h('div', { class: 'bw' }, h('div', { class: 'body' }, body)));
  el.dataset.tab = SEC_TAB[id] || 'none';
  return el;
}
const SEC_TAB = { catalog: 'albums', cols: 'albums', kw: 'albums', backup: 'albums', quick: 'info', meta: 'info', pcols: 'info', pact: 'info',
  presets: 'looks', basic: 'light', curve: 'color', mixer: 'color', grading: 'color', calibration: 'color', effects: 'effects', detail: 'detail', lens: 'detail', transform: 'detail',
  croptool: 'tools', healtool: 'tools', masktool: 'tools', snaps: 'history', hist: 'history', photoAct: 'history' };

/* ============================== library: left ============================== */
function renderLibLeft() {
  const L = $('#left'); L.innerHTML = '';
  const lp = live(), n = (fn) => lp.filter(fn).length;
  const go = (src) => { S.source = src; if (isMobile()) S.mtab = 'photos'; renderAll(); };
  const item = (label, src, count, extra, icon) => {
    const on = S.source.kind === src.kind && S.source.id === src.id;
    const b = h('button', { class: 'li' + (on ? ' on' : ''), onclick: () => go(src) }, icon || null, h('span', { class: 't', text: label }), h('span', { class: 'n', text: count }), extra || null);
    if (src.kind === 'col') acceptPhotoDrop(b, src.id);
    return b;
  };
  const trashN = S.photos.filter(p => p.deleted).length;
  L.append(section('catalog', 'Library', h('div', { class: 'list' },
    item('All photos', { kind: 'all' }, lp.length),
    item('Previous import', { kind: 'import' }, n(p => p.batch === S.lastImport)),
    item('Picks', { kind: 'picks' }, n(p => p.flag === 1)),
    item('Edited', { kind: 'edited' }, n(p => isEdited(p.edits))),
    item('Recently deleted', { kind: 'trash' }, trashN)
  )));
  const cover = (c) => { const p = c.smart ? lp.find(x => matchesSmart(x, c.rules)) : c.photos.map(id => S.photos.find(x => x.id === id)).find(x => x && !x.deleted); return h('span', { class: 'cov' }, p ? h('img', { src: p.thumb, alt: '' }) : null); };
  const tools = (c) => h('span', { class: 'acts' },
    h('button', { class: 'x', title: 'Rename', 'aria-label': 'Rename album ' + c.name, onclick: (e) => { e.stopPropagation(); renameAlbumDlg(c); } }, '✎'),
    h('button', { class: 'x', title: 'Delete album', 'aria-label': 'Delete album ' + c.name, onclick: (e) => { e.stopPropagation(); confirmDlg(`Delete the album “${c.name}”? The photos stay in your library.`, 'Delete album', () => { S.collections = S.collections.filter(x => x !== c); U.DB.del('collections', c.id); if (S.source.id === c.id) S.source = { kind: 'all' }; renderAll(); }); } }, '×'));
  const albums = S.collections.filter(c => !c.smart).map(c => item(c.name, { kind: 'col', id: c.id }, c.photos.filter(id => lp.some(p => p.id === id)).length, tools(c), cover(c)));
  const smarts = S.collections.filter(c => c.smart).map(c => item(c.name, { kind: 'smart', id: c.id }, n(p => matchesSmart(p, c.rules)), tools(c), cover(c)));
  L.append(section('cols', 'Albums', h('div', {},
    h('div', { class: 'list albums' }, albums.length ? albums : h('div', { class: 'empty', text: isMobile() ? 'Make an album, then select photos and choose Album to add them.' : 'Make an album, then drag photos onto it, or select photos and choose Album.' })),
    smarts.length ? [h('div', { class: 'sub', text: 'Smart albums' }), h('div', { class: 'list albums' }, smarts)] : null,
    h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { class: 'btn sm', onclick: newCollectionDlg }, '+ Album'),
      h('button', { class: 'btn sm', onclick: () => smartDlg() }, '+ Smart album')))));
  const kw = {}; lp.forEach(p => p.keywords.forEach(k => kw[k] = (kw[k] || 0) + 1));
  const kws = Object.keys(kw).sort();
  setTimeout(applyMobile, 0);
  const stor = h('div', { class: 'empty', id: 'storInfo', style: { padding: 0 } });
  L.append(section('backup', 'Backup & storage', [stor,
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: backupDlg }, 'Back up library'), h('button', { class: 'btn sm', onclick: () => $('#restoreIn').click() }, 'Restore backup'),
      h('input', { type: 'file', id: 'restoreIn', accept: '.zip,application/zip', hidden: true, onchange: (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) restoreBackup(f); } }))]));
  updateStorageInfo();
  L.append(section('kw', 'Keywords', h('div', { class: 'list' }, kws.length ? kws.map(k => item(k, { kind: 'kw', id: k }, kw[k])) : h('div', { class: 'empty', text: 'Keywords you add to photos appear here.' }))));
}
async function updateStorageInfo() {
  const el = $('#storInfo'); if (!el) return;
  let txt = U.DB.persistent ? 'Your library is saved in this browser on this device.' : 'This browser is not saving your library. Back up before closing the page.';
  try {
    if (navigator.storage && navigator.storage.estimate) { const est = await navigator.storage.estimate(); txt += ` Using ${(est.usage / 1048576).toFixed(0)} MB.`; }
    if (navigator.storage && navigator.storage.persisted) {
      const pers = await navigator.storage.persisted();
      el.textContent = txt + (pers ? ' Protected from automatic cleanup.' : ' ');
      if (!pers && U.DB.persistent) el.append(h('button', { class: 'btn sm ghost', style: { padding: '0 4px' }, onclick: async () => { const ok = await navigator.storage.persist().catch(() => false); toast(ok ? 'Storage protected: the browser will not clear your library to free space.' : 'The browser did not allow protected storage here. Install the app or back up regularly.', 4500); updateStorageInfo(); } }, 'Protect storage'));
      return;
    }
  } catch (e) {}
  el.textContent = txt;
}
function backupDlg() {
  const lp = S.photos; const withOrig = h('input', { type: 'checkbox', id: 'bkOrig', checked: true });
  const status = h('div', { class: 'empty', style: { padding: 0 }, text: `${lp.length} photo${lp.length === 1 ? '' : 's'}, ${S.collections.length} album${S.collections.length === 1 ? '' : 's'}, ${S.userPresets.length} preset${S.userPresets.length === 1 ? '' : 's'} and ${S.luts.length} LUT${S.luts.length === 1 ? '' : 's'}.` });
  const d = dialog('Back up library', [h('p', { style: { margin: 0, lineHeight: 1.5 }, text: 'Saves one .zip file with your photos, every edit, ratings, keywords, albums, presets and LUTs. Restore it here or on another device.' }),
    h('label', { class: 'chk' }, withOrig, 'Include original photo files (needed to restore on another device)'), status], 'Save backup', async () => {
    d.ok.disabled = true;
    const files = [];
    const meta = { app: 'Safelight', version: 1, exportedAt: Date.now(), photos: S.photos, collections: S.collections, presets: S.userPresets, luts: S.luts };
    files.push({ name: 'safelight.json', blob: new Blob([JSON.stringify(meta)], { type: 'application/json' }) });
    if (withOrig.checked) {
      const ids = [...new Set(S.photos.map(p => p.imageId))]; let i = 0;
      for (const id of ids) { i++; status.textContent = `Adding original ${i} of ${ids.length}…`; const rec = await U.DB.get('images', id); if (rec && rec.blob) files.push({ name: `images/${id}`, blob: rec.blob }); }
      files.push({ name: 'images.json', blob: new Blob([JSON.stringify(ids.map(id => ({ id })))], { type: 'application/json' }) });
    }
    for (const l of S.luts) { const rec = await U.DB.get('luts', l.id); if (rec) files.push({ name: `luts/${l.id}.bin`, blob: new Blob([rec.data instanceof Float32Array ? rec.data : new Float32Array(rec.data)]) }); }
    status.textContent = 'Packing…';
    const zip = await U.zip(files);
    const name = `safelight-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    const r = await saveFile(name, zip);
    status.textContent = r.ok ? `Saved ${name} (${(zip.size / 1048576).toFixed(1)} MB).` : r.msg;
    d.ok.disabled = false;
    if (r.ok) { try { localStorage.setItem('safelight.lastBackup', String(Date.now())); } catch (e) {} toast('Backup saved.'); }
    return false;
  });
}
async function restoreBackup(file) {
  const busy = showBusy('Reading backup…');
  try {
    const entries = await U.unzip(file);
    const mf = entries.get('safelight.json'); if (!mf) throw new Error('This zip is not a Safelight backup.');
    const meta = JSON.parse(await mf.text());
    let added = 0, skipped = 0, missing = 0;
    for (const p of meta.photos || []) {
      if (S.photos.some(x => x.id === p.id)) { skipped++; continue; }
      const have = await U.DB.get('images', p.imageId);
      if (!have) { const b = entries.get('images/' + p.imageId); if (!b) { missing++; continue; } await U.DB.put('images', { id: p.imageId, blob: new File([b], p.name, { type: p.raw ? 'application/octet-stream' : (b.type || 'image/jpeg') }), raw: !!p.raw, name: p.name }); }
      S.photos.push(p); await U.DB.put('photos', p); added++;
    }
    for (const c of meta.collections || []) { const ex = S.collections.find(x => x.id === c.id); if (ex) { if (!ex.smart) ex.photos = [...new Set([...ex.photos, ...(c.photos || [])])]; await U.DB.put('collections', ex); } else { S.collections.push(c); await U.DB.put('collections', c); } }
    for (const pr of meta.presets || []) if (!S.userPresets.some(x => x.id === pr.id)) { S.userPresets.push(pr); await U.DB.put('presets', pr); }
    for (const l of meta.luts || []) {
      if (S.luts.some(x => x.id === l.id)) continue; const b = entries.get(`luts/${l.id}.bin`); if (!b) continue;
      const data = new Float32Array(await b.arrayBuffer()); await U.DB.put('luts', { id: l.id, name: l.name, size: l.size, data }); engine.registerLut(l.id, l.size, data); S.luts.push({ id: l.id, name: l.name, size: l.size });
    }
    busy.remove(); S.source = { kind: 'all' }; renderAll();
    toast(`Restored ${added} photo${added === 1 ? '' : 's'}${skipped ? `, ${skipped} already here` : ''}${missing ? `, ${missing} skipped because the backup has no original file` : ''}.`, 6000);
  } catch (e) { busy.remove(); toast('Could not restore: ' + e.message, 5000); }
}
function renameAlbumDlg(c) {
  const name = h('input', { type: 'text', id: 'albName', value: c.name });
  dialog('Rename album', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name)], 'Rename', () => { c.name = name.value.trim() || c.name; U.DB.put('collections', c); renderAll(); });
  setTimeout(() => name.select(), 30);
}
function acceptPhotoDrop(el, colId) {
  el.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('text/x-safelight')) { e.preventDefault(); el.classList.add('dropon'); } });
  el.addEventListener('dragleave', () => el.classList.remove('dropon'));
  el.addEventListener('drop', (e) => { const d = e.dataTransfer.getData('text/x-safelight'); el.classList.remove('dropon'); if (!d) return; e.preventDefault(); addToAlbum(colId, d.split(',')); });
}
function addToAlbum(colId, ids) {
  const c = S.collections.find(x => x.id === colId); if (!c) return;
  let n = 0; ids.forEach(id => { if (!c.photos.includes(id)) { c.photos.push(id); n++; } });
  U.DB.put('collections', c); renderLibLeft(); if (S.view === 'library') renderLibRight();
  toast(n ? `Added ${n} photo${n === 1 ? '' : 's'} to “${c.name}”.` : `Already in “${c.name}”.`);
}
function newCollectionDlg() {
  const name = h('input', { type: 'text', id: 'colName', value: 'New album' });
  const addSel = h('input', { type: 'checkbox', id: 'colAdd', checked: S.sel.size > 0 });
  dialog('New album', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name), S.sel.size ? h('label', { class: 'chk' }, addSel, `Add the ${S.sel.size} selected photo${S.sel.size === 1 ? '' : 's'}`) : null], 'Create', () => {
    const c = { id: U.uid(), name: name.value.trim() || 'Untitled', photos: addSel.checked ? [...S.sel] : [] };
    S.collections.push(c); U.DB.put('collections', c); S.source = { kind: 'col', id: c.id }; renderAll();
  });
  setTimeout(() => name.select(), 30);
}
function smartDlg() {
  const name = h('input', { type: 'text', id: 'smName', value: 'Best of' });
  const rating = h('select', { id: 'smRating' }, ['Any', '1+', '2+', '3+', '4+', '5'].map((t, i) => h('option', { value: i, text: t })));
  const flag = h('select', { id: 'smFlag' }, [['any', 'Any flag'], ['pick', 'Picked'], ['none', 'Unflagged'], ['reject', 'Rejected']].map(([v, t]) => h('option', { value: v, text: t })));
  const label = h('select', { id: 'smLabel' }, [['any', 'Any label'], ...Object.keys(LABELS).map(k => [k, k[0].toUpperCase() + k.slice(1)])].map(([v, t]) => h('option', { value: v, text: t })));
  const kw = h('input', { type: 'text', id: 'smKw', placeholder: 'e.g. travel' });
  const ed = h('input', { type: 'checkbox', id: 'smEd' });
  rating.value = '3';
  dialog('New smart album', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Rating' }), rating), h('label', { class: 'field' }, h('span', { text: 'Flag' }), flag), h('label', { class: 'field' }, h('span', { text: 'Color label' }), label), h('label', { class: 'field' }, h('span', { text: 'Keyword contains' }), kw)),
    h('label', { class: 'chk' }, ed, 'Only edited photos')], 'Create', () => {
    const c = { id: U.uid(), name: name.value.trim() || 'Smart album', smart: true, rules: { minRating: +rating.value, flag: flag.value, label: label.value, keyword: kw.value.trim(), edited: ed.checked } };
    S.collections.push(c); U.DB.put('collections', c); S.source = { kind: 'smart', id: c.id }; renderAll();
  });
}

/* ============================== library: center ============================== */
function stars(p, onset) {
  return h('span', { class: 'stars', role: 'group', 'aria-label': 'Rating' }, [1, 2, 3, 4, 5].map(i => h('button', { class: i <= p.rating ? 'on' : '', 'aria-label': i + ' star' + (i > 1 ? 's' : ''), onclick: (e) => { e.stopPropagation(); onset(p.rating === i ? 0 : i); } }, '★')));
}
function setMeta(ids, fn) { ids.forEach(id => { const p = S.photos.find(x => x.id === id); if (p) { fn(p); savePhoto(p); } }); renderAll(); }
function renderLibCenter() {
  const C = $('#center'); C.innerHTML = '';
  const f = S.filter;
  const q = h('input', { type: 'text', id: 'libQ', placeholder: 'Search name, keyword, title', value: f.q, oninput: (e) => { f.q = e.target.value; renderGrid(); } });
  const sel = (id, opts, val, on) => { const s = h('select', { id, onchange: (e) => { on(e.target.value); renderGrid(); } }, opts.map(([v, t]) => h('option', { value: v, text: t }))); s.value = val; return s; };
  const bar = h('div', { class: 'libbar' }, q,
    sel('libRating', [[0, 'Any rating'], [1, '★ and up'], [2, '★★ and up'], [3, '★★★ and up'], [4, '★★★★ and up'], [5, '★★★★★']], f.rating, v => f.rating = +v),
    sel('libFlag', [['all', 'All flags'], ['pick', 'Picks'], ['none', 'Unflagged'], ['reject', 'Rejected']], f.flag, v => f.flag = v),
    sel('libLabel', [['any', 'Any label'], ...Object.keys(LABELS).map(k => [k, k[0].toUpperCase() + k.slice(1)])], f.label, v => f.label = v),
    sel('libSort', [['capture', 'Sort: capture time'], ['import', 'Sort: import order'], ['name', 'Sort: file name'], ['rating', 'Sort: rating']], f.sort, v => { f.sort = v; savePrefs(); }),
    h('input', { type: 'range', id: 'libSize', min: 120, max: 320, value: f.cell, style: { width: '90px' }, 'aria-label': 'Thumbnail size', oninput: (e) => { f.cell = +e.target.value; $('#grid').style.setProperty('--cell', f.cell + 'px'); } }),
    h('span', { class: 'count', id: 'libCount' }),
    h('label', { class: 'chk donly', title: 'Show date headings (when sorted by capture time)' }, h('input', { type: 'checkbox', id: 'libGroup', checked: !!f.group, onchange: (e) => { f.group = e.target.checked; savePrefs(); renderGrid(); } }), 'By date'),
    h('button', { class: 'btn sm monly', id: 'selAll', hidden: !S.selectMode, onclick: () => { const list = visiblePhotos(); const all = list.length && list.every(p => S.sel.has(p.id)); S.sel = all ? new Set() : new Set(list.map(p => p.id)); renderGrid(); renderLibRight(); renderStrip(); updateSelBtns(); } }, 'All'),
    h('button', { class: 'btn sm monly' + (S.selectMode ? ' on' : ''), id: 'selBtn', onclick: () => setSelectMode(!S.selectMode) }, S.selectMode ? 'Done' : 'Select'));
  const grid = h('div', { class: 'grid', id: 'grid', style: { '--cell': f.cell + 'px' } });
  grid.addEventListener('pointerdown', () => { suppressCellClick = false; }, true);
  C.append(bar, grid, h('div', { class: 'selbar', id: 'selbar', hidden: true }));
  setupDrop(C);
  renderGrid();
}
function renderGrid() {
  const grid = $('#grid'); if (!grid) return;
  const list = visiblePhotos(); grid.innerHTML = '';
  $('#libCount').textContent = `${list.length} of ${live().length} · ${selIds().length} selected`;
  renderSelBar();
  if (!list.length) {
    grid.append(h('div', { class: 'empty', style: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' } },
      S.source.kind === 'trash' ? 'Nothing here. Deleted photos stay here for 30 days before they are removed for good.' : live().length ? 'No photos match these filters.' : 'Drop photos here, or use Import. JPEG, PNG, WebP and camera RAW files all work.'));
    return;
  }
  const grouped = S.filter.group && S.filter.sort === 'capture' && list.length > 1;
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
  let lastDay = null;
  for (const p of list) {
    if (grouped && dayKey(p.captureAt) !== lastDay) {
      lastDay = dayKey(p.captureAt); const day = lastDay;
      const dayIds = list.filter(x => dayKey(x.captureAt) === day).map(x => x.id);
      grid.append(h('div', { class: 'dayhead' }, h('span', { text: new Date(p.captureAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }), h('span', { class: 'n', text: dayIds.length }),
        h('button', { class: 'btn sm ghost', onclick: () => { if (isMobile() && !S.selectMode) setSelectMode(true); const all = dayIds.every(id => S.sel.has(id)); dayIds.forEach(id => all ? S.sel.delete(id) : S.sel.add(id)); if (!S.sel.size && !isMobile() && S.cur) S.sel.add(S.cur); renderGrid(); renderLibRight(); renderStrip(); updateSelBtns(); } }, 'Select day')));
    }
    const ed = isEdited(p.edits);
    const cell = h('div', { class: 'cell' + (S.sel.has(p.id) ? ' sel' : '') + (S.cur === p.id ? ' cur' : '') + (p.flag === -1 ? ' rej' : ''), tabindex: 0, draggable: isMobile() ? 'false' : 'true', 'data-id': p.id,
      onclick: (e) => {
        if (suppressCellClick) { suppressCellClick = false; return; }
        if (isMobile()) { if (S.selectMode) toggleSel(p.id); else if (S.source.kind !== 'trash') { S.cur = p.id; S.sel = new Set([p.id]); setView('edit'); } else { setSelectMode(true); toggleSel(p.id); } return; }
        selectPhoto(p.id, e, list);
      },
      ondblclick: () => { if (isMobile() || S.source.kind === 'trash') return; S.cur = p.id; S.sel = new Set([p.id]); setView('edit'); },
      oncontextmenu: (e) => { e.preventDefault(); if (!S.sel.has(p.id)) { S.sel = new Set([p.id]); S.cur = p.id; renderGrid(); renderLibRight(); renderStrip(); } photoMenu(e.clientX, e.clientY); },
      ondragstart: (e) => { if (!S.sel.has(p.id)) { S.sel = new Set([p.id]); S.cur = p.id; } e.dataTransfer.setData('text/x-safelight', selIds().join(',')); e.dataTransfer.effectAllowed = 'copy'; } },
      h('div', { class: 'thumb' }, h('img', { src: p.thumb, alt: p.title || p.name, loading: 'lazy', draggable: 'false' })),
      p.rating ? h('span', { class: 'mstar monly', text: '★'.repeat(p.rating) }) : null,
      h('div', { class: 'nm', text: p.title || p.name }),
      h('div', { class: 'ft' }, stars(p, r => setMeta([p.id], x => x.rating = r)),
        p.label ? h('span', { class: 'lbl', style: { background: LABELS[p.label] }, title: p.label }) : null,
        p.flag === 1 ? h('span', { class: 'flag pick', text: 'PICK' }) : p.flag === -1 ? h('span', { class: 'flag rej', text: 'REJECT' }) : null,
        h('span', { style: { flex: 1 } }),
        p.raw ? h('span', { class: 'tag', text: 'RAW' }) : null,
        p.virtual ? h('span', { class: 'tag', text: 'COPY' }) : null,
        ed ? h('span', { class: 'tag ed', text: 'EDITED' }) : null));
    longPress(cell, () => { suppressCellClick = true; buzz(10); if (!S.selectMode) setSelectMode(true); if (!S.sel.has(p.id)) toggleSel(p.id); });
    grid.append(cell);
  }
}
let suppressCellClick = false; // swallows only the click that ends a long press; any new touch clears it
function longPress(el, fn) {
  let t = null, x = 0, y = 0;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; x = e.clientX; y = e.clientY; clearTimeout(t); t = setTimeout(fn, 450); });
  el.addEventListener('pointermove', (e) => { if (t && Math.hypot(e.clientX - x, e.clientY - y) > 8) { clearTimeout(t); t = null; } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, () => { clearTimeout(t); t = null; }));
  el.addEventListener('contextmenu', (e) => { if (e.pointerType !== 'mouse' && isMobile()) e.preventDefault(); });
}
function setSelectMode(on) {
  S.selectMode = on; S.sel = new Set();
  if (!on && S.cur && !isMobile()) S.sel.add(S.cur);
  document.body.classList.toggle('selmode', on);
  const b = $('#selBtn'); if (b) { b.textContent = on ? 'Done' : 'Select'; b.classList.toggle('on', on); }
  const a = $('#selAll'); if (a) a.hidden = !on;
  updateSelBtns();
  renderGrid(); renderLibRight(); renderStrip(); renderTabbar();
}
function toggleSel(id) {
  const removing = S.sel.has(id);
  removing ? S.sel.delete(id) : S.sel.add(id); S.cur = id;
  // like other photo apps: deselecting the last photo leaves select mode, so the next tap opens the photo again
  if (removing && !S.sel.size && isMobile() && S.selectMode) { setSelectMode(false); return; }
  const c = document.querySelector(`.cell[data-id="${id}"]`); if (c) c.classList.toggle('sel', S.sel.has(id));
  const n = $('#libCount'); if (n) n.textContent = `${visiblePhotos().length} of ${live().length} · ${selIds().length} selected`;
  renderSelBar(); renderLibRight(); renderStrip(); updateSelBtns();
}
function updateSelBtns() {
  const a = $('#selAll'); if (!a) return; const list = visiblePhotos();
  a.textContent = list.length && list.every(p => S.sel.has(p.id)) ? 'None' : 'All';
}
function savePrefs() { try { localStorage.setItem('safelight.filter', JSON.stringify({ sort: S.filter.sort, cell: S.filter.cell, group: !!S.filter.group })); } catch (e) {} }
/* ---- selection action bar ---- */
const AICON = {
  star: '<path d="M10 2.5l2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z"/>',
  flag: '<path d="M5 17V3M5 3h9l-2 3.5 2 3.5H5"/>',
  label: '<circle cx="10" cy="10" r="6"/>',
  album: '<path d="M3 6h5l2 2h7v8H3z"/><path d="M10 10v4M8 12h4"/>',
  out: '<path d="M10 3v10M6 9l4 4 4-4M4 16h12"/>',
  trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>',
  restore: '<path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3v3h3"/>',
  copy: '<rect x="6" y="6" width="10" height="10" rx="1.5"/><path d="M4 13V4h9"/>',
  minus: '<path d="M3 6h5l2 2h7v8H3z"/><path d="M8 12h4"/>',
  all: '<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10l2 2 4-4"/>',
  compare: '<rect x="2.5" y="4" width="6.5" height="12" rx="1"/><rect x="11" y="4" width="6.5" height="12" rx="1"/>'
};
const ibtn = (icon, label, fn, cls) => h('button', { class: 'sbtn' + (cls ? ' ' + cls : ''), onclick: fn, title: label, 'aria-label': label, html: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${AICON[icon]}</svg><span>${label}</span>` });
function renderSelBar() {
  const bar = $('#selbar'); if (!bar) return;
  const ids = selIds(), trash = S.source.kind === 'trash';
  // phones: only in select mode and only once something is selected; desktop: when several are selected (one photo uses the side panel)
  const show = isMobile() ? (S.selectMode && ids.length > 0) : ids.length >= (trash ? 1 : 2);
  if (!show) {
    document.body.classList.remove('hasbar');
    if (!bar.hidden && !bar.classList.contains('leaving')) { bar.classList.add('leaving'); setTimeout(() => { bar.classList.remove('leaving'); if (bar.classList.contains('leaving') === false && !document.body.classList.contains('hasbar')) bar.hidden = true; }, 180); }
    return;
  }
  bar.classList.remove('leaving'); bar.hidden = false;
  document.body.classList.add('hasbar');
  bar.innerHTML = '';
  bar.append(h('div', { class: 'sbhead' }, h('b', { text: `${ids.length} selected` }),
    h('button', { class: 'btn sm ghost', onclick: () => { if (isMobile() && S.selectMode) { setSelectMode(false); return; } S.sel = new Set(); renderGrid(); renderLibRight(); renderStrip(); updateSelBtns(); } }, 'Clear')));
  const acts = h('div', { class: 'sbacts' });
  if (trash) acts.append(ibtn('restore', 'Restore', () => restorePhotos(ids)), ibtn('trash', 'Delete forever', () => purgeDlg(ids), 'danger'));
  else {
    acts.append(ibtn('star', 'Rate', () => ratePicker(ids)), ibtn('flag', 'Flag', () => flagPicker(ids)), ibtn('label', 'Label', () => labelPicker(ids)), ibtn('album', 'Album', () => albumPicker(ids)));
    if (ids.length >= 2 && ids.length <= 4) acts.append(ibtn('compare', 'Compare', () => compareView(ids)));
    if (S.source.kind === 'col') acts.append(ibtn('minus', 'Remove from album', () => removeFromAlbum(S.source.id, ids)));
    acts.append(ibtn('out', 'Export', () => exportDlg()), ibtn('trash', 'Delete', () => trashPhotos(ids), 'danger'));
  }
  bar.append(acts);
}
function ratePicker(ids) {
  const d = dialog(`Rate ${ids.length} photo${ids.length === 1 ? '' : 's'}`, [h('div', { class: 'pickrow' }, [0, 1, 2, 3, 4, 5].map(r => h('button', { class: 'btn', onclick: () => { setMeta(ids, p => p.rating = r); d.close(); } }, r ? '★'.repeat(r) : 'None')))], null, null, { cancel: 'Close' });
}
function flagPicker(ids) {
  const d = dialog(`Flag ${ids.length} photo${ids.length === 1 ? '' : 's'}`, [h('div', { class: 'pickrow' }, [[1, 'Pick'], [0, 'Unflag'], [-1, 'Reject']].map(([v, t]) => h('button', { class: 'btn', onclick: () => { setMeta(ids, p => p.flag = v); d.close(); } }, t)))], null, null, { cancel: 'Close' });
}
function labelPicker(ids) {
  const d = dialog(`Color label for ${ids.length} photo${ids.length === 1 ? '' : 's'}`, [h('div', { class: 'pickrow' }, [null, ...Object.keys(LABELS)].map(k => h('button', { class: 'btn', onclick: () => { setMeta(ids, p => p.label = k); d.close(); } }, h('span', { class: 'lbl', style: { background: k ? LABELS[k] : 'transparent', border: k ? 0 : '1px solid var(--faint)' } }), k ? k[0].toUpperCase() + k.slice(1) : 'None')))], null, null, { cancel: 'Close' });
}
function albumPicker(ids) {
  const albums = S.collections.filter(c => !c.smart);
  const name = h('input', { type: 'text', id: 'pickAlbum', placeholder: 'New album name' });
  const d = dialog(`Add ${ids.length} photo${ids.length === 1 ? '' : 's'} to an album`, [
    albums.length ? h('div', { class: 'list' }, albums.map(c => { const has = ids.every(id => c.photos.includes(id)); return h('button', { class: 'li' + (has ? ' on' : ''), onclick: () => { addToAlbum(c.id, ids); d.close(); } }, h('span', { class: 't', text: c.name }), h('span', { class: 'n', text: has ? 'added' : c.photos.length })); })) : h('div', { class: 'empty', text: 'No albums yet. Name one below.' }),
    h('div', { class: 'row' }, name, h('button', { class: 'btn pri', onclick: () => { const nm = name.value.trim(); if (!nm) { name.focus(); return; } const c = { id: U.uid(), name: nm, photos: [] }; S.collections.push(c); U.DB.put('collections', c); addToAlbum(c.id, ids); d.close(); } }, 'Create & add'))], null, null, { cancel: 'Close' });
}
function removeFromAlbum(colId, ids) {
  const c = S.collections.find(x => x.id === colId); if (!c) return;
  const before = c.photos.slice(); c.photos = c.photos.filter(id => !ids.includes(id)); U.DB.put('collections', c);
  S.sel = new Set(); renderAll();
  toast(`Removed ${ids.length} from “${c.name}”. The photos stay in your library.`, 4000, { label: 'Undo', fn: () => { c.photos = before; U.DB.put('collections', c); renderAll(); } });
}
async function compareView(ids) {
  ids = ids.slice(0, 4);
  const close = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 180); removeEventListener('keydown', key, true); renderAll(); };
  const panes = h('div', { class: 'cmpgrid n' + ids.length });
  const ov = h('div', { class: 'cmpview', role: 'dialog', 'aria-label': 'Compare photos' },
    h('div', { class: 'cmpbar' }, h('b', { text: `Compare ${ids.length} photos` }), h('span', { class: 'empty', style: { padding: 0 }, text: 'Rate, pick or reject, then close.' }), h('span', { style: { flex: 1 } }), h('button', { class: 'btn', onclick: () => close() }, 'Done')), panes);
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true);
  document.body.appendChild(ov);
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    const cv = h('canvas', { class: 'cmpimg' }); const img0 = h('img', { class: 'cmpimg', src: p.thumb, alt: '' });
    const info = h('div', { class: 'cmpinfo' });
    const drawInfo = () => { info.innerHTML = ''; info.append(h('span', { class: 'cmpname', text: p.title || p.name }), stars(p, r => { p.rating = r; savePhoto(p); drawInfo(); }),
      h('div', { class: 'seg' }, [[1, 'Pick'], [0, '—'], [-1, 'Reject']].map(([v, t]) => h('button', { class: p.flag === v ? 'on' : '', onclick: () => { p.flag = v; savePhoto(p); drawInfo(); pane.classList.toggle('rej', v === -1); pane.classList.toggle('pick', v === 1); } }, t)))); };
    const pane = h('div', { class: 'cmppane' + (p.flag === -1 ? ' rej' : '') + (p.flag === 1 ? ' pick' : '') }, h('div', { class: 'cmpimgwrap' }, img0), info);
    drawInfo(); panes.append(pane);
  }
  // render each at full quality for the pane size
  await new Promise(r => setTimeout(r, 60));
  const panesEls = [...panes.children];
  for (let i = 0; i < ids.length; i++) {
    const p = S.photos.find(x => x.id === ids[i]); const wrap = panesEls[i] && panesEls[i].querySelector('.cmpimgwrap'); if (!p || !wrap || !ov.isConnected) continue;
    try {
      const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src || !ov.isConnected) continue;
      const hd = engine.loadImage(src); const long = Math.round(Math.max(wrap.clientWidth, wrap.clientHeight) * Math.min(devicePixelRatio || 1, 2));
      const id = engine.renderSmall(hd, p.edits, Math.max(200, Math.min(long, 2400)), buildBrush(p.edits, hd, 'x')); engine.freeImage(hd);
      const c = h('canvas', { class: 'cmpimg' }); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
      wrap.innerHTML = ''; wrap.append(c);
    } catch (e) { console.error(e); }
  }
  if (S.view === 'edit') requestRender();
}
function photoMenu(x, y) {
  document.querySelectorAll('.ctx').forEach(m => m.remove());
  const ids = selIds(), trash = S.source.kind === 'trash', p = ph();
  const it = (label, fn, cls) => h('button', { class: 'ctxi' + (cls ? ' ' + cls : ''), onclick: () => { m.remove(); fn(); } }, label);
  const m = h('div', { class: 'ctx', role: 'menu' }, trash ? [it('Restore', () => restorePhotos(ids)), it('Delete forever…', () => purgeDlg(ids), 'danger')] : [
    ids.length === 1 ? it('Edit', () => setView('edit')) : null,
    it('Rate…', () => ratePicker(ids)), it('Flag…', () => flagPicker(ids)), it('Color label…', () => labelPicker(ids)),
    it('Add to album…', () => albumPicker(ids)), S.source.kind === 'col' ? it('Remove from album', () => removeFromAlbum(S.source.id, ids)) : null,
    ids.length >= 2 && ids.length <= 4 ? it(`Compare ${ids.length}`, () => compareView(ids)) : null,
    ids.length === 1 && p ? it('Make virtual copy', () => virtualCopy(p)) : null,
    it('Copy settings', () => copyDlg('copy')), S.clip ? it(`Paste settings to ${ids.length}`, () => pasteSettings(ids)) : null,
    it(`Export ${ids.length}…`, () => exportDlg()), h('hr'), it(`Delete ${ids.length > 1 ? ids.length + ' photos' : 'photo'}`, () => trashPhotos(ids), 'danger')]);
  document.body.appendChild(m);
  const r = m.getBoundingClientRect(); m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  const off = (e) => { if (!m.contains(e.target)) { m.remove(); removeEventListener('pointerdown', off, true); } };
  setTimeout(() => addEventListener('pointerdown', off, true), 0);
  addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { m.remove(); removeEventListener('keydown', esc); } });
}
function selectPhoto(id, e, list) {
  list = list || visiblePhotos();
  if (e && (e.metaKey || e.ctrlKey)) { S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); S.cur = id; }
  else if (e && e.shiftKey && S.cur) {
    const a = list.findIndex(p => p.id === S.cur), b = list.findIndex(p => p.id === id);
    if (a >= 0 && b >= 0) { const [i, j] = a < b ? [a, b] : [b, a]; for (let k = i; k <= j; k++) S.sel.add(list[k].id); }
  } else { S.sel = new Set([id]); S.cur = id; }
  if (!S.sel.size) S.sel.add(id);
  if (S.view === 'library') { renderGrid(); renderLibRight(); renderStrip(); }
  else openCurrent();
}

/* ============================== library: right ============================== */
function renderLibRight() {
  const R = $('#right'); R.innerHTML = ''; setTimeout(applyMobile, 0);
  const p = ph() && !ph().deleted ? ph() : null;
  const ids = selIds();
  const qd = (label, fn) => h('button', { class: 'btn sm', onclick: () => quickDevelop(selIds(), fn) }, label);
  R.append(section('quick', 'Quick adjust', h('div', { class: 'body', style: { padding: 0 } },
    h('div', { class: 'empty', style: { paddingTop: 0 }, text: ids.length ? `Applies to ${ids.length} selected photo${ids.length === 1 ? '' : 's'}.` : 'Select photos to adjust them together.' }),
    h('div', { class: 'row' }, qd('Auto tone', 'auto'), qd('Auto white balance', 'awb'), qd('Black & white', e => e.bw = !e.bw)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Exposure' }), qd('−1', e => e.exposure -= 1), qd('−⅓', e => e.exposure -= 1 / 3), qd('+⅓', e => e.exposure += 1 / 3), qd('+1', e => e.exposure += 1)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Contrast' }), qd('−20', e => e.contrast -= 20), qd('+20', e => e.contrast += 20)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Vibrance' }), qd('−20', e => e.vibrance -= 20), qd('+20', e => e.vibrance += 20)),
    h('div', { class: 'row' }, qd('Paste settings', 'paste'), qd('Reset all', 'reset')))));
  if (!p) { R.append(h('div', { class: 'body' }, h('div', { class: 'empty', text: 'Select a photo to see its details.' }))); return; }
  const ex = p.exif || {};
  const kv = (k, v) => v ? [h('dt', { text: k }), h('dd', { text: String(v), title: String(v) })] : [];
  R.append(section('meta', 'Metadata', h('div', { class: 'body', style: { padding: 0, gap: '10px' } },
    h('div', { class: 'row' }, stars(p, r => setMeta(ids, x => x.rating = r)),
      h('span', { class: 'sp', style: { flex: 1 } }),
      h('div', { class: 'seg' }, [[1, 'Pick'], [0, '—'], [-1, 'Reject']].map(([v, t]) => h('button', { class: p.flag === v ? 'on' : '', onclick: () => setMeta(ids, x => x.flag = v) }, t)))),
    h('div', { class: 'row' }, [null, ...Object.keys(LABELS)].map(k => h('button', { class: 'iconbtn' + (p.label === k ? ' on' : ''), title: k || 'No label', 'aria-label': 'Label ' + (k || 'none'), onclick: () => setMeta(ids, x => x.label = k) },
      h('span', { class: 'lbl', style: { background: k ? LABELS[k] : 'transparent', border: k ? 0 : '1px solid var(--faint)', outline: p.label === k ? '2px solid var(--fg)' : 'none', outlineOffset: '2px' } })))),
    h('label', { class: 'field' }, h('span', { text: 'Title' }), h('input', { type: 'text', id: 'mdTitle', value: p.title, onchange: (e) => setMeta([p.id], x => x.title = e.target.value) })),
    h('label', { class: 'field' }, h('span', { text: 'Caption' }), h('textarea', { id: 'mdCaption', rows: 2, onchange: (e) => setMeta([p.id], x => x.caption = e.target.value) }, p.caption)),
    h('label', { class: 'field' }, h('span', { text: 'Keywords (comma separated)' }), h('input', { type: 'text', id: 'mdKw', value: p.keywords.join(', '), onchange: (e) => { const ks = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setMeta(ids.length > 1 ? ids : [p.id], x => x.keywords = ids.length > 1 ? [...new Set([...x.keywords, ...ks])] : ks); } })),
    h('dl', { class: 'kv' }, kv('File', p.name), kv('Size', `${p.w} × ${p.h}${p.size ? ' · ' + (p.size / 1048576).toFixed(1) + ' MB' : ''}`), kv('RAW', p.raw ? (p.rawMode === 'full' ? 'Full RAW decode' : 'Embedded preview') : ''),
      kv('Captured', new Date(p.captureAt).toLocaleString()), kv('Camera', [ex.make, ex.model].filter(Boolean).join(' ')), kv('Lens', ex.lens),
      kv('Exposure', [ex.exposure ? U.fmtShutter(ex.exposure) : '', ex.fnumber ? 'f/' + (+ex.fnumber).toFixed(1) : '', ex.iso ? 'ISO ' + ex.iso : '', ex.focal ? Math.round(ex.focal) + ' mm' : ''].filter(Boolean).join(' · ')),
      kv('Sample', p.sample ? 'Generated example photo' : '')))));
  const inCols = S.collections.filter(c => !c.smart);
  R.append(section('pcols', 'In albums', h('div', { class: 'body', style: { padding: 0 } },
    inCols.length ? inCols.map(c => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: c.photos.includes(p.id), onchange: (e) => { ids.forEach(id => { const i = c.photos.indexOf(id); if (e.target.checked && i < 0) c.photos.push(id); if (!e.target.checked && i >= 0) c.photos.splice(i, 1); }); U.DB.put('collections', c); renderLibLeft(); } }), c.name)) : h('div', { class: 'empty', text: 'No albums yet.' }),
    h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn sm', onclick: () => albumPicker(selIds()) }, 'Add to album…')))));
  R.append(section('pact', 'Photo', h('div', { class: 'row' },
    h('button', { class: 'btn sm', onclick: () => virtualCopy(p) }, 'Make virtual copy'),
    h('button', { class: 'btn sm', onclick: () => setView('edit') }, 'Edit'),
    h('button', { class: 'btn sm danger', onclick: () => trashPhotos(selIds()) }, ids.length > 1 ? `Delete ${ids.length}` : 'Delete'))));
}
async function quickDevelop(ids, fn) {
  if (!ids.length) return;
  if (fn === 'paste') { pasteSettings(ids); return; }
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    const e = p.edits;
    if (fn === 'reset') Object.assign(e, defaults());
    else if (fn === 'auto' || fn === 'awb') {
      const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) continue;
      const hd = engine.loadImage(src);
      Object.assign(e, fn === 'auto' ? autoTone(hd, e) : autoWB(hd, e));
      engine.freeImage(hd);
    } else { fn(e); e.exposure = U.clamp(e.exposure, -5, 5); e.contrast = U.clamp(e.contrast, -100, 100); e.vibrance = U.clamp(e.vibrance, -100, 100); }
    pushHistoryFor(p, fn === 'auto' ? 'Auto tone' : fn === 'awb' ? 'Auto white balance' : fn === 'reset' ? 'Reset' : 'Quick adjust');
    await refreshThumb(p);
  }
  renderAll();
}
function virtualCopy(p) {
  const c = U.clone(p); c.id = U.uid(); c.virtual = true; c.name = p.name.replace(/(\.[^.]+)?$/, ' (copy)$1'); c.importedAt = Date.now();
  S.photos.push(c); U.DB.put('photos', c); S.cur = c.id; S.sel = new Set([c.id]); toast('Virtual copy made. It shares the original file but keeps its own edits.'); renderAll();
}
function trashPhotos(ids) {
  ids = ids.filter(id => S.photos.some(p => p.id === id && !p.deleted)); if (!ids.length) return;
  const now = Date.now(), wasEdit = S.view === 'edit';
  const listBefore = visiblePhotos(), idx = listBefore.findIndex(p => p.id === S.cur);
  ids.forEach(id => { const p = S.photos.find(x => x.id === id); p.deleted = now; savePhoto(p, true); });
  S.sel = new Set();
  const rest = visiblePhotos();
  const next = rest[Math.min(Math.max(idx, 0), rest.length - 1)];
  S.cur = next ? next.id : null; if (S.cur && (!isMobile() || !S.selectMode)) S.sel.add(S.cur);
  if (wasEdit && !S.cur) S.view = 'library';
  if (isMobile() && S.selectMode) { S.selectMode = false; document.body.classList.remove('selmode'); }
  renderAll();
  toast(`Moved ${ids.length} photo${ids.length === 1 ? '' : 's'} to Recently deleted.`, 6000, { label: 'Undo', fn: () => restorePhotos(ids, true) });
}
function restorePhotos(ids, quiet) {
  ids.forEach(id => { const p = S.photos.find(x => x.id === id); if (p) { delete p.deleted; savePhoto(p, true); } });
  S.sel = new Set(ids); S.cur = ids[0] || S.cur; renderAll();
  if (!quiet) toast(`Restored ${ids.length} photo${ids.length === 1 ? '' : 's'}.`);
}
function purgeDlg(ids) {
  confirmDlg(`Delete ${ids.length} photo${ids.length === 1 ? '' : 's'} for good? This removes ${ids.length === 1 ? 'it' : 'them'} and all edits from Safelight and cannot be undone. Original files on your device are not touched.`, 'Delete forever', () => purgePhotos(ids));
}
async function purgePhotos(ids) {
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    S.photos = S.photos.filter(x => x.id !== id); await U.DB.del('photos', id);
    S.collections.forEach(c => { const i = c.photos.indexOf(id); if (i >= 0) c.photos.splice(i, 1); });
    if (!S.photos.some(x => x.imageId === p.imageId)) { await U.DB.del('images', p.imageId); imgCache.delete(p.imageId); }
  }
  saveColls(); S.sel.clear(); const lp = live(); S.cur = lp[0] ? lp[0].id : null;
  renderAll();
}
const removePhotos = trashPhotos;
/* ============================== filmstrip ============================== */
function renderStrip() {
  const list = visiblePhotos();
  const bar = $('#stripbar'); bar.innerHTML = '';
  const srcName = { all: 'All photos', import: 'Previous import', picks: 'Picks', edited: 'Edited', trash: 'Recently deleted' }[S.source.kind] || (S.collections.find(c => c.id === S.source.id) || {}).name || S.source.id;
  bar.append(h('span', { text: `${srcName} · ${list.length} photo${list.length === 1 ? '' : 's'} · ${S.sel.size} selected` }), h('span', { class: 'sp' }));
  if (S.view === 'edit') {
    bar.append(h('button', { class: 'btn sm ghost', onclick: () => copyDlg('copy'), title: 'Copy settings (Ctrl+C)' }, 'Copy'),
      h('button', { class: 'btn sm ghost', disabled: !S.clip, onclick: () => pasteSettings([...S.sel]), title: 'Paste settings (Ctrl+V)' }, 'Paste'),
      h('button', { class: 'btn sm ghost', disabled: S.sel.size < 2, onclick: () => copyDlg('sync'), title: 'Apply this photo’s settings to the other selected photos' }, `Sync to ${Math.max(0, S.sel.size - 1)}`));
  }
  const film = $('#film'); film.innerHTML = '';
  for (const p of list) {
    film.append(h('button', { class: 'fc' + (S.sel.has(p.id) ? ' sel' : '') + (S.cur === p.id ? ' cur' : ''), title: p.title || p.name, 'aria-label': p.title || p.name, onclick: (e) => selectPhoto(p.id, e, list), ondblclick: () => { if (S.view !== 'edit') setView('edit'); } },
      h('img', { src: p.thumb, alt: '', draggable: 'false' }), p.rating ? h('span', { class: 'st', text: '★'.repeat(p.rating) }) : null));
  }
  const cur = film.querySelector('.cur'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ============================== drag & drop ============================== */
function setupDrop(el) {
  let dz = null;
  el.addEventListener('dragover', (e) => { if (![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); if (!dz) { dz = h('div', { class: 'drop', text: 'Drop to import' }); el.appendChild(dz); } });
  el.addEventListener('dragleave', (e) => { if (e.target === el || !el.contains(e.relatedTarget)) { dz && dz.remove(); dz = null; } });
  el.addEventListener('drop', (e) => { e.preventDefault(); dz && dz.remove(); dz = null; if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); });
}

/* ============================== dialogs ============================== */
function dialog(title, body, okLabel, onOk, opts = {}) {
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 170); document.removeEventListener('keydown', esc, true); };
  const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const ok = h('button', { class: 'btn pri', onclick: async () => { const r = await onOk(); if (r !== false) close(); } }, okLabel);
  const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) close(); } },
    h('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('header', { text: title }), h('div', { class: 'db' }, body),
      h('footer', {}, h('button', { class: 'btn', onclick: close }, opts.cancel || 'Cancel'), okLabel ? ok : null)));
  document.body.appendChild(m); document.addEventListener('keydown', esc, true);
  return { close, ok };
}
function confirmDlg(text, okLabel, fn) { dialog('Please confirm', [h('p', { style: { margin: 0, lineHeight: 1.5 }, text })], okLabel, fn); }

/* ============================== edit: loading ============================== */
let loadToken = 0;
async function openCurrent() {
  const p = ph(); if (!p) return;
  if (imgFor === p.id && img) { renderEditLeft(); renderEditRight(); renderStrip(); updateStagebar(); requestRender(); return; }
  if (imgFor && imgFor !== p.id) finishEditing(imgFor);
  const tok = ++loadToken;
  const busy = $('.stagewrap') ? showBusy(p.raw ? 'Decoding RAW file…' : 'Loading…') : null;
  const rec = await U.DB.get('images', p.imageId);
  const src = rec && await decodeSource(rec);
  busy && busy.remove();
  if (tok !== loadToken) return;
  if (!src) { toast('This photo’s file could not be read.'); return; }
  if (img) engine.freeImage(img);
  img = engine.loadImage(src); imgFor = p.id;
  if (p.raw && src.half && p.rawMode !== 'full') { p.rawMode = 'full'; savePhoto(p); }
  brushState = null; S.zoom = 0; S.center = [0.5, 0.5]; S.selMask = -1; S.selSpot = -1;
  renderEditLeft(); renderEditRight(); renderStrip(); updateStagebar(); layoutStage(); requestRender(); fadeInStage();
}
function finishEditing(id) {
  const p = S.photos.find(x => x.id === (id || S.cur)); if (p) { savePhoto(p, true); refreshThumb(p); }
}
async function refreshThumb(p) {
  try {
    let hd = null, own = false;
    if (imgFor === p.id && img) hd = img;
    else { const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) return; hd = engine.loadImage(src); own = true; }
    const id = engine.renderSmall(hd, p.edits, 360, buildBrush(p.edits, hd, own ? 'x' : p.id));
    if (own) engine.freeImage(hd);
    const c = document.createElement('canvas'); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
    p.thumb = c.toDataURL('image/jpeg', 0.82); savePhoto(p);
    document.querySelectorAll('img').forEach(im => { if (im.dataset.pid === p.id) im.src = p.thumb; });
    if (S.view === 'library') renderGrid();
    renderStrip(); if (S.view === 'edit') drawNavigator();
    if (own) requestRender();
  } catch (e) { console.error(e); }
}
let thumbTimer = 0;
function scheduleThumb() { clearTimeout(thumbTimer); thumbTimer = setTimeout(() => { const p = ph(); if (p) refreshThumb(p); }, 1800); }

/* ============================== brush masks ============================== */
const brushCanv = new Map(); // key photoId:maskId -> {canvas, n}
function brushSize(handle) { const L = 1024; return handle.w >= handle.h ? [L, Math.max(1, Math.round(L * handle.h / handle.w))] : [Math.max(1, Math.round(L * handle.w / handle.h)), L]; }
function drawDabs(ctx, st, from, bw, bh) {
  const r = Math.max(0.5, st.r * bh), pts = st.pts;
  ctx.fillStyle = st.e ? '#000' : '#fff';
  for (let i = from; i < pts.length; i += 2) {
    const x = pts[i] * bw, y = pts[i + 1] * bh;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = st.e ? '0,0,0' : '255,255,255';
    g.addColorStop(0, `rgba(${c},${st.a})`); g.addColorStop(Math.max(0, Math.min(0.99, 1 - st.f)), `rgba(${c},${st.a})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}
function maskCanvas(pid, m, bw, bh) {
  const key = pid + ':' + m.id; let e = brushCanv.get(key);
  const sig = m.strokes.length + ':' + m.strokes.reduce((a, s) => a + s.pts.length, 0);
  if (e && e.canvas.width === bw && e.canvas.height === bh && e.sig === sig) return e;
  const c = e && e.canvas.width === bw && e.canvas.height === bh ? e.canvas : document.createElement('canvas'); c.width = bw; c.height = bh;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, bw, bh);
  m.strokes.forEach(st => drawDabs(ctx, st, 0, bw, bh));
  e = { canvas: c, ctx, sig }; brushCanv.set(key, e); return e;
}
let brushVersion = 1;
function buildBrush(edits, handle, pid) {
  const [bw, bh] = brushSize(handle);
  const data = [new Uint8Array(bw * bh * 4), new Uint8Array(bw * bh * 4)];
  let any = false;
  edits.masks.slice(0, 8).forEach((m, i) => {
    if (m.type !== 'brush') return; any = true;
    const e = maskCanvas(pid, m, bw, bh); const px = e.ctx.getImageData(0, 0, bw, bh).data;
    const d = data[i >> 2], ch = i & 3; for (let k = 0, n = bw * bh; k < n; k++) d[k * 4 + ch] = px[k * 4];
  });
  return { w: bw, h: bh, data, version: brushVersion++, any };
}
function currentBrush() { if (!brushState) brushState = buildBrush(P(), img, ph().id); return brushState; }
function invalidateBrush() { brushState = null; }

/* ============================== history ============================== */
function pushHistoryFor(p, label) {
  p.history = p.history.slice(0, p.hIndex + 1);
  p.history.push({ label, edits: U.clone(p.edits) });
  if (p.history.length > 80) p.history.splice(1, p.history.length - 80);
  p.hIndex = p.history.length - 1; savePhoto(p);
}
function commit(label) {
  const p = ph(); if (!p) return;
  pushHistoryFor(p, label); renderHistory(); markMods(); scheduleThumb();
}
function gotoHistory(i) {
  const p = ph(); if (!p || i < 0 || i >= p.history.length) return;
  p.hIndex = i; p.edits = U.clone(p.history[i].edits); savePhoto(p); invalidateBrush();
  renderEditRight(); renderHistory(); requestRender(); scheduleThumb();
}
const undo = () => { const p = ph(); if (p) gotoHistory(p.hIndex - 1); };
const redo = () => { const p = ph(); if (p) gotoHistory(p.hIndex + 1); };

/* ============================== sliders ============================== */
function fmtVal(v, step) { if (step < 0.1) return (v > 0 ? '+' : '') + v.toFixed(2); if (step < 1) return v.toFixed(1); return (v > 0 && step >= 1 ? '+' : '') + Math.round(v); }
/* Touch-safe slider: vertical swipes scroll the panel; only a deliberate sideways drag changes the value,
   and it moves relative to where it was (a tap never makes it jump). Mouse can click-to-set and drag. */
const ease = (t) => 1 - Math.pow(1 - t, 3);
let lastPanelScroll = 0;
// keep iOS from zooming the whole page when pinching over the panels (the photo has its own pinch zoom)
['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));
addEventListener('scroll', () => { lastPanelScroll = performance.now(); }, { capture: true, passive: true });
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
function slider(id, label, min, max, step, get, set, opts = {}) {
  const def = opts.def !== undefined ? opts.def : 0;
  const show = opts.fmt || ((v) => fmtVal(v, step));
  const dec = (String(step).split('.')[1] || '').length;
  const q = (v) => +(Math.round((U.clamp(v, min, max) - min) / step) * step + min).toFixed(dec);
  const frac = (v) => (U.clamp(v, min, max) - min) / (max - min);
  const thumb = h('span', { class: 'th' }), fill = h('span', { class: 'fill' }), zero = h('span', { class: 'z' });
  const track = h('div', { class: 'trk', id, role: 'slider', tabindex: 0, 'aria-label': label, 'aria-valuemin': min, 'aria-valuemax': max }, h('span', { class: 'rail' }), zero, fill, thumb);
  if (opts.track) track.style.setProperty('--trk', opts.track);
  const out = h('button', { class: 'out', type: 'button', title: 'Type a value', 'aria-label': label + ' value' });
  const lab = h('label', { text: label, title: 'Double-click to reset', ondblclick: () => animateTo(def, true) });
  const row = h('div', { class: 'sl' }, lab, track, out);
  let cur = get(), st = null, lastTap = 0, anim = 0;
  function paint(v) {
    const f = frac(v), z = frac(def);
    thumb.style.left = f * 100 + '%'; fill.style.left = Math.min(f, z) * 100 + '%'; fill.style.width = Math.abs(f - z) * 100 + '%'; zero.style.left = z * 100 + '%';
    out.textContent = show(v); row.classList.toggle('mod', Math.abs(v - def) > 1e-9);
    track.setAttribute('aria-valuenow', v); track.setAttribute('aria-valuetext', show(v));
  }
  function setVal(v) { v = q(v); if (v === cur) return; cur = v; set(v); paint(v); }
  function begin() { row.classList.add('drag'); S.interacting = true; }
  function end(changed) { row.classList.remove('drag'); S.interacting = false; requestRender(); if (changed && opts.onCommit) opts.onCommit(label); }
  function animateTo(target, commitAfter) {
    cancelAnimationFrame(anim); const from = cur, t0 = performance.now(), D = 220;
    if (Math.abs(from - target) < 1e-9) return;
    row.classList.add('drag');
    const stepf = (now) => { const t = Math.min(1, (now - t0) / D); const v = from + (target - from) * ease(t);
      if (t < 1) { cur = v; set(v); paint(v); anim = requestAnimationFrame(stepf); } else { cur = NaN; setVal(target); row.classList.remove('drag'); if (commitAfter && opts.onCommit) opts.onCommit(label); } };
    anim = requestAnimationFrame(stepf);
  }
  track.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return; cancelAnimationFrame(anim);
    const r = track.getBoundingClientRect();
    const panel = track.closest('.left, .right, .dlg');
    st = { id: e.pointerId, x: e.clientX, y: e.clientY, v0: cur, start: cur, w: r.width, active: false, t: performance.now(), panel, sc0: panel ? panel.scrollTop : 0, touch: e.pointerType !== 'mouse' };
    if (e.pointerType === 'mouse') {
      st.active = true; track.setPointerCapture(e.pointerId); begin();
      const tx = r.left + frac(cur) * r.width;
      if (Math.abs(e.clientX - tx) > 9) { setVal(min + (e.clientX - r.left) / r.width * (max - min)); st.v0 = cur; st.x = e.clientX; }
    }
  });
  track.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    const scrolled = st.panel && Math.abs(st.panel.scrollTop - st.sc0) > 1;
    if (!st.active) {
      // decide once, from the first 10 px of movement: clearly sideways = adjust; anything else = this gesture belongs to scrolling
      if (Math.hypot(dx, dy) < 10) return;
      if (!scrolled && Math.abs(dx) > Math.abs(dy) * 2.2 && performance.now() - lastPanelScroll > 250) { st.active = true; st.x = e.clientX; st.v0 = cur; try { track.setPointerCapture(st.id); } catch (er) {} begin(); }
      else st = null;
      return;
    }
    if (st.touch && scrolled) { setVal(st.start); requestRender(); st = null; end(false); return; }
    let v = st.v0 + dx / st.w * (max - min);
    const snap = (max - min) * 0.012;
    if (def >= min && def <= max && Math.abs(v - def) < snap) { if (!st.snapped) { buzz(6); st.snapped = true; } v = def; } else st.snapped = false;
    setVal(v);
  });
  const up = (e) => {
    if (!st || e.pointerId !== st.id) return; const s0 = st; st = null;
    if (s0.active) { end(cur !== s0.start); return; }
    if (e.type === 'pointerup' && e.pointerType !== 'mouse' && performance.now() - s0.t < 300 && performance.now() - lastPanelScroll > 400 && !(s0.panel && Math.abs(s0.panel.scrollTop - s0.sc0) > 1)) {
      const now = performance.now(); if (now - lastTap < 320) { lastTap = 0; animateTo(def, true); } else lastTap = now;
    }
  };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  track.addEventListener('touchmove', (e) => { if (st && st.active) e.preventDefault(); }, { passive: false });
  track.addEventListener('dblclick', () => animateTo(def, true));
  track.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 10 : 1; let v = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = cur + step * big; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = cur - step * big;
    else if (e.key === 'Home') v = min; else if (e.key === 'End') v = max; else if (e.key === 'PageUp') v = cur + (max - min) / 10; else if (e.key === 'PageDown') v = cur - (max - min) / 10; else return;
    e.preventDefault(); e.stopPropagation(); setVal(v); clearTimeout(track._t); track._t = setTimeout(() => opts.onCommit && opts.onCommit(label), 400);
  });
  out.addEventListener('click', () => {
    const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'num', value: String(cur), 'aria-label': label });
    out.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const fin = (ok) => { if (done) return; done = true; const v = parseFloat(inp.value.replace(',', '.')); inp.replaceWith(out); if (ok && !isNaN(v)) { const b0 = cur; setVal(v); requestRender(); if (cur !== b0 && opts.onCommit) opts.onCommit(label); } };
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); });
    inp.addEventListener('blur', () => fin(true));
  });
  function sync() { cur = get(); paint(cur); }
  sync(); row.sync = sync; return row;
}
/* For canvases that are dragged (curve, wheels): stop the page from scrolling only when the touch starts on a handle. */
function guardTouch(el, onHandle) {
  el.style.touchAction = 'pan-y';
  el.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (e.touches.length === 1 && onHandle(t.clientX, t.clientY)) e.preventDefault(); }, { passive: false });
}
function pSlider(key, label, min, max, step, opts = {}) {
  return slider('s-' + key, label, min, max, step, () => P()[key], (v) => { P()[key] = v; requestRender(); }, Object.assign({ def: DEF[key], onCommit: commit }, opts));
}
function arrSlider(key, i, label, min, max, opts = {}) {
  return slider(`s-${key}-${i}`, label, min, max, 1, () => P()[key][i], (v) => { P()[key][i] = v; requestRender(); }, Object.assign({ def: 0, onCommit: (l) => commit(`${l} ${key === 'hslH' ? 'hue' : key === 'hslS' ? 'saturation' : key === 'hslL' ? 'luminance' : 'B&W mix'}`) }, opts));
}
function markMods() {
  const p = P(); if (!p) return;
  const groupsFor = { basic: ['treatment', 'wb', 'tone', 'presence'], curve: ['curve'], mixer: ['mixer'], grading: ['grading'], detail: ['detail'], lens: ['lens'], transform: ['transform'], effects: ['effects', 'lut'], calibration: ['calibration'] };
  for (const [sec, gs] of Object.entries(groupsFor)) {
    const el = document.getElementById('sec-' + sec); if (!el) continue;
    el.classList.toggle('mod', gs.some(g => GROUPS[g][1].some(k => !isDefault(k, p[k]))));
  }
}
function resetGroup(gs, label) {
  const t = U.clone(P()); gs.forEach(g => GROUPS[g][1].forEach(k => t[k] = U.clone(DEF[k])));
  animateEdits(t, 'Reset ' + label);
}
function resetAct(gs, label) { return h('button', { class: 'act btn sm ghost', title: 'Reset ' + label, onclick: (e) => { e.stopPropagation(); resetGroup(gs, label); } }, 'Reset'); }

/* ============================== edit: right panel ============================== */
const ICONS = {
  crop: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 1v14h14M1 5h14v14"/></svg>',
  heal: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="13" r="4"/><circle cx="14" cy="6" r="4" stroke-dasharray="2 2"/></svg>',
  mask: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/></svg>',
  wb: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 3l4 4-9 9H4v-4z"/><path d="M11 5l4 4"/></svg>',
  clip: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 17h16M4 17l4-9 3 5 2-3 3 7"/></svg>'
};
function renderEditRight() {
  const R = $('#right'); const st = R.scrollTop; R.innerHTML = '';
  if (!ph()) return;
  const histo = h('div', { class: 'histo', 'data-tab': 'light' }, h('div', { class: 'clipb' }, h('canvas', { id: 'histo', width: 576, height: 184 }),
    h('button', { class: 'clipdot l' + (S.showClip ? ' on' : ''), title: 'Show clipping (J)', 'aria-label': 'Show shadow clipping', onclick: toggleClip }),
    h('button', { class: 'clipdot r' + (S.showClip ? ' on' : ''), title: 'Show clipping (J)', 'aria-label': 'Show highlight clipping', onclick: toggleClip })),
    h('div', { class: 'meta', id: 'histoMeta' }));
  R.append(histo);
  const tb = (id, label, key) => h('button', { class: S.tool === id ? 'on' : '', title: `${label} (${key})`, onclick: () => setTool(S.tool === id ? null : id), html: ICONS[id] + `<span>${label}</span>` });
  R.append(h('div', { class: 'tools', 'data-tab': 'tools' }, tb('crop', 'Crop', 'R'), tb('heal', 'Heal', 'Q'), tb('mask', 'Masks', 'M'), tb('wb', 'WB pick', 'W'),
    h('button', { class: S.showClip ? 'on' : '', title: 'Clipping (J)', onclick: toggleClip, html: ICONS.clip + '<span>Clipping</span>' })));
  if (S.tool === 'crop') R.append(cropPanel());
  if (S.tool === 'heal') R.append(healPanel());
  if (S.tool === 'mask') R.append(maskPanel());
  R.append(basicPanel(), curvePanel(), mixerPanel(), gradingPanel(), detailPanel(), lensPanel(), transformPanel(), effectsPanel(), calibrationPanel());
  markMods(); drawHistogram(); R.scrollTop = st; applyMobile();
}
function toggleClip() { S.showClip = !S.showClip; document.querySelectorAll('.clipdot').forEach(d => d.classList.toggle('on', S.showClip)); const t = [...document.querySelectorAll('.tools button')].pop(); t && t.classList.toggle('on', S.showClip); requestRender(); }

function basicPanel() {
  const p = P();
  const tr = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Treatment' }),
    h('div', { class: 'seg' }, h('button', { class: !p.bw ? 'on' : '', onclick: () => { P().bw = false; commit('Color'); renderEditRight(); requestRender(); } }, 'Color'), h('button', { class: p.bw ? 'on' : '', onclick: () => { P().bw = true; commit('Black & white'); renderEditRight(); requestRender(); } }, 'B&W')));
  const wbRow = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'White balance' }),
    h('button', { class: 'btn sm' + (S.tool === 'wb' ? ' on' : ''), onclick: () => setTool(S.tool === 'wb' ? null : 'wb') }, 'Pick neutral'),
    h('button', { class: 'btn sm', onclick: () => animateEdits(Object.assign(U.clone(P()), autoWB(img, P())), 'Auto white balance') }, 'Auto'));
  const toneRow = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Tone' }),
    h('button', { class: 'btn sm', onclick: () => animateEdits(Object.assign(U.clone(P()), autoTone(img, P())), 'Auto tone') }, 'Auto'));
  return section('basic', 'Basic', [tr, wbRow,
    pSlider('temp', 'Temperature', -100, 100, 1, { track: 'linear-gradient(90deg,#4f7fd8,#ccc 50%,#e2b23c)' }),
    pSlider('tint', 'Tint', -100, 100, 1, { track: 'linear-gradient(90deg,#4fb548,#ccc 50%,#c64bb4)' }),
    toneRow,
    pSlider('exposure', 'Exposure', -5, 5, 0.01), pSlider('contrast', 'Contrast', -100, 100, 1),
    pSlider('highlights', 'Highlights', -100, 100, 1), pSlider('shadows', 'Shadows', -100, 100, 1),
    pSlider('whites', 'Whites', -100, 100, 1), pSlider('blacks', 'Blacks', -100, 100, 1),
    h('div', { class: 'sub', text: 'Presence' }),
    pSlider('texture', 'Texture', -100, 100, 1), pSlider('clarity', 'Clarity', -100, 100, 1), pSlider('dehaze', 'Dehaze', -100, 100, 1),
    pSlider('vibrance', 'Vibrance', -100, 100, 1), pSlider('saturation', 'Saturation', -100, 100, 1)], { action: resetAct(['treatment', 'wb', 'tone', 'presence'], 'basic') });
}

/* ---- tone curve editor ---- */
function curvePanel() {
  const cv = h('canvas', { id: 'curveCv', width: 520, height: 520, 'aria-label': 'Tone curve. Click to add a point, drag to move, double-click a point to remove it.' });
  const chs = h('div', { class: 'seg' }, [['rgb', 'RGB'], ['r', 'Red'], ['g', 'Green'], ['b', 'Blue']].map(([k, t]) => h('button', { class: S.curveCh === k ? 'on' : '', onclick: () => { S.curveCh = k; renderEditRight(); } }, t)));
  const mode = h('div', { class: 'seg' }, [['point', 'Point'], ['param', 'Region']].map(([k, t]) => h('button', { class: S.curveMode === k ? 'on' : '', onclick: () => { S.curveMode = k; renderEditRight(); } }, t)));
  const body = [h('div', { class: 'row' }, mode, S.curveMode === 'point' ? chs : null), h('div', { class: 'curvebox' }, cv)];
  if (S.curveMode === 'param') body.push(pSlider('pcHigh', 'Highlights', -100, 100, 1), pSlider('pcLight', 'Lights', -100, 100, 1), pSlider('pcDark', 'Darks', -100, 100, 1), pSlider('pcShadow', 'Shadows', -100, 100, 1),
    h('div', { class: 'sub', text: 'Region splits' }), pSlider('pcS1', 'Shadows / darks', 5, 45, 1, { fmt: v => v }), pSlider('pcS2', 'Darks / lights', 30, 70, 1, { fmt: v => v }), pSlider('pcS3', 'Lights / highs', 55, 95, 1, { fmt: v => v }));
  else body.push(h('div', { class: 'empty', style: { padding: 0 }, text: 'Click to add a point. Drag to shape. Double-click a point to remove it.' }));
  const sec = section('curve', 'Tone curve', body, { action: resetAct(['curve'], 'tone curve') });
  setTimeout(() => setupCurve(cv), 0);
  return sec;
}
let curveHist = null;
function drawCurve(cv) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, p = P(); g.clearRect(0, 0, W, H);
  if (curveHist) { g.fillStyle = 'rgba(255,255,255,0.06)'; const mx = Math.max(...curveHist.l.slice(2, 254)) || 1; g.beginPath(); g.moveTo(0, H); for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, H - Math.min(1, curveHist.l[i] / mx) * H * 0.9); g.lineTo(W, H); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
  g.beginPath(); g.moveTo(0, H); g.lineTo(W, 0); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
  const col = { rgb: '#e4e4e4', r: '#ff5a5a', g: '#6bd36b', b: '#5b8cff' };
  if (S.curveMode === 'param') {
    const lut = Engine.buildLutPublic ? null : null;
    const pts = buildParamPreview(p);
    g.strokeStyle = col.rgb; g.lineWidth = 3; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * W, H - y * H) : g.moveTo(x * W, H - y * H)); g.stroke();
    g.fillStyle = 'rgba(228,165,76,0.6)'; [p.pcS1, p.pcS2, p.pcS3].forEach(s => g.fillRect(s / 100 * W - 1, H - 10, 2, 10));
    return;
  }
  const chans = S.curveCh === 'rgb' ? ['rgb'] : ['rgb', S.curveCh];
  for (const ch of chans) {
    const f = U.monotone(p.curve[ch]); const active = ch === S.curveCh;
    g.strokeStyle = active ? col[ch] : 'rgba(255,255,255,0.25)'; g.lineWidth = active ? 3 : 1.5; g.beginPath();
    for (let i = 0; i <= 128; i++) { const x = i / 128, y = U.clamp(f(x), 0, 1); i ? g.lineTo(x * W, H - y * H) : g.moveTo(x * W, H - y * H); } g.stroke();
    if (active) p.curve[ch].forEach(([x, y]) => { g.fillStyle = '#121315'; g.strokeStyle = col[ch]; g.lineWidth = 3; g.beginPath(); g.arc(x * W, H - y * H, 9, 0, Math.PI * 2); g.fill(); g.stroke(); });
  }
}
function buildParamPreview(p) {
  const s1 = p.pcS1 / 100, s2 = p.pcS2 / 100, s3 = p.pcS3 / 100;
  const bump = (x, a, b) => { if (x <= a || x >= b) return 0; const t = (x - a) / (b - a); const s = Math.sin(Math.PI * t); return s * s; };
  const pts = []; for (let i = 0; i <= 128; i++) { const x = i / 128; pts.push([x, U.clamp(x + 0.22 * (p.pcShadow / 100 * bump(x, 0, s2) + p.pcDark / 100 * bump(x, s1 * 0.4, s3) + p.pcLight / 100 * bump(x, s1, 1 - (1 - s3) * 0.4) + p.pcHigh / 100 * bump(x, s2, 1)), 0, 1)]); }
  return pts;
}
function setupCurve(cv) {
  drawCurve(cv);
  if (S.curveMode !== 'point') return;
  let drag = -1, st = null;
  const pos = (cx, cy) => { const r = cv.getBoundingClientRect(); return [U.clamp((cx - r.left) / r.width, 0, 1), U.clamp(1 - (cy - r.top) / r.height, 0, 1)]; };
  const hit = (x, y, tol) => P().curve[S.curveCh].findIndex(([px, py]) => Math.hypot(px - x, py - y) < tol);
  const touchTol = () => 26 / cv.getBoundingClientRect().width;
  guardTouch(cv, (cx, cy) => { const [x, y] = pos(cx, cy); return hit(x, y, touchTol()) >= 0; });
  const addAt = (x, y) => { const pts = P().curve[S.curveCh]; pts.push([x, y]); pts.sort((a, b) => a[0] - b[0]); return pts.findIndex(q => q[0] === x && q[1] === y); };
  cv.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e.clientX, e.clientY); let i = hit(x, y, e.pointerType === 'mouse' ? 0.045 : touchTol());
    if (e.pointerType !== 'mouse' && i < 0) { st = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
    if (i < 0) i = addAt(x, y);
    drag = i; cv.setPointerCapture(e.pointerId); S.interacting = true; drawCurve(cv); requestRender();
  });
  cv.addEventListener('pointermove', (e) => {
    if (drag < 0) return; const [x, y] = pos(e.clientX, e.clientY); const pts = P().curve[S.curveCh];
    const lo = drag > 0 ? pts[drag - 1][0] + 0.01 : 0, hi = drag < pts.length - 1 ? pts[drag + 1][0] - 0.01 : 1;
    pts[drag] = [U.clamp(x, lo, hi), y]; drawCurve(cv); requestRender();
  });
  const up = (e) => {
    if (drag >= 0) { drag = -1; S.interacting = false; requestRender(); commit('Tone curve'); return; }
    if (st && e.type === 'pointerup' && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8 && performance.now() - st.t < 350 && performance.now() - lastPanelScroll > 400) { const [x, y] = pos(e.clientX, e.clientY); addAt(x, y); drawCurve(cv); requestRender(); commit('Tone curve'); }
    st = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', (e) => { const [x, y] = pos(e.clientX, e.clientY); const pts = P().curve[S.curveCh]; const i = hit(x, y, 0.06); if (i >= 0 && pts.length > 2) { pts.splice(i, 1); drawCurve(cv); requestRender(); commit('Tone curve'); } });
}

/* ---- color mixer ---- */
function mixerPanel() {
  const p = P(); const body = [];
  if (p.bw) {
    body.push(h('div', { class: 'empty', style: { padding: 0 }, text: 'Black & white mix: set how bright each original color becomes in grey.' }));
    HUES.forEach((n, i) => body.push(arrSlider('bwMix', i, n, -100, 100, { track: `linear-gradient(90deg,#111,${HUE_COL[i]},#eee)` })));
  } else {
    body.push(h('div', { class: 'seg' }, [['all', 'All'], ['hslH', 'Hue'], ['hslS', 'Saturation'], ['hslL', 'Luminance']].map(([k, t]) => h('button', { class: S.mixProp === k ? 'on' : '', onclick: () => { S.mixProp = k; renderEditRight(); } }, t))));
    const props = S.mixProp === 'all' ? ['hslH', 'hslS', 'hslL'] : [S.mixProp];
    for (const k of props) {
      if (props.length > 1) body.push(h('div', { class: 'sub', text: { hslH: 'Hue', hslS: 'Saturation', hslL: 'Luminance' }[k] }));
      HUES.forEach((n, i) => {
        const tr = k === 'hslH' ? `linear-gradient(90deg,${HUE_COL[(i + 7) % 8]},${HUE_COL[i]},${HUE_COL[(i + 1) % 8]})` : k === 'hslS' ? `linear-gradient(90deg,#888,${HUE_COL[i]})` : `linear-gradient(90deg,#111,${HUE_COL[i]},#fff)`;
        body.push(arrSlider(k, i, n, -100, 100, { track: tr }));
      });
    }
  }
  return section('mixer', p.bw ? 'B&W mix' : 'Color mixer', body, { action: resetAct(['mixer'], 'color mixer') });
}

/* ---- color grading wheels ---- */
function wheel(key, label, big) {
  const cv = h('canvas', { width: 300, height: 300, 'aria-label': label + ' color wheel' });
  const w = h('div', { class: 'wheel' + (big ? ' big' : '') }, h('div', { class: 'wl', text: label }), cv,
    slider(`s-${key}L`, 'Luminance', -100, 100, 1, () => P()[key + 'L'], (v) => { P()[key + 'L'] = v; requestRender(); }, { def: 0, onCommit: () => commit(label + ' luminance') }));
  const draw = () => {
    const g = cv.getContext('2d'), W = 300, c = W / 2, r = c - 12; g.clearRect(0, 0, W, W);
    for (let a = 0; a < 360; a += 2) { g.beginPath(); g.moveTo(c, c); g.arc(c, c, r, (a - 1) * Math.PI / 180, (a + 2) * Math.PI / 180); const [R, G, B] = U.hsv2rgb(a / 360, 1, 1); g.fillStyle = `rgb(${R * 255},${G * 255},${B * 255})`; g.fill(); }
    const gr = g.createRadialGradient(c, c, 0, c, c, r); gr.addColorStop(0, 'rgba(60,62,66,1)'); gr.addColorStop(1, 'rgba(60,62,66,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    const hh = P()[key + 'H'], s = P()[key + 'S'] / 100; const a = -hh * Math.PI / 180;
    const x = c + Math.cos(a) * r * s, y = c + Math.sin(a) * r * s;
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '22px JetBrains Mono, monospace'; g.textAlign = 'center'; g.fillText(s > 0 ? `${Math.round(hh)}° ${Math.round(s * 100)}` : '', c, W - 2);
  };
  let dragging = false, st = null;
  const handleAt = () => { const rc = cv.getBoundingClientRect(); const s = P()[key + 'S'] / 100, a = -P()[key + 'H'] * Math.PI / 180, r = rc.width / 2 * (138 / 150); return [rc.left + rc.width / 2 + Math.cos(a) * r * s, rc.top + rc.height / 2 + Math.sin(a) * r * s]; };
  const nearHandle = (cx, cy) => { const [hx, hy] = handleAt(); return Math.hypot(cx - hx, cy - hy) < 30; };
  guardTouch(cv, nearHandle);
  const set = (e) => { const rc = cv.getBoundingClientRect(); const x = (e.clientX - rc.left) / rc.width * 300 - 150, y = (e.clientY - rc.top) / rc.height * 300 - 150; const r = Math.hypot(x, y) / 138; let a = -Math.atan2(y, x) * 180 / Math.PI; if (a < 0) a += 360; P()[key + 'H'] = Math.round(a); P()[key + 'S'] = Math.round(U.clamp(r, 0, 1) * 100 * (e.shiftKey ? 0.5 : 1)); draw(); requestRender(); };
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && !nearHandle(e.clientX, e.clientY)) { st = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
    dragging = true; S.interacting = true; cv.setPointerCapture(e.pointerId); if (e.pointerType === 'mouse') set(e);
  });
  cv.addEventListener('pointermove', (e) => dragging && set(e));
  const up = (e) => {
    if (dragging) { dragging = false; S.interacting = false; requestRender(); commit(label + ' color'); return; }
    if (st && e.type === 'pointerup' && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8 && performance.now() - st.t < 350 && performance.now() - lastPanelScroll > 400) { set(e); commit(label + ' color'); }
    st = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', () => { P()[key + 'S'] = 0; draw(); requestRender(); commit(label + ' reset'); });
  setTimeout(draw, 0);
  return w;
}
function gradingPanel() {
  return section('grading', 'Color grading', [h('div', { class: 'wheels' }, wheel('gs', 'Shadows'), wheel('gh', 'Highlights'), wheel('gm', 'Midtones'), wheel('gg', 'Global')),
    pSlider('gradeBlend', 'Blending', 0, 100, 1, { fmt: v => v }), pSlider('gradeBalance', 'Balance', -100, 100, 1)], { action: resetAct(['grading'], 'color grading') });
}
function detailPanel() {
  return section('detail', 'Detail', [h('div', { class: 'sub', style: { marginTop: 0 }, text: 'Sharpening' }),
    pSlider('sharpen', 'Amount', 0, 150, 1, { fmt: v => v }), pSlider('sharpRadius', 'Radius', 0.5, 3, 0.1), pSlider('sharpDetail', 'Detail', 0, 100, 1, { fmt: v => v }), pSlider('sharpMask', 'Masking', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Noise reduction' }),
    pSlider('nrLum', 'Luminance', 0, 100, 1, { fmt: v => v }), pSlider('nrDetail', 'Detail', 0, 100, 1, { fmt: v => v }), pSlider('nrColor', 'Color', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'empty', style: { padding: 0 }, text: 'Zoom to 100% (Z) to judge sharpening and noise.' })], { action: resetAct(['detail'], 'detail') });
}
function lensPanel() {
  return section('lens', 'Lens corrections', [pSlider('distortion', 'Distortion', -100, 100, 1),
    pSlider('lensVig', 'Vignetting', -100, 100, 1), pSlider('lensVigMid', 'Midpoint', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Chromatic aberration' }),
    pSlider('caRed', 'Red / cyan', -100, 100, 1), pSlider('caBlue', 'Blue / yellow', -100, 100, 1),
    pSlider('defPurple', 'Purple fringe', 0, 100, 1, { fmt: v => v }), pSlider('defGreen', 'Green fringe', 0, 100, 1, { fmt: v => v })], { action: resetAct(['lens'], 'lens corrections') });
}
function transformPanel() {
  return section('transform', 'Transform', [h('div', { class: 'empty', style: { padding: 0 }, text: 'Fix converging lines: Vertical for buildings shot looking up, Horizontal for walls shot at an angle.' }),
    pSlider('tVert', 'Vertical', -100, 100, 1), pSlider('tHorz', 'Horizontal', -100, 100, 1), pSlider('tRot', 'Rotate', -10, 10, 0.1),
    pSlider('tAspect', 'Aspect', -100, 100, 1), pSlider('tScale', 'Scale', 50, 150, 1, { fmt: v => v + '%' }), pSlider('tX', 'Offset X', -100, 100, 1), pSlider('tY', 'Offset Y', -100, 100, 1)], { action: resetAct(['transform'], 'transform') });
}
function effectsPanel() {
  const e = P();
  const lb = h('select', { id: 's-letterbox', onchange: (ev) => { P().letterbox = +ev.target.value; commit('Letterbox'); requestRender(); } },
    [[0, 'Off'], [1.66, '1.66 : 1'], [1.85, '1.85 : 1 (flat)'], [2, '2 : 1'], [2.2, '2.20 : 1 (70 mm)'], [2.39, '2.39 : 1 (scope)'], [2.76, '2.76 : 1 (ultra wide)'], [1, '1 : 1 (pillarbox)'], [1.33, '4 : 3 (pillarbox)']].map(([v, t]) => h('option', { value: v, text: t })));
  lb.value = String(e.letterbox || 0); if (lb.value === '' ) lb.value = '0';
  const lutRow = e.lut && S.luts.find(l => l.id === e.lut.id);
  return section('effects', 'Effects', [h('div', { class: 'sub', style: { marginTop: 0 }, text: 'Vignette (after crop)' }),
    pSlider('vig', 'Amount', -100, 100, 1), pSlider('vigMid', 'Midpoint', 0, 100, 1, { fmt: v => v }), pSlider('vigRound', 'Roundness', -100, 100, 1), pSlider('vigFeather', 'Feather', 0, 100, 1, { fmt: v => v }), pSlider('vigHigh', 'Highlights', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Grain' }),
    pSlider('grain', 'Amount', 0, 100, 1, { fmt: v => v }), pSlider('grainSize', 'Size', 0, 100, 1, { fmt: v => v }), pSlider('grainRough', 'Roughness', 0, 100, 1, { fmt: v => v }), pSlider('grainColor', 'Color grain', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Film light' }),
    pSlider('halation', 'Halation', 0, 100, 1, { fmt: v => v, track: 'linear-gradient(90deg,var(--raise),#e0552c)' }), pSlider('glow', 'Diffusion glow', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Letterbox' }), lb),
    h('div', { class: 'sub', text: 'Cinema' }),
    pSlider('flare', 'Anamorphic flare', 0, 100, 1, { fmt: v => v, track: 'linear-gradient(90deg,var(--raise),#5a9cff)' }), pSlider('fade', 'Fade', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Light leak' }),
    pSlider('leak', 'Amount', 0, 100, 1, { fmt: v => v }), pSlider('leakHue', 'Color', 0, 360, 1, { fmt: v => v + '°', track: 'linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)' }), pSlider('leakPos', 'Position', -100, 100, 1),
    h('div', { class: 'sub', text: 'Film damage' }), pSlider('damage', 'Dust & scratches', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Tilt-shift blur' }), pSlider('tilt', 'Blur', 0, 100, 1, { fmt: v => v }), pSlider('tiltPos', 'Focus line', 0, 100, 1, { fmt: v => v }), pSlider('tiltWidth', 'Sharp band', 2, 60, 1, { fmt: v => v }), pSlider('tiltFeather', 'Transition', 2, 60, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Border' }), pSlider('border', 'Size', 0, 100, 1, { fmt: v => v }), pSlider('borderBottom', 'Bottom extra', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Border color' }), h('div', { class: 'seg' }, [['white', 'White'], ['cream', 'Cream'], ['black', 'Black']].map(([k, t]) => h('button', { class: (e.borderColor || 'white') === k ? 'on' : '', onclick: () => { P().borderColor = k; commit('Border color'); renderEditRight(); requestRender(); } }, t)))),
    lutRow ? h('div', {}, h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'LUT: ' + lutRow.name }), h('button', { class: 'btn sm ghost', onclick: () => { P().lut = null; commit('Remove LUT'); renderEditRight(); requestRender(); } }, 'Remove')),
      slider('s-lutAmt', 'LUT amount', 0, 100, 1, () => P().lut ? P().lut.amount : 100, (v) => { P().lut.amount = v; requestRender(); }, { def: 100, fmt: v => Math.round(v) + '%', onCommit: () => commit('LUT amount') })) : null],
    { action: resetAct(['effects', 'lut'], 'effects') });
}
function calibrationPanel() {
  return section('calibration', 'Calibration', [pSlider('calShadow', 'Shadows tint', -100, 100, 1, { track: 'linear-gradient(90deg,#4fb548,#888 50%,#c64bb4)' }),
    h('div', { class: 'sub', text: 'Red primary' }), pSlider('calRH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#d64bb0,#e0433c,#ec8a2c)' }), pSlider('calRS', 'Saturation', -100, 100, 1),
    h('div', { class: 'sub', text: 'Green primary' }), pSlider('calGH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#e8cf35,#4fb548,#3fc1c4)' }), pSlider('calGS', 'Saturation', -100, 100, 1),
    h('div', { class: 'sub', text: 'Blue primary' }), pSlider('calBH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#3fc1c4,#3f6fe0,#8b52d6)' }), pSlider('calBS', 'Saturation', -100, 100, 1)], { action: resetAct(['calibration'], 'calibration') });
}

/* ============================== tool panels ============================== */
const ASPECTS = [['original', 'Original'], ['free', 'Free'], ['1', '1 : 1'], ['1.25', '4 : 5'], ['1.4', '5 : 7'], ['1.3333', '3 : 4'], ['1.5', '2 : 3'], ['1.7778', '16 : 9'], ['2.39', '2.39 : 1']];
function cropRatio() {
  if (S.cropAspect === 'free') return null;
  const F = Engine.frame(img, P());
  let r = S.cropAspect === 'original' ? F.hw / F.hh : +S.cropAspect;
  if (S.cropAspect !== 'original' && F.hw < F.hh) r = 1 / r;
  if (S.cropPortrait) r = 1 / r;
  return r;
}
function ensureCrop() { const p = P(); if (!p.crop) { const F = Engine.frame(img, p); p.crop = { cx: 0, cy: 0, hw: F.hw, hh: F.hh, angle: 0 }; } return p.crop; }
function applyAspect() {
  const c = ensureCrop(), r = cropRatio(); if (!r) return;
  const area = c.hw * c.hh; c.hw = Math.sqrt(area * r); c.hh = c.hw / r; constrainCrop(c, true);
}
function constrainCrop(c, grow) {
  if (!S.constrain) return;
  const F = Engine.frame(img, P());
  const a = c.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const inside = (cx, cy, hw, hh) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].every(([sx, sy]) => { const x = cx + ca * sx * hw - sa * sy * hh, y = cy + sa * sx * hw + ca * sy * hh; return Math.abs(x) <= F.hw + 1e-6 && Math.abs(y) <= F.hh + 1e-6; });
  c.cx = U.clamp(c.cx, -F.hw, F.hw); c.cy = U.clamp(c.cy, -F.hh, F.hh);
  if (inside(c.cx, c.cy, c.hw, c.hh)) return;
  // first try sliding the centre inwards, then shrink
  for (let k = 0; k < 20 && !inside(c.cx, c.cy, c.hw, c.hh); k++) { c.cx *= 0.9; c.cy *= 0.9; }
  let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; inside(c.cx, c.cy, c.hw * m, c.hh * m) ? lo = m : hi = m; }
  c.hw *= lo; c.hh *= lo;
}
function cropPanel() {
  const p = P();
  const asp = h('select', { id: 'cropAspect', onchange: (e) => { S.cropAspect = e.target.value; applyAspect(); commit('Crop aspect'); requestRender(); } }, ASPECTS.map(([v, t]) => h('option', { value: v, text: t })));
  asp.value = S.cropAspect;
  const ang = slider('s-cropAngle', 'Straighten', -45, 45, 0.1, () => (P().crop ? P().crop.angle : 0), (v) => { const c = ensureCrop(); c.angle = v; constrainCrop(c); requestRender(); }, { def: 0, onCommit: () => commit('Straighten'), fmt: v => v.toFixed(1) + '°' });
  const orient = (d) => { const q = P(); q.orient = (q.orient + d + 4) % 4; q.crop = null; commit(d > 0 ? 'Rotate right' : 'Rotate left'); renderEditRight(); layoutStage(); requestRender(); };
  return section('croptool', 'Crop & straighten', [
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Aspect' }), asp,
      h('button', { class: 'btn sm', title: 'Swap portrait / landscape', onclick: () => { S.cropPortrait = !S.cropPortrait; applyAspect(); commit('Crop orientation'); requestRender(); } }, '⇄')),
    ang,
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: autoStraighten }, 'Auto straighten'), h('button', { class: 'btn sm', onclick: () => { const c = ensureCrop(); c.angle = 0; constrainCrop(c); syncSlider('s-cropAngle'); commit('Level reset'); requestRender(); } }, 'Level 0°')),
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => orient(-1) }, '⟲ 90°'), h('button', { class: 'btn sm', onclick: () => orient(1) }, '⟳ 90°'),
      h('button', { class: 'btn sm' + (p.flipH ? ' on' : ''), onclick: () => { P().flipH = !P().flipH; commit('Flip horizontal'); renderEditRight(); requestRender(); } }, 'Flip ↔'),
      h('button', { class: 'btn sm' + (p.flipV ? ' on' : ''), onclick: () => { P().flipV = !P().flipV; commit('Flip vertical'); renderEditRight(); requestRender(); } }, 'Flip ↕')),
    h('label', { class: 'chk' }, h('input', { type: 'checkbox', id: 'cropConstrain', checked: S.constrain, onchange: (e) => { S.constrain = e.target.checked; if (S.constrain && P().crop) { constrainCrop(P().crop); requestRender(); } } }), 'Keep crop inside the photo'),
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { P().crop = null; commit('Reset crop'); renderEditRight(); requestRender(); } }, 'Reset crop'), h('span', { style: { flex: 1 } }), h('button', { class: 'btn sm pri', onclick: () => setTool(null) }, 'Done')),
    h('div', { class: 'empty', style: { padding: 0 }, text: 'Drag corners or edges to crop, drag inside to move, drag outside the box to rotate.' })], { open: true });
}
function healPanel() {
  const p = P(), sp = p.spots[S.selSpot];
  const body = [h('div', { class: 'seg' }, [['heal', 'Heal'], ['clone', 'Clone'], ['redeye', 'Red eye']].map(([k, t]) => h('button', { class: S.heal.mode === k ? 'on' : '', onclick: () => { S.heal.mode = k; if (sp) { sp.mode = k; commit('Spot mode'); requestRender(); } renderEditRight(); } }, t))),
    slider('s-healSize', 'Size', 0.3, 20, 0.1, () => sp ? sp.r * 100 : S.heal.size, (v) => { S.heal.size = v; if (sp) { sp.r = v / 100; requestRender(); } drawOverlay(); }, { def: 3, fmt: v => v.toFixed(1), onCommit: () => sp && commit('Spot size') }),
    slider('s-healFeather', 'Feather', 0, 100, 1, () => sp ? sp.feather : S.heal.feather, (v) => { S.heal.feather = v; if (sp) { sp.feather = v; requestRender(); } }, { def: 40, fmt: v => v, onCommit: () => sp && commit('Spot feather') }),
    slider('s-healOpacity', 'Opacity', 0, 100, 1, () => sp ? sp.opacity : S.heal.opacity, (v) => { S.heal.opacity = v; if (sp) { sp.opacity = v; requestRender(); } }, { def: 100, fmt: v => v, onCommit: () => sp && commit('Spot opacity') }),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: `${p.spots.length} of 24 spots` }),
      h('button', { class: 'btn sm', disabled: !sp, onclick: deleteSpot }, 'Delete spot'), h('button', { class: 'btn sm', disabled: !p.spots.length, onclick: () => { P().spots = []; S.selSpot = -1; commit('Clear spots'); renderEditRight(); requestRender(); } }, 'Clear all')),
    h('div', { class: 'empty', style: { padding: 0 }, text: S.heal.mode === 'redeye' ? 'Click each pupil to remove red-eye.' : 'Click a blemish to fix it. Safelight picks a source area; drag the dashed circle to choose a better one.' })];
  return section('healtool', 'Healing', body, { open: true });
}
function autoStraighten() {
  const q = defaults(); ['orient', 'flipH', 'flipV', 'tVert', 'tHorz', 'tRot', 'tAspect', 'tScale', 'tX', 'tY', 'distortion'].forEach(k => q[k] = U.clone(P()[k]));
  const id = engine.renderSmall(img, q, 480, null); requestRender();
  const W = id.width, H = id.height, d = id.data, L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
  const bins = new Float32Array(161); // -20..20 degrees in 0.25 steps
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const gx = L[i - W + 1] + 2 * L[i + 1] + L[i + W + 1] - L[i - W - 1] - 2 * L[i - 1] - L[i + W - 1];
    const gy = L[i + W - 1] + 2 * L[i + W] + L[i + W + 1] - L[i - W - 1] - 2 * L[i - W] - L[i - W + 1];
    const m = Math.hypot(gx, gy); if (m < 60) continue;
    let a = Math.atan2(gy, gx) * 180 / Math.PI + 90; a = ((a + 45) % 90 + 90) % 90 - 45;
    if (Math.abs(a) > 20) continue; bins[Math.round((a + 20) * 4)] += m;
  }
  let best = -1, bi = 80;
  for (let i = 2; i < 159; i++) { const v = bins[i - 2] + 2 * bins[i - 1] + 3 * bins[i] + 2 * bins[i + 1] + bins[i + 2]; if (v > best) { best = v; bi = i; } }
  const ang = bi / 4 - 20;
  if (best <= 0 || Math.abs(ang) < 0.15) { toast('This photo already looks level.'); return; }
  const c = ensureCrop(); const from = c.angle, t0 = performance.now();
  const stepf = (now) => { const t = Math.min(1, (now - t0) / 300); c.angle = from + (ang - from) * ease(t); constrainCrop(c); syncSlider('s-cropAngle'); requestRender(); if (t < 1) requestAnimationFrame(stepf); else { commit('Auto straighten'); toast(`Straightened by ${ang.toFixed(1)}°.`); } };
  requestAnimationFrame(stepf);
}
function deleteSpot() { const p = P(); if (S.selSpot < 0) return; p.spots.splice(S.selSpot, 1); S.selSpot = -1; commit('Delete spot'); renderEditRight(); requestRender(); }
function newMask(type) {
  const p = P(); if (p.masks.length >= 8) { toast('Up to 8 masks per photo.'); return; }
  const n = p.masks.filter(m => m.type === type).length + 1;
  const names = { linear: 'Linear gradient', radial: 'Radial gradient', brush: 'Brush', range: 'Range' };
  const m = { id: U.uid(), name: `${names[type]} ${n}`, type, invert: false, hidden: false, amount: 100, adj: maskAdj0(), range: { type: type === 'range' ? 'lum' : 'none', lo: 60, hi: 100, smooth: 15, hue: 210, tol: 30 }, strokes: [] };
  if (type === 'linear') m.geom = null;
  if (type === 'radial') m.geom = null;
  p.masks.push(m); S.selMask = p.masks.length - 1;
  S.maskCreate = (type === 'linear' || type === 'radial') ? type : null;
  if (type === 'range' || type === 'brush') commit('New mask');
  invalidateBrush(); renderEditRight(); requestRender();
  if (S.maskCreate) toast(type === 'linear' ? 'Drag across the photo: the effect is full where you start and fades out where you stop.' : 'Drag from the centre outwards to place the radial gradient.');
}
function quickMask(kind) {
  const p = P(); if (p.masks.length >= 8) { toast('Up to 8 masks per photo.'); return; }
  if (kind === 'dodge' || kind === 'burn') {
    newMask('brush'); const m = p.masks[S.selMask]; m.name = kind === 'dodge' ? 'Dodge' : 'Burn'; m.adj.exposure = kind === 'dodge' ? 0.5 : -0.5; S.brush.erase = false;
    commit(m.name); renderEditRight(); requestRender(); toast(`Paint over the areas to ${kind === 'dodge' ? 'brighten' : 'darken'}. Change the strength with Exposure.`); return;
  }
  const G = Engine.geom(img, p, false);
  if (kind === 'sky') {
    const a = Engine.outToSrc(G, 0.5, 0), b = Engine.outToSrc(G, 0.5, 0.62);
    const m = { id: U.uid(), name: 'Sky', type: 'linear', invert: false, hidden: false, amount: 100, adj: Object.assign(maskAdj0(), { exposure: -0.3, highlights: -30, saturation: 15, dehaze: 15 }), range: { type: 'color', lo: 60, hi: 100, smooth: 15, hue: 210, tol: 55 }, strokes: [], geom: { x0: a[0], y0: a[1], x1: b[0], y1: b[1] } };
    p.masks.push(m); S.selMask = p.masks.length - 1;
  } else {
    const c = Engine.outToSrc(G, 0.5, 0.5), F = Engine.frame(img, p);
    const m = { id: U.uid(), name: 'Spotlight', type: 'radial', invert: true, hidden: false, amount: 100, adj: Object.assign(maskAdj0(), { exposure: -0.6 }), range: { type: 'none', lo: 60, hi: 100, smooth: 15, hue: 210, tol: 30 }, strokes: [], geom: { cx: c[0], cy: c[1], rx: G.crop[2] * 0.7, ry: G.crop[3] * 0.7, angle: 0, feather: 70 } };
    p.masks.push(m); S.selMask = p.masks.length - 1;
  }
  invalidateBrush(); commit(kind === 'sky' ? 'Sky mask' : 'Spotlight'); renderEditRight(); requestRender();
}
function maskPanel() {
  const p = P(); const m = p.masks[S.selMask];
  const body = [h('div', { class: 'row' }, ['linear', 'radial', 'brush', 'range'].map(t => h('button', { class: 'btn sm', onclick: () => newMask(t) }, '+ ' + { linear: 'Linear', radial: 'Radial', brush: 'Brush', range: 'Range' }[t]))),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0 }, text: 'Quick' }), h('button', { class: 'btn sm', title: 'Paint to brighten areas', onclick: () => quickMask('dodge') }, 'Dodge'), h('button', { class: 'btn sm', title: 'Paint to darken areas', onclick: () => quickMask('burn') }, 'Burn'), h('button', { class: 'btn sm', title: 'Select the sky (blue areas near the top)', onclick: () => quickMask('sky') }, 'Sky'), h('button', { class: 'btn sm', title: 'Brighten the centre and darken the edges', onclick: () => quickMask('spot') }, 'Spotlight'))];
  if (!p.masks.length) body.push(h('div', { class: 'empty', text: 'Masks apply local adjustments. Add a gradient, paint with a brush, or select by brightness or color.' }));
  p.masks.forEach((mk, i) => body.push(h('div', { class: 'maskrow' + (i === S.selMask ? ' on' : ''), onclick: () => { S.selMask = i; S.maskCreate = null; renderEditRight(); requestRender(); } },
    h('span', { class: 't', text: mk.name + (mk.range.type !== 'none' && mk.type !== 'range' ? ' · ' + mk.range.type : '') }),
    h('button', { class: 'iconbtn' + (mk.invert ? ' on' : ''), title: 'Invert', 'aria-label': 'Invert mask', onclick: (e) => { e.stopPropagation(); mk.invert = !mk.invert; commit('Invert mask'); renderEditRight(); requestRender(); } }, '◐'),
    h('button', { class: 'iconbtn' + (mk.hidden ? '' : ' on'), title: mk.hidden ? 'Show effect' : 'Hide effect', 'aria-label': 'Toggle mask', onclick: (e) => { e.stopPropagation(); mk.hidden = !mk.hidden; commit('Toggle mask'); renderEditRight(); requestRender(); } }, mk.hidden ? '○' : '●'),
    h('button', { class: 'iconbtn', title: 'Duplicate', 'aria-label': 'Duplicate mask', onclick: (e) => { e.stopPropagation(); if (p.masks.length >= 8) return; const c = U.clone(mk); c.id = U.uid(); c.name += ' copy'; p.masks.splice(i + 1, 0, c); S.selMask = i + 1; invalidateBrush(); commit('Duplicate mask'); renderEditRight(); requestRender(); } }, '⧉'),
    h('button', { class: 'iconbtn', title: 'Delete', 'aria-label': 'Delete mask', onclick: (e) => { e.stopPropagation(); p.masks.splice(i, 1); S.selMask = Math.min(S.selMask, p.masks.length - 1); invalidateBrush(); commit('Delete mask'); renderEditRight(); requestRender(); } }, '×'))));
  if (p.masks.length) body.push(h('label', { class: 'chk' }, h('input', { type: 'checkbox', id: 'maskOv', checked: S.maskOverlay, onchange: (e) => { S.maskOverlay = e.target.checked; requestRender(); } }), 'Show mask overlay (O)'));
  if (m) {
    const ms = (k, l, mn, mx, st) => slider(`s-m-${k}`, l, mn, mx, st, () => m.adj[k], (v) => { m.adj[k] = v; requestRender(); }, { def: 0, onCommit: () => commit(`Mask ${l.toLowerCase()}`) });
    body.push(h('div', { class: 'sub', text: m.name }),
      slider('s-m-amount', 'Amount', 0, 200, 1, () => m.amount, (v) => { m.amount = v; requestRender(); }, { def: 100, fmt: v => v + '%', onCommit: () => commit('Mask amount') }),
      ...MASK_ADJ.map(a => ms(...a)));
    if (m.type === 'radial' && m.geom) body.push(h('div', { class: 'sub', text: 'Shape' }),
      slider('s-m-feather', 'Feather', 0, 100, 1, () => m.geom.feather, (v) => { m.geom.feather = v; requestRender(); }, { def: 50, fmt: v => v, onCommit: () => commit('Mask feather') }),
      slider('s-m-angle', 'Angle', -90, 90, 1, () => m.geom.angle, (v) => { m.geom.angle = v; requestRender(); }, { def: 0, fmt: v => v + '°', onCommit: () => commit('Mask angle') }));
    if (m.type === 'brush') body.push(h('div', { class: 'sub', text: 'Brush' }),
      h('div', { class: 'seg' }, h('button', { class: !S.brush.erase ? 'on' : '', onclick: () => { S.brush.erase = false; renderEditRight(); } }, 'Paint'), h('button', { class: S.brush.erase ? 'on' : '', onclick: () => { S.brush.erase = true; renderEditRight(); } }, 'Erase')),
      slider('s-b-size', 'Size', 0.5, 40, 0.5, () => S.brush.size, (v) => S.brush.size = v, { def: 6, fmt: v => v.toFixed(1) }),
      slider('s-b-feather', 'Feather', 0, 100, 1, () => S.brush.feather, (v) => S.brush.feather = v, { def: 60, fmt: v => v }),
      slider('s-b-flow', 'Flow', 5, 100, 1, () => S.brush.flow, (v) => S.brush.flow = v, { def: 60, fmt: v => v }),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { m.strokes = []; invalidateBrush(); commit('Clear brush'); requestRender(); } }, 'Clear brush'), h('span', { class: 'empty', style: { padding: 0 }, text: 'Hold Alt to erase.' })));
    const r = m.range;
    body.push(h('div', { class: 'sub', text: m.type === 'range' ? 'Select by' : 'Refine by range' }),
      h('div', { class: 'seg' }, [...(m.type === 'range' ? [] : [['none', 'Off']]), ['lum', 'Luminance'], ['color', 'Color']].map(([k, t]) => h('button', { class: r.type === k ? 'on' : '', onclick: () => { r.type = k; commit('Mask range'); renderEditRight(); requestRender(); } }, t))));
    if (r.type === 'lum') body.push(
      slider('s-r-lo', 'From', 0, 100, 1, () => r.lo, (v) => { r.lo = v; requestRender(); }, { def: 60, fmt: v => v, onCommit: () => commit('Mask range') }),
      slider('s-r-hi', 'To', 0, 100, 1, () => r.hi, (v) => { r.hi = v; requestRender(); }, { def: 100, fmt: v => v, onCommit: () => commit('Mask range') }),
      slider('s-r-sm', 'Smoothness', 0, 50, 1, () => r.smooth, (v) => { r.smooth = v; requestRender(); }, { def: 15, fmt: v => v, onCommit: () => commit('Mask range') }));
    if (r.type === 'color') body.push(
      h('div', { class: 'row' }, h('button', { class: 'btn sm' + (S.picking === 'maskColor' ? ' on' : ''), onclick: () => { S.picking = S.picking === 'maskColor' ? null : 'maskColor'; renderEditRight(); updateHint(); } }, 'Pick color from photo'),
        h('span', { class: 'lbl', style: { width: '18px', height: '18px', background: `hsl(${r.hue},70%,50%)` } })),
      slider('s-r-hue', 'Hue', 0, 360, 1, () => r.hue, (v) => { r.hue = v; requestRender(); }, { def: 210, fmt: v => v + '°', track: 'linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)', onCommit: () => commit('Mask color') }),
      slider('s-r-tol', 'Tolerance', 2, 100, 1, () => r.tol, (v) => { r.tol = v; requestRender(); }, { def: 30, fmt: v => v, onCommit: () => commit('Mask color') }));
  }
  return section('masktool', 'Masks', body, { open: true });
}

/* ============================== auto tone & white balance ============================== */
function analyse(handle, e, zeroWB) {
  const q = defaults(); ['crop', 'orient', 'flipH', 'flipV'].forEach(k => q[k] = U.clone(e[k]));
  if (!zeroWB) { q.temp = e.temp; q.tint = e.tint; }
  const id = engine.renderSmall(handle, q, 256, null);
  if (img && handle === img) requestRender();
  return id;
}
function autoTone(handle, e) {
  const id = analyse(handle, e, false), d = id.data; const L = [];
  for (let i = 0; i < d.length; i += 4) L.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
  L.sort((a, b) => a - b); const pc = (q) => L[Math.min(L.length - 1, Math.floor(q * L.length))];
  const med = pc(0.5);
  const exposure = U.clamp(Math.log2(U.toLin(0.46) / Math.max(1e-4, U.toLin(med))) * 0.85, -3, 3);
  const g = Math.pow(2, exposure); const adj = (v) => U.clamp(U.toSrgb(U.toLin(v) * g), 0, 1.5);
  const p99 = adj(pc(0.995)), p01 = adj(pc(0.005)), hiShare = L.filter(v => adj(v) > 0.95).length / L.length;
  return {
    exposure: Math.round(exposure * 100) / 100,
    whites: Math.round(U.clamp((0.97 - p99) / 0.25 * 100, -60, 60)),
    blacks: Math.round(U.clamp((0.025 - p01) / 0.15 * 100, -60, 40)),
    highlights: Math.round(hiShare > 0.02 ? -U.clamp(hiShare * 500, 10, 60) : -10),
    shadows: Math.round(U.clamp((0.3 - adj(pc(0.15))) * 120, 0, 45)),
    contrast: 8, vibrance: Math.max(e.vibrance, 12)
  };
}
function wbFromRGB(r, g, b) {
  r = Math.max(r, 1e-4); g = Math.max(g, 1e-4); b = Math.max(b, 1e-4);
  const T = Math.log(b / r) / 1.6, Tn = (Math.log(g) - Math.log(r) - 0.8 * T) / 0.5;
  return { temp: Math.round(U.clamp(T * 100, -100, 100)), tint: Math.round(U.clamp(Tn * 100, -100, 100)) };
}
function autoWB(handle, e) {
  const id = analyse(handle, e, true), d = id.data; let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]); if (mx > 250 || mx < 10) continue; r += U.toLin(d[i] / 255); g += U.toLin(d[i + 1] / 255); b += U.toLin(d[i + 2] / 255); n++; }
  return n ? wbFromRGB(r / n, g / n, b / n) : {};
}
function pickWB(u, v) {
  const id = analyse(img, P(), true); const x = Math.round(u * (id.width - 1)), y = Math.round(v * (id.height - 1));
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = U.clamp(x + dx, 0, id.width - 1), yy = U.clamp(y + dy, 0, id.height - 1), i = (yy * id.width + xx) * 4; r += U.toLin(id.data[i] / 255); g += U.toLin(id.data[i + 1] / 255); b += U.toLin(id.data[i + 2] / 255); n++; }
  Object.assign(P(), wbFromRGB(r / n, g / n, b / n)); commit('White balance picker'); renderEditRight(); requestRender();
}
function pickMaskColor(u, v) {
  const m = P().masks[S.selMask]; if (!m) return;
  const q = U.clone(P()); q.masks = []; const id = engine.renderSmall(img, q, 256, null);
  const x = Math.round(u * (id.width - 1)), y = Math.round(v * (id.height - 1)), i = (y * id.width + x) * 4;
  const R = id.data[i] / 255, G = id.data[i + 1] / 255, B = id.data[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  let hh = 0; if (d > 0) { hh = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
  m.range.hue = Math.round(hh); S.picking = null; commit('Mask color'); renderEditRight(); requestRender();
}

/* ============================== edit: left panel ============================== */
function renderEditLeft() {
  const L = $('#left'); const st = L.scrollTop; L.innerHTML = '';
  const p = ph(); if (!p) return;
  L.append(section('nav', 'Navigator', h('div', { class: 'nav' }, h('canvas', { id: 'navCv', width: 440, height: 300, 'aria-label': 'Navigator: click to move the zoomed view' }),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('div', { class: 'seg' }, [[0, 'Fit'], [0.5, '50%'], [1, '100%'], [2, '200%']].map(([z, t]) => h('button', { class: S.zoom === z ? 'on' : '', onclick: () => { S.zoom = z; layoutStage(); requestRender(); renderEditLeft(); } }, t)))))));
  L.append(looksSection());
  // snapshots
  L.append(section('snaps', 'Snapshots', [h('div', { class: 'list' }, p.snapshots.length ? p.snapshots.map((s, i) => h('button', { class: 'li', onclick: () => { p.edits = U.clone(s.edits); invalidateBrush(); commit('Snapshot: ' + s.name); renderEditRight(); requestRender(); } }, h('span', { class: 't', text: s.name }), h('span', { class: 'n', text: new Date(s.at).toLocaleDateString() }),
    h('button', { class: 'x', 'aria-label': 'Delete snapshot', onclick: (e) => { e.stopPropagation(); p.snapshots.splice(i, 1); savePhoto(p); renderEditLeft(); } }, '×'))) : h('div', { class: 'empty', text: 'Save versions of this edit to compare or return to later.' })),
    h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn sm', onclick: () => { const name = h('input', { type: 'text', id: 'snapName', value: 'Version ' + (p.snapshots.length + 1) }); dialog('New snapshot', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name)], 'Save', () => { p.snapshots.push({ name: name.value.trim() || 'Snapshot', at: Date.now(), edits: U.clone(p.edits) }); savePhoto(p); renderEditLeft(); }); setTimeout(() => name.select(), 30); } }, '+ Snapshot'))]));
  L.append(section('hist', 'History', h('div', { class: 'list', id: 'histList' })));
  L.append(section('photoAct', 'Photo', h('div', { class: 'row' },
    h('button', { class: 'btn sm', onclick: () => { P() && Object.assign(p.edits, defaults()); invalidateBrush(); commit('Reset all'); renderEditRight(); requestRender(); } }, 'Reset all'),
    h('button', { class: 'btn sm', onclick: () => virtualCopy(p) }, 'Virtual copy'))));
  renderHistory(); drawNavigator(); L.scrollTop = st; applyMobile();
}
function renderHistory() {
  const el = $('#histList'); const p = ph(); if (!el || !p) return; el.innerHTML = '';
  for (let i = p.history.length - 1; i >= 0; i--) {
    el.append(h('button', { class: 'li' + (i === p.hIndex ? ' on' : ''), style: i > p.hIndex ? { opacity: 0.5 } : null, onclick: () => gotoHistory(i) }, h('span', { class: 't', text: p.history[i].label })));
  }
}
/* ============================== looks (presets, film looks, LUTs) ============================== */
const allLooks = () => [...BUILTIN, ...S.userPresets.map(p => Object.assign({ group: 'My presets', tags: '' }, p)), ...S.luts.map(l => ({ id: 'lut:' + l.id, group: 'LUTs', name: l.name, values: { lut: { id: l.id, amount: 100 } }, lutId: l.id }))];
const findLook = (id) => allLooks().find(l => l.id === id);
const DISCRETE = new Set(['bw', 'letterbox', 'crop', 'orient', 'flipH', 'flipV', 'masks', 'spots', 'borderColor', 'look']);
function mixVal(k, a, b, t) {
  if (k === 'lut') return b ? { id: b.id, amount: (b.amount == null ? 100 : b.amount) * t } : (t >= 0.5 ? b : a);
  if (DISCRETE.has(k)) return U.clone(t > 0.001 ? b : a);
  if (typeof a === 'number' && typeof b === 'number') return /H$/.test(k) && /^g/.test(k) ? (t > 0.001 ? b : a) : a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b) && typeof a[0] === 'number' && a.length === b.length) return a.map((x, i) => x + (b[i] - x) * t);
  if (k === 'curve') { const o = {}; for (const ch of ['rgb', 'r', 'g', 'b']) { const ca = a[ch], cb = b[ch]; o[ch] = JSON.stringify(ca) === JSON.stringify(cb) ? U.clone(ca) : cb.map(([x, y]) => [x, U.clamp(x + (y - x) * t, 0, 1)]); } return o; }
  return U.clone(t >= 0.5 ? b : a);
}
function stripLook(e) { if (e.look) { for (const [k, v] of Object.entries(e.look.base)) e[k] = U.clone(v); e.look = null; } return e; }
function blendLook(e, look) { const t = e.look.amount / 100; for (const [k, v] of Object.entries(look.values)) e[k] = mixVal(k, e.look.base[k], v, t); return e; }
function applyLookTo(e, look, amount = 100) {
  stripLook(e);
  if (!look) return e;
  const base = {}; Object.keys(look.values).forEach(k => base[k] = U.clone(e[k]));
  e.look = { id: look.id, name: look.name, base, amount };
  return blendLook(e, look);
}
function applyPreset(look) {
  const e = P(); if (!e) return;
  const target = applyLookTo(U.clone(e), look);
  // the crop a look's bars replaced is remembered, so switching bar mode or removing the look gives it back
  const before = e.look && e.look.cropBefore !== undefined ? e.look.cropBefore : e.crop;
  if (look && look.values.letterbox) { target.crop = U.clone(before); adaptBars(target); if (target.look) target.look.cropBefore = U.clone(before); }
  else target.crop = U.clone(before);
  animateEdits(target, look ? 'Look: ' + look.name : 'Remove look', () => renderEditLeft());
  setTimeout(() => { document.querySelectorAll('.look').forEach(b => b.classList.toggle('on', b.title === (look ? look.name : 'Original'))); }, 0);
}
/* Glide every setting from the current edit to a new one, so looks, resets and auto fixes animate instead of jumping. */
let editAnim = 0;
function animateEdits(target, label, after, D = 340) {
  const e = P(); if (!e) return; cancelAnimationFrame(editAnim);
  const from = U.clone(e), keys = Object.keys(DEF).filter(k => !['masks', 'spots', 'look', 'crop', 'orient', 'flipH', 'flipV'].includes(k));
  if (JSON.stringify(e.crop) !== JSON.stringify(target.crop)) { e.crop = U.clone(target.crop); layoutStage(); }
  e.look = target.look; const t0 = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepf = (now) => {
    const t = reduce ? 1 : Math.min(1, (now - t0) / D), k = ease(t);
    if (t < 1) { for (const key of keys) e[key] = mixVal(key, from[key], target[key], k); S.interacting = true; requestRender(); document.querySelectorAll('.sl').forEach(r => r.sync && r.sync()); editAnim = requestAnimationFrame(stepf); }
    else { for (const key of Object.keys(target)) e[key] = U.clone(target[key]); S.interacting = false; invalidateBrush(); commit(label); renderEditRight(); after && after(); requestRender(); }
  };
  editAnim = requestAnimationFrame(stepf);
}
function setLookAmount(v) {
  const e = P(); if (!e || !e.look) return; const look = findLook(e.look.id); if (!look) return;
  e.look.amount = v; blendLook(e, look); requestRender();
  clearTimeout(setLookAmount.t); setLookAmount.t = setTimeout(() => { renderEditRight(); }, 150);
}
const lookThumbs = new Map(); let thumbQueue = [], thumbBusy = false;
function strHash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); }
function queueLookThumbs(tiles) {
  thumbQueue = tiles; if (!thumbBusy) pumpThumbs();
}
function pumpThumbs() {
  if (!thumbQueue.length || !img || S.view !== 'edit') { thumbBusy = false; return; }
  thumbBusy = true;
  const t0 = performance.now();
  while (thumbQueue.length && performance.now() - t0 < 24) {
    const { look, el, key } = thumbQueue.shift();
    if (!el.isConnected) continue;
    if (lookThumbs.has(key)) { el.src = lookThumbs.get(key); continue; }
    try {
      const e = adaptBars(applyLookTo(U.clone(P()), look));
      e.masks = P().masks; e.spots = [];
      const id = engine.renderSmall(img, e, 150, currentBrush());
      const c = document.createElement('canvas'); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
      const url = c.toDataURL('image/jpeg', 0.75); lookThumbs.set(key, url); el.src = url;
      if (lookThumbs.size > 400) lookThumbs.delete(lookThumbs.keys().next().value);
    } catch (err) { console.error(err); }
  }
  setTimeout(pumpThumbs, 16);
}
function looksSection() {
  const p = ph(), e = P();
  const looks = allLooks();
  const groups = [...new Set(looks.map(l => l.group))];
  if (!S.lookGroup || !groups.includes(S.lookGroup)) S.lookGroup = groups[0];
  S.lookTags = S.lookTags || new Set(); S.lookQ = S.lookQ || '';
  const finding = S.lookTags.size > 0 || S.lookQ.trim().length > 0;
  const chips = h('div', { class: 'chips', role: 'tablist' }, groups.map(g => h('button', { class: 'chip' + (!finding && S.lookGroup === g ? ' on' : ''), role: 'tab', onclick: () => { S.lookGroup = g; S.lookTags.clear(); S.lookQ = ''; renderEditLeft(); } }, g)));
  const base = stripLook(U.clone(e)); base.spots = [];
  const bkey = p.id + '|' + barsMode() + '|' + strHash(JSON.stringify(base));
  const tiles = [];
  const tile = (look, label) => {
    const im = h('img', { alt: '', src: p.thumb });
    const on = look ? (e.look && e.look.id === look.id) : !e.look;
    const b = h('button', { class: 'look' + (on ? ' on' : ''), title: label, onclick: () => { if (performance.now() - lastPanelScroll < 180) return; applyPreset(look); } }, h('span', { class: 'lim' }, im), h('span', { class: 'ln', text: label }),
      look && !look.builtin ? h('span', { class: 'lx', role: 'button', 'aria-label': 'Delete ' + label, onclick: (ev) => { ev.stopPropagation(); deleteLook(look); } }, '×') : null);
    tiles.push({ look, el: im, key: bkey + '|' + (look ? look.id + '|' + strHash(JSON.stringify(look.values)) : 'none') });
    return b;
  };
  // finder: free-text search + "describe what you saw" tags (all selected tags must match)
  const q = S.lookQ.trim().toLowerCase();
  const matches = (l) => { const t = (l.tags || '') + ' ' + l.group.toLowerCase(); if ([...S.lookTags].some(tag => !t.split(/\s+/).includes(tag))) return false; return !q || (l.name + ' ' + t).toLowerCase().includes(q); };
  const list = finding ? looks.filter(matches) : looks.filter(l => l.group === S.lookGroup);
  const grid = h('div', { class: 'looks' }, finding ? null : tile(null, 'Original'), list.map(l => tile(l, l.name)));
  const search = h('input', { type: 'search', id: 'lookQ', placeholder: 'Search looks: night, warm, thriller…', value: S.lookQ, 'aria-label': 'Search looks',
    oninput: (ev) => { S.lookQ = ev.target.value; clearTimeout(looksSection.t); looksSection.t = setTimeout(() => { const pos = ev.target.selectionStart; renderEditLeft(); const el = $('#lookQ'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (er) {} } }, 250); } });
  let open = false; try { open = localStorage.getItem('safelight.finder') === '1'; } catch (er) {}
  const finder = h('details', { class: 'finder', open: open || S.lookTags.size > 0, ontoggle: (ev) => { try { localStorage.setItem('safelight.finder', ev.target.open ? '1' : '0'); } catch (er) {} } },
    h('summary', {}, 'Describe the look you saw', S.lookTags.size ? h('span', { class: 'tagn', text: S.lookTags.size }) : null),
    h('div', { class: 'tagwrap' }, TAG_GROUPS.map(([g, tags]) => h('div', { class: 'taggrp' }, h('span', { class: 'tg', text: g }),
      h('div', { class: 'tagchips' }, tags.map(t => h('button', { class: 'chip sm' + (S.lookTags.has(t) ? ' on' : ''), 'aria-pressed': S.lookTags.has(t) ? 'true' : 'false', onclick: () => { S.lookTags.has(t) ? S.lookTags.delete(t) : S.lookTags.add(t); renderEditLeft(); } }, t.replace('-', ' ')))))),
      finding ? h('div', { class: 'row' }, h('span', { class: 'empty', style: { padding: 0, flex: 1 }, text: list.length ? `${list.length} look${list.length === 1 ? '' : 's'} match` : 'No look matches all of these. Remove a tag, or try Match from a picture.' }), h('button', { class: 'btn sm ghost', onclick: () => { S.lookTags.clear(); S.lookQ = ''; renderEditLeft(); } }, 'Clear')) : null));
  const cur = e.look && findLook(e.look.id);
  const amt = cur ? h('div', { class: 'lookamt' }, h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Look: ' + cur.name }), h('button', { class: 'btn sm ghost', onclick: () => applyPreset(null) }, 'Remove')),
    slider('s-lookAmt', 'Intensity', 0, 150, 1, () => P().look ? P().look.amount : 100, setLookAmount, { def: 100, fmt: v => v + '%', onCommit: () => commit('Look intensity ' + Math.round(P().look.amount) + '%') })) : null;
  const lutIn = h('input', { type: 'file', accept: '.cube', hidden: true, multiple: true, onchange: (ev) => { importLuts(ev.target.files); ev.target.value = ''; } });
  const refIn = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (ev) => { const f = ev.target.files[0]; ev.target.value = ''; if (f) matchLookFrom(f); } });
  const bars = h('div', { class: 'row barsrow' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Cinema bars' }),
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Cinema bars' }, [['bars', 'Bars'], ['crop', 'Crop'], ['off', 'Off']].map(([k, t]) => h('button', { class: barsMode() === k ? 'on' : '', title: { bars: 'Black bars like a cinema screen', crop: 'Crop the photo to the widescreen shape instead', off: 'Keep the full photo' }[k], onclick: () => setBarsMode(k) }, t))));
  const sec = section('presets', 'Looks', [amt,
    h('button', { class: 'btn matchbtn', onclick: () => refIn.click() }, h('span', { html: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="4" width="15" height="12" rx="1.5"/><path d="M2.5 13l4-4 3 3 2-2 6 5"/><circle cx="13.5" cy="7.5" r="1.3"/></svg>' }),
      h('span', { class: 'mt' }, h('b', { text: 'Match a look from a picture' }), h('small', { text: 'Use a screenshot of a scene you like' })), refIn),
    search, finder, chips, grid, bars,
    h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn sm', onclick: savePresetDlg }, '+ Save as preset'), h('button', { class: 'btn sm', onclick: () => lutIn.click() }, 'Import LUT (.cube)'), lutIn)], { open: true });
  setTimeout(() => queueLookThumbs(tiles), 30);
  return sec;
}
/* cinema bars: keep black bars, crop to the widescreen shape instead, or switch them off */
function barsMode() { try { return localStorage.getItem('safelight.bars') || 'bars'; } catch (e) { return 'bars'; } }
function setBarsMode(m) {
  try { localStorage.setItem('safelight.bars', m); } catch (e) {}
  const e = P(); const look = e && e.look && findLook(e.look.id);
  if (look && look.values.letterbox) applyPreset(look); else renderEditLeft();
}
function adaptBars(e) {
  const mode = barsMode(); if (mode === 'bars' || !e.letterbox) return e;
  const r = +e.letterbox; e.letterbox = 0;
  if (mode === 'crop' && img) {
    const F = Engine.frame(img, e); const fa = F.hw / F.hh; let hw, hh;
    if (fa > r) { hh = F.hh; hw = hh * r; } else { hw = F.hw; hh = hw / r; }
    e.crop = { cx: 0, cy: 0, hw, hh, angle: 0 };
  }
  return e;
}
/* ---- Match a look from a picture: measure a reference still and translate it into Safelight settings ---- */
function imageStats(data, W, H, skipBars) {
  const lum = (i) => (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  let top = 0, bot = 0;
  if (skipBars) {
    const rowDark = (y) => { let s = 0, mx = 0; for (let x = 0; x < W; x += 2) { const l = lum((y * W + x) * 4); s += l; mx = Math.max(mx, l); } return s / (W / 2) < 0.05 && mx < 0.16; };
    while (top < H * 0.3 && rowDark(top)) top++;
    while (bot < H * 0.3 && rowDark(H - 1 - bot)) bot++;
    if (top < H * 0.03 || bot < H * 0.03) { top = 0; bot = 0; }
  }
  const Ls = [], zones = { s: [0, 0, 0, 0], m: [0, 0, 0, 0], h: [0, 0, 0, 0], a: [0, 0, 0, 0] }; let chroma = 0, n = 0, cen = 0, cn = 0, cor = 0, kn = 0;
  const y0 = top, y1 = H - bot, ch = y1 - y0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    Ls.push(L); n++;
    const c = [r - L, g - L, b - L]; chroma += Math.hypot(c[0], c[1], c[2]);
    const z = L < 0.3 ? zones.s : L > 0.68 ? zones.h : zones.m;
    for (const zz of [z, zones.a]) { zz[0] += c[0]; zz[1] += c[1]; zz[2] += c[2]; zz[3]++; }
    const dx = (x / W - 0.5) * 2, dy = ((y - y0) / ch - 0.5) * 2, d = Math.hypot(dx, dy);
    if (d < 0.45) { cen += L; cn++; } else if (d > 1.15) { cor += L; kn++; }
  }
  Ls.sort((a, b) => a - b); const pc = (q) => Ls[Math.min(Ls.length - 1, Math.floor(q * Ls.length))];
  const avg = (z) => z[3] ? [z[0] / z[3], z[1] / z[3], z[2] / z[3]] : [0, 0, 0];
  return { p02: pc(0.02), p25: pc(0.25), p50: pc(0.5), p75: pc(0.75), p98: pc(0.98), sat: chroma / Math.max(n, 1), tint: { s: avg(zones.s), m: avg(zones.m), h: avg(zones.h), a: avg(zones.a) },
    vig: cn && kn ? (cor / kn) / Math.max(cen / cn, 0.01) : 1, bars: top || bot ? W / Math.max(1, ch) : 0 };
}
function tintToWheel(d, weight) {
  // find the wheel hue whose colour pushes most in direction d, and the amount needed
  let best = null;
  for (let hh = 0; hh < 360; hh += 3) {
    const c = U.hsv2rgb(hh / 360, 1, 1), L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], u = [c[0] - L, c[1] - L, c[2] - L];
    const uu = u[0] * u[0] + u[1] * u[1] + u[2] * u[2], proj = (u[0] * d[0] + u[1] * d[1] + u[2] * d[2]) / Math.sqrt(uu);
    if (!best || proj > best.proj) best = { hh, proj, uu };
  }
  const amt = best.proj / Math.sqrt(best.uu) / (0.3 * weight);
  return { h: best.hh, s: Math.round(U.clamp(amt * 100, 0, 55)) };
}
async function matchLookFrom(file) {
  if (!img || !P()) return;
  const busy = showBusy('Reading the colours of your picture…');
  try {
    const bmp = await createImageBitmap(file);
    const sc = Math.min(1, 320 / Math.max(bmp.width, bmp.height)); const W = Math.max(8, Math.round(bmp.width * sc)), H = Math.max(8, Math.round(bmp.height * sc));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0, W, H); bmp.close();
    const ref = imageStats(g.getImageData(0, 0, W, H).data, W, H, true);
    const base = stripLook(U.clone(P())); base.masks = P().masks;
    const pid = engine.renderSmall(img, base, 320, currentBrush()); requestRender();
    const ph0 = imageStats(pid.data, pid.width, pid.height, false);
    const v = {};
    v.exposure = Math.round(U.clamp(Math.log2(Math.max(U.toLin(ref.p50), 1e-3) / Math.max(U.toLin(ph0.p50), 1e-3)) * 0.45, -1, 1) * 100) / 100;
    const rs = (ref.p75 - ref.p25) / Math.max(ph0.p75 - ph0.p25, 0.02);
    v.contrast = Math.round(U.clamp((rs - 1) * 140, -60, 60));
    if (ref.p02 > ph0.p02 + 0.03) v.fade = Math.round(U.clamp((ref.p02 - ph0.p02) / 0.1 * 60, 0, 60));
    if (ref.p98 < 0.9) v.whites = Math.round(U.clamp((ref.p98 - Math.min(ph0.p98, 0.98)) / 0.25 * 100, -70, 0));
    if (ref.sat < 0.012) { v.bw = true; }
    else { const r = ref.sat / Math.max(ph0.sat, 0.01); v.saturation = Math.round(U.clamp((r - 1) * 90, -80, 50)); }
    const diff = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const glob = diff(ref.tint.a, ph0.tint.a);
    const gw = tintToWheel(glob, 1); v.ggH = gw.h; v.ggS = Math.round(gw.s * 0.6);
    const sub = (d) => diff(d, glob.map(x => x * 0.6));
    const sw = tintToWheel(sub(diff(ref.tint.s, ph0.tint.s)), 0.55); v.gsH = sw.h; v.gsS = sw.s;
    const hw = tintToWheel(sub(diff(ref.tint.h, ph0.tint.h)), 0.55); v.ghH = hw.h; v.ghS = hw.s;
    const mw = tintToWheel(sub(diff(ref.tint.m, ph0.tint.m)), 0.4); v.gmH = mw.h; v.gmS = Math.round(mw.s * 0.7);
    if (ref.vig < ph0.vig - 0.08) v.vig = Math.round(U.clamp((ref.vig - ph0.vig) * 160, -60, 0));
    if (ref.bars > 1.5) { const snaps = [1.66, 1.85, 2, 2.2, 2.39, 2.76]; const near = snaps.reduce((a, b) => Math.abs(b - ref.bars) < Math.abs(a - ref.bars) ? b : a); v.letterbox = Math.abs(near - ref.bars) < 0.12 ? near : Math.round(ref.bars * 100) / 100; }
    const name = 'Matched: ' + file.name.replace(/\.[^.]+$/, '').slice(0, 28);
    const pr = { id: U.uid(), group: 'My looks', name, values: v, tags: 'matched' + (v.bw ? ' bw' : '') };
    S.userPresets.push(pr); await U.DB.put('presets', pr);
    busy.remove(); S.lookGroup = 'My looks'; S.lookTags && S.lookTags.clear(); S.lookQ = '';
    applyPreset(Object.assign({ builtin: false }, pr));
    toast(`Matched the look${v.letterbox ? ' and its widescreen bars' : ''}. It's saved under My looks, and the Intensity slider tones it down.`, 5000);
  } catch (e) { busy.remove(); console.error(e); toast('That picture could not be read. Try a JPEG or PNG screenshot.', 4000); }
}
function deleteLook(look) {
  confirmDlg(`Delete “${look.name}”?`, 'Delete', async () => {
    if (look.lutId) { S.luts = S.luts.filter(l => l.id !== look.lutId); await U.DB.del('luts', look.lutId); engine.removeLut(look.lutId); }
    else { S.userPresets = S.userPresets.filter(x => x.id !== look.id); await U.DB.del('presets', look.id); }
    renderEditLeft(); requestRender();
  });
}
function parseCube(text) {
  let size = 0, min = [0, 0, 0], max = [1, 1, 1]; const vals = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line[0] === '#') continue;
    const parts = line.split(/\s+/);
    if (/^LUT_3D_SIZE$/i.test(parts[0])) size = +parts[1];
    else if (/^DOMAIN_MIN$/i.test(parts[0])) min = parts.slice(1, 4).map(Number);
    else if (/^DOMAIN_MAX$/i.test(parts[0])) max = parts.slice(1, 4).map(Number);
    else if (/^LUT_1D_SIZE$/i.test(parts[0])) throw new Error('1D LUTs are not supported; use a 3D .cube file.');
    else if (/^[-+.\d]/.test(parts[0]) && parts.length >= 3) vals.push(+parts[0], +parts[1], +parts[2]);
  }
  if (!size || size < 2 || size > 65) throw new Error('This file has no valid LUT_3D_SIZE.');
  if (vals.length < size ** 3 * 3) throw new Error('This LUT file is incomplete.');
  const data = new Float32Array(size ** 3 * 3);
  for (let i = 0; i < data.length; i++) { const c = i % 3; data[i] = U.clamp((vals[i] - min[c]) / ((max[c] - min[c]) || 1), 0, 1); }
  return { size, data };
}
async function importLuts(files) {
  let n = 0;
  for (const f of files) {
    try {
      const { size, data } = parseCube(await f.text());
      const rec = { id: U.uid(), name: f.name.replace(/\.cube$/i, ''), size, data };
      await U.DB.put('luts', rec); engine.registerLut(rec.id, size, data); S.luts.push({ id: rec.id, name: rec.name, size }); n++;
    } catch (e) { toast(`${f.name}: ${e.message}`, 4000); }
  }
  if (n) { S.lookGroup = 'LUTs'; renderEditLeft(); toast(`Imported ${n} LUT${n === 1 ? '' : 's'}. Pick one under LUTs.`); }
}
function savePresetDlg() {
  const name = h('input', { type: 'text', id: 'prName', value: 'My look' });
  const group = h('input', { type: 'text', id: 'prGroup', value: 'My presets' });
  const keys = Object.keys(GROUPS).filter(g => !['crop', 'masks', 'spots'].includes(g));
  const checks = Object.keys(GROUPS).map(g => h('label', { class: 'chk' }, h('input', { type: 'checkbox', value: g, checked: keys.includes(g) }), GROUPS[g][0]));
  dialog('Save preset', [h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Name' }), name), h('label', { class: 'field' }, h('span', { text: 'Group' }), group)),
    h('div', { class: 'sub', text: 'Include' }), h('div', { class: 'grid2' }, checks)], 'Save', () => {
    const values = {}; checks.forEach(c => { const cb = c.querySelector('input'); if (cb.checked) GROUPS[cb.value][1].forEach(k => values[k] = U.clone(P()[k])); });
    const pr = { id: U.uid(), group: group.value.trim() || 'My presets', name: name.value.trim() || 'Preset', values };
    S.userPresets.push(pr); U.DB.put('presets', pr); renderEditLeft(); toast('Preset saved.');
  });
  setTimeout(() => name.select(), 30);
}

/* ============================== edit: stage ============================== */
const STAGE_BG = { dark: '#0e0f10', mid: '#26272a', light: '#8a8c90' };
function renderEditCenter() {
  const C = $('#center'); C.innerHTML = ''; C.style.background = STAGE_BG[S.stageBg];
  const bar = h('div', { class: 'stagebar', id: 'stagebar' });
  const wrap = h('div', { class: 'stagewrap', id: 'stagewrap' }, h('canvas', { id: 'gl' }), h('canvas', { id: 'ov' }));
  C.append(bar, wrap);
  setupDrop(C);
  const cv = $('#gl');
  if (!engine) { toast('This browser does not support WebGL2, which Safelight needs for editing.'); return; }
  // move the engine's canvas into the stage
  cv.replaceWith(engine.gl.canvas); engine.gl.canvas.id = 'gl';
  updateStagebar(); setupStagePointer(wrap); layoutStage();
  new ResizeObserver(() => { layoutStage(); requestRender(); }).observe(wrap);
  openCurrent();
}
function updateStagebar() {
  const bar = $('#stagebar'); const p = ph(); if (!bar || !p) return; bar.innerHTML = '';
  const G = img ? Engine.geom(img, P(), false) : null;
  const seg = (items, val, on) => h('div', { class: 'seg' }, items.map(([v, t, title]) => h('button', { class: val === v ? 'on' : '', title: title || t, onclick: () => on(v) }, t)));
  const step = (d) => { const list = visiblePhotos(); const i = list.findIndex(x => x.id === S.cur); const n = list[i + d]; if (n) selectPhoto(n.id, null, list); };
  const hold = h('button', { class: 'btn sm monly', title: 'Hold to see the original' }, 'Hold: before');
  const on = (e) => { e.preventDefault(); S.compareHold = true; requestRender(); }, off = () => { if (S.compareHold) { S.compareHold = false; requestRender(); } };
  hold.addEventListener('pointerdown', on); hold.addEventListener('pointerup', off); hold.addEventListener('pointerleave', off); hold.addEventListener('pointercancel', off); hold.addEventListener('contextmenu', (e) => e.preventDefault());
  bar.append(h('button', { class: 'btn sm monly', 'aria-label': 'Previous photo', onclick: () => step(-1) }, '‹'), h('button', { class: 'btn sm monly', 'aria-label': 'Next photo', onclick: () => step(1) }, '›'), hold,
    h('button', { class: 'btn sm monly', 'aria-label': 'Undo', onclick: undo }, '↶'), h('button', { class: 'btn sm monly', 'aria-label': 'Redo', onclick: redo }, '↷'));
  const more = h('button', { class: 'btn sm', title: 'Photo actions', 'aria-label': 'Photo actions', onclick: (e) => { S.sel = new Set([S.cur]); const r = more.getBoundingClientRect(); photoMenu(r.left, r.bottom + 4); } }, '⋯');
  bar.append(h('span', { class: 'name', text: p.title || p.name }), h('span', { class: 'info', text: G ? `${G.outW} × ${G.outH}${p.raw ? (p.rawMode === 'full' ? ' · RAW' : ' · RAW preview') : ''}` : '' }), h('span', { style: { flex: 1 } }),
    stars(p, r => { setMeta([p.id], x => x.rating = r); }),
    seg([['off', 'Edited', 'Show the edit'], ['split', 'Split', 'Before / after split (Y)'], ['before', 'Before', 'Show the original (\\)']], S.compare, (v) => { S.compare = v; updateStagebar(); requestRender(); }),
    seg([['dark', '◼', 'Dark surround'], ['mid', '◧', 'Grey surround'], ['light', '◻', 'Light surround']], S.stageBg, (v) => { S.stageBg = v; $('#center').style.background = STAGE_BG[v]; updateStagebar(); }));
  bar.lastChild.classList.add('donly'); const segs = bar.querySelectorAll('.seg'); if (segs[0]) segs[0].classList.add('donly');
  bar.append(more);
}
let lay = null;
function layoutStage() {
  const wrap = $('#stagewrap'); if (!wrap || !img || S.view !== 'edit') return;
  const cropMode = S.tool === 'crop';
  const G = Engine.geom(img, P(), cropMode);
  const sw = wrap.clientWidth, sh = wrap.clientHeight; if (!sw || !sh) return;
  let cw, chh, view;
  if (!S.zoom) {
    const mg = cropMode ? 140 : 32; const s = Math.min((sw - mg) / G.outW, (sh - mg) / G.outH);
    cw = G.outW * s; chh = G.outH * s; view = [0, 0, 1, 1];
  } else {
    const z = S.zoom / Math.min(window.devicePixelRatio || 1, isMobile() ? 2 : 3);
    cw = Math.min(sw, G.outW * z); chh = Math.min(sh, G.outH * z);
    const su = cw / (G.outW * z), sv = chh / (G.outH * z);
    S.center[0] = U.clamp(S.center[0], su / 2, 1 - su / 2); S.center[1] = U.clamp(S.center[1], sv / 2, 1 - sv / 2);
    view = [S.center[0] - su / 2, S.center[1] - sv / 2, S.center[0] + su / 2, S.center[1] + sv / 2];
  }
  const baseDpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 2 : 3); let dpr = baseDpr;
  if (S.interacting && cw * chh * dpr * dpr > 900000) dpr *= Math.sqrt(900000 / (cw * chh * dpr * dpr));
  const x = Math.round((sw - cw) / 2), y = Math.round((sh - chh) / 2);
  const bw = Math.max(1, Math.min(engine.MAXTEX, Math.round(cw * dpr))), bh = Math.max(1, Math.min(engine.MAXTEX, Math.round(chh * dpr)));
  for (const c of [engine.gl.canvas, $('#ov')]) { c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.width = cw + 'px'; c.style.height = chh + 'px'; }
  const gc = engine.gl.canvas; if (gc.width !== bw || gc.height !== bh) { gc.width = bw; gc.height = bh; }
  const ov = $('#ov'); const od = Math.min(window.devicePixelRatio || 1, 2); const ow = Math.round(cw * od), oh = Math.round(chh * od); if (ov.width !== ow || ov.height !== oh) { ov.width = ow; ov.height = oh; }
  gc.style.imageRendering = S.zoom > 1 ? 'pixelated' : 'auto';
  lay = { x, y, w: cw, h: chh, view, G, cropMode, dpr: baseDpr };
}

/* ============================== render loop ============================== */
let dirty = false, histTimer = 0;
function requestRender() { if (!dirty) { dirty = true; requestAnimationFrame(frameRender); } }
function beforeParams(p) { const q = defaults(); ['crop', 'orient', 'flipH', 'flipV'].forEach(k => q[k] = U.clone(p[k])); return q; }
function frameRender() {
  dirty = false;
  if (S.view !== 'edit' || !img || !ph()) return;
  layoutStage(); if (!lay) return;
  const p = P(); const gc = engine.gl.canvas;
  const showMask = S.tool === 'mask' && S.maskOverlay && S.selMask >= 0 && P().masks[S.selMask] && !(P().masks[S.selMask].type !== 'brush' && !P().masks[S.selMask].geom && P().masks[S.selMask].type !== 'range') ? S.selMask : -1;
  const opt = { view: lay.view, w: gc.width, h: gc.height, cropMode: lay.cropMode, showClip: S.showClip, showMask, brush: currentBrush() };
  try {
    if (S.compare === 'before' || S.compareHold) engine.render(img, beforeParams(p), Object.assign({}, opt, { showMask: -1 }));
    else {
      engine.render(img, p, opt);
      if (S.compare === 'split' && !S.compareHold) { const sx = Math.round(gc.width * S.split); engine.render(img, beforeParams(p), Object.assign({}, opt, { showMask: -1, scissor: [0, 0, sx, gc.height] })); }
    }
  } catch (e) { console.error(e); }
  drawOverlay();
  clearTimeout(histTimer); if (!S.interacting) histTimer = setTimeout(drawHistogram, 160);
}
function drawHistogram() {
  const cv = $('#histo'); if (!cv || !img || !ph()) return;
  let id; try { id = engine.renderSmall(img, P(), 220, currentBrush()); } catch (e) { return; }
  const d = id.data, R = new Float32Array(256), G = new Float32Array(256), B = new Float32Array(256), Lh = new Float32Array(256);
  for (let i = 0; i < d.length; i += 4) { R[d[i]]++; G[d[i + 1]]++; B[d[i + 2]]++; Lh[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++; }
  curveHist = { l: Lh }; const ccv = $('#curveCv'); if (ccv) drawCurve(ccv);
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const mx = Math.max(...[R, G, B].map(a => Math.max(...a.slice(2, 254)))) || 1;
  g.globalCompositeOperation = 'lighter';
  for (const [arr, col] of [[R, 'rgba(230,70,70,0.75)'], [G, 'rgba(70,200,90,0.75)'], [B, 'rgba(80,120,255,0.75)']]) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, H - Math.min(1, Math.sqrt(arr[i] / mx)) * (H - 6));
    g.lineTo(W, H); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  const n = d.length / 4, lo = (R[0] + G[0] + B[0]) / 3 / n, hi = (R[255] + G[255] + B[255]) / 3 / n;
  const ex = ph().exif || {};
  const meta = $('#histoMeta'); if (meta) meta.textContent = [ex.iso ? 'ISO ' + ex.iso : '', ex.focal ? Math.round(ex.focal) + ' mm' : '', ex.fnumber ? 'ƒ/' + (+ex.fnumber).toFixed(1) : '', ex.exposure ? U.fmtShutter(ex.exposure) : '', `clip ${(lo * 100).toFixed(1)}% / ${(hi * 100).toFixed(1)}%`].filter(Boolean).join('   ');
}
function drawNavigator() {
  const cv = $('#navCv'); const p = ph(); if (!cv || !p) return;
  const im = new Image(); im.onload = () => {
    const g = cv.getContext('2d'), W = cv.width; const H = Math.round(W * im.height / im.width); if (cv.height !== H) cv.height = H;
    g.drawImage(im, 0, 0, W, H);
    if (S.zoom && lay) { const [u0, v0, u1, v1] = lay.view; g.strokeStyle = '#e4a54c'; g.lineWidth = 3; g.strokeRect(u0 * W, v0 * H, (u1 - u0) * W, (v1 - v0) * H); }
  }; im.src = p.thumb;
  cv.onclick = (e) => { const r = cv.getBoundingClientRect(); S.center = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; if (!S.zoom) S.zoom = 1; layoutStage(); requestRender(); renderEditLeft(); };
}

/* ============================== overlay & pointer tools ============================== */
function evToOut(e) {
  const r = $('#ov').getBoundingClientRect(); const [u0, v0, u1, v1] = lay.view;
  return [u0 + (e.clientX - r.left) / r.width * (u1 - u0), v0 + (e.clientY - r.top) / r.height * (v1 - v0), e.clientX - r.left, e.clientY - r.top];
}
function outToPx(u, v) { const [u0, v0, u1, v1] = lay.view; return [(u - u0) / (u1 - u0) * lay.w, (v - v0) / (v1 - v0) * lay.h]; }
function srcToPx(su, sv) { const o = Engine.srcToOut(lay.G, su, sv); return outToPx(o[0], o[1]); }
const As = () => img.w / img.h;
let hover = null, touchTol = false;
function drawOverlay() {
  const ov = $('#ov'); if (!ov || !lay) return;
  const g = ov.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ov.width, ov.height);
  g.setTransform(ov.width / lay.w, 0, 0, ov.height / lay.h, 0, 0);
  const p = P(); if (!p) return;
  if (lay.cropMode) { drawCropOverlay(g); return; }
  if (S.compare === 'split') {
    const x = S.split * lay.w; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, lay.h); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, lay.h / 2, 9, 0, Math.PI * 2); g.fill();
    g.font = '600 11px Instrument Sans, sans-serif'; g.fillStyle = 'rgba(10,10,12,.75)';
    g.fillRect(x - 64, 10, 56, 20); g.fillRect(x + 8, 10, 50, 20); g.fillStyle = '#fff'; g.fillText('BEFORE', x - 58, 24); g.fillText('AFTER', x + 14, 24);
  }
  const ring = (su, sv, r, dash, col, w) => {
    g.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2; const [x, y] = srcToPx(su + Math.cos(a) * r / As(), sv + Math.sin(a) * r); k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.setLineDash(dash ? [5, 4] : []); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = w + 2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.setLineDash([]);
  };
  const pin = (x, y, on) => { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = on ? '#e4a54c' : '#fff'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 2; g.stroke(); };
  if (S.tool === 'heal') {
    p.spots.forEach((s, i) => {
      const sel = i === S.selSpot, col = sel ? '#e4a54c' : 'rgba(255,255,255,.85)';
      ring(s.tx, s.ty, s.r, false, col, sel ? 2 : 1.2);
      if (s.mode !== 'redeye') { ring(s.sx, s.sy, s.r, true, col, sel ? 2 : 1.2); const a = srcToPx(s.tx, s.ty), b = srcToPx(s.sx, s.sy); g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    });
    if (hover && hover.src) ring(hover.src[0], hover.src[1], S.heal.size / 100, false, 'rgba(255,255,255,.5)', 1);
  }
  if (S.tool === 'mask') {
    const m = p.masks[S.selMask];
    if (m && m.type === 'linear' && m.geom) {
      const a = srcToPx(m.geom.x0, m.geom.y0), b = srcToPx(m.geom.x1, m.geom.y1);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 2000, ny = dx / L * 2000;
      g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1;
      for (const q of [a, b]) { g.beginPath(); g.moveTo(q[0] - nx, q[1] - ny); g.lineTo(q[0] + nx, q[1] + ny); g.stroke(); }
      g.setLineDash([]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); pin(a[0], a[1], true); pin(b[0], b[1], false);
    }
    if (m && m.type === 'radial' && m.geom) {
      const G0 = m.geom, ang = G0.angle * Math.PI / 180;
      const pt = (ex, ey) => { const x = ex * Math.cos(ang) - ey * Math.sin(ang), y = ex * Math.sin(ang) + ey * Math.cos(ang); return srcToPx(G0.cx + x / As(), G0.cy + y); };
      for (const f of [1, 1 - G0.feather / 100]) { g.beginPath(); for (let k = 0; k <= 64; k++) { const a = k / 64 * Math.PI * 2; const [x, y] = pt(Math.cos(a) * G0.rx * f, Math.sin(a) * G0.ry * f); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.setLineDash(f < 1 ? [5, 4] : []); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke(); }
      g.setLineDash([]); const c = srcToPx(G0.cx, G0.cy); pin(c[0], c[1], true); const ex = pt(G0.rx, 0), ey = pt(0, G0.ry); pin(ex[0], ex[1], false); pin(ey[0], ey[1], false);
    }
    if (m && m.type === 'brush' && hover && hover.src) {
      const r = S.brush.size / 200; ring(hover.src[0], hover.src[1], r, false, (S.brush.erase || hover.alt) ? '#ff8a8a' : '#fff', 1.2);
      ring(hover.src[0], hover.src[1], r * (1 - S.brush.feather / 100), true, 'rgba(255,255,255,.6)', 1);
    }
  }
}
function drawCropOverlay(g) {
  const c = P().crop || (() => { const F = Engine.frame(img, P()); return { cx: 0, cy: 0, hw: F.hw, hh: F.hh, angle: 0 }; })();
  const hw0 = lay.G.crop[2], hh0 = lay.G.crop[3];
  const toPx = (qx, qy) => outToPx((qx / hw0 + 1) / 2, (qy / hh0 + 1) / 2);
  const a = c.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const L2Q = (lx, ly) => [c.cx + ca * lx - sa * ly, c.cy + sa * lx + ca * ly];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toPx(...L2Q(sx * c.hw, sy * c.hh)));
  g.fillStyle = 'rgba(8,8,10,0.62)'; g.beginPath(); g.rect(0, 0, lay.w, lay.h); g.moveTo(...corners[0]); for (let i = 3; i >= 0; i--) g.lineTo(...corners[i]); g.closePath(); g.fill('evenodd');
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
  for (const t of [-1 / 3, 1 / 3]) {
    const A = toPx(...L2Q(t * c.hw * 1, -c.hh)), B = toPx(...L2Q(t * c.hw * 1, c.hh)); g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke();
    const C = toPx(...L2Q(-c.hw, t * c.hh)), D = toPx(...L2Q(c.hw, t * c.hh)); g.beginPath(); g.moveTo(...C); g.lineTo(...D); g.stroke();
  }
  g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...corners[0]); corners.slice(1).forEach(q => g.lineTo(...q)); g.closePath(); g.stroke();
  g.fillStyle = '#fff'; corners.forEach(([x, y]) => g.fillRect(x - 5, y - 5, 10, 10));
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([sx, sy]) => { const [x, y] = toPx(...L2Q(sx * c.hw, sy * c.hh)); g.fillRect(x - 4, y - 4, 8, 8); });
}
function updateHint() {
  const wrap = $('#stagewrap'); if (!wrap) return; let el = wrap.querySelector('.hint');
  const t = S.picking === 'maskColor' ? 'Click the color to select' : S.tool === 'wb' ? 'Click something that should be neutral grey or white' : S.tool === 'mask' && S.maskCreate ? (S.maskCreate === 'linear' ? 'Drag to draw a linear gradient' : 'Drag from the centre to draw a radial gradient') :
    S.tool === 'mask' && P().masks[S.selMask] && P().masks[S.selMask].type === 'brush' ? 'Paint the area to adjust · Alt to erase' : S.tool === 'heal' ? (S.heal.mode === 'redeye' ? 'Click each pupil' : 'Click a spot to remove it') : S.tool === 'crop' ? 'Drag to crop · drag outside to rotate · Enter when done' : '';
  if (!t) { el && el.remove(); return; }
  if (!el) { el = h('div', { class: 'hint' }); wrap.appendChild(el); } el.textContent = t;
}
function setTool(t) {
  if (S.tool === 'crop' && t !== 'crop') commitIfChanged('Crop');
  S.tool = t; S.maskCreate = null; S.picking = null; hover = null;
  if (t && isMobile() && t !== 'wb') { S.mtab = 'tools'; renderTabbar(); }
  if (t === 'mask' && S.selMask < 0 && P().masks.length) S.selMask = 0;
  renderEditRight(); layoutStage(); requestRender(); updateHint();
}
function commitIfChanged(label) { const p = ph(); if (!p) return; if (JSON.stringify(p.history[p.hIndex].edits) !== JSON.stringify(p.edits)) commit(label); }
function syncSlider(id) { const el = document.getElementById(id); el && el.closest('.sl') && el.closest('.sl').sync(); }

function setupStagePointer(wrap) {
  let drag = null, space = false;
  addEventListener('keydown', (e) => { if (e.code === 'Space' && !isTyping(e)) { space = true; if (S.view === 'edit') e.preventDefault(); } });
  addEventListener('keyup', (e) => { if (e.code === 'Space') space = false; });
  wrap.addEventListener('wheel', (e) => {
    if (!lay || !(e.ctrlKey || e.metaKey || !S.tool)) return; e.preventDefault();
    const steps = [0, 0.25, 0.5, 1, 2, 4]; const [u, v] = evToOut(e);
    let i = steps.indexOf(S.zoom); if (i < 0) i = 0; i = U.clamp(i + (e.deltaY < 0 ? 1 : -1), 0, steps.length - 1);
    if (steps[i] === S.zoom) return; S.zoom = steps[i]; S.center = [u, v]; layoutStage(); requestRender(); renderEditLeft();
  }, { passive: false });
  wrap.addEventListener('pointermove', (e) => {
    if (drag || !lay) return;
    if (S.tool === 'heal' || (S.tool === 'mask' && P().masks[S.selMask] && P().masks[S.selMask].type === 'brush')) {
      const [u, v] = evToOut(e); hover = { src: Engine.outToSrc(lay.G, u, v), alt: e.altKey }; drawOverlay();
    }
  });
  wrap.addEventListener('pointerleave', () => { if (!drag) { hover = null; drawOverlay(); } });
  const pts = new Map(); let pinch = null, lastTap = null, pending = null, afterPinch = false;
  const pinchInfo = () => { const r = wrap.getBoundingClientRect(); const a = [...pts.values()]; return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2 - r.left, my: (a[0].y + a[1].y) / 2 - r.top }; };
  wrap.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); }, true);
  wrap.addEventListener('pointerdown', (e) => {
    if (pts.size === 2 && lay) {
      pending = null; afterPinch = true;
      if (drag) { clearTimeout(drag.hold); if (drag.swipe) slideStage(0, true); if (drag.holding) { S.compareHold = false; hideBadge(); } }
      if (drag && drag.undo) drag.undo();
      drag = null; const pi = pinchInfo(); const ov = $('#ov').getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      const [u0, v0, u1, v1] = lay.view;
      pinch = { ...pi, z0: S.zoom || (lay.w / lay.G.outW * lay.dpr), fit: lay.w / lay.G.outW * lay.dpr * (S.zoom ? 0 : 1) || null,
        cu: u0 + (pi.mx - (ov.left - wr.left)) / ov.width * (u1 - u0), cv: v0 + (pi.my - (ov.top - wr.top)) / ov.height * (v1 - v0) };
      if (!pinch.fit) { const G = lay.G; pinch.fit = Math.min((wrap.clientWidth - 32) / G.outW, (wrap.clientHeight - 32) / G.outH) * lay.dpr; }
      requestRender(); return;
    }
    if (pts.size > 2) return;
    if (!lay || !img || e.button > 0) return;
    const [u, v, px, py] = evToOut(e); const p = P();
    const inside = px >= 0 && py >= 0 && px <= lay.w && py <= lay.h;
    wrap.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY, u, v, center: S.center.slice(), moved: false };
    if (space || (!S.tool && !S.picking && S.compare !== 'split') || e.button === 1) {
      drag = { kind: 'pan', start, touch: e.pointerType !== 'mouse' };
      if (drag.touch && !S.tool) drag.hold = setTimeout(() => { if (drag && !drag.start.moved) { drag.holding = true; S.compareHold = true; buzz(8); showBadge('Original'); requestRender(); } }, 380);
      return;
    }
    if (S.compare === 'split' && Math.abs(px - S.split * lay.w) < 14 && !S.tool) { drag = { kind: 'split', start }; return; }
    if (!inside && S.tool !== 'crop') { drag = { kind: 'pan', start }; return; }
    touchTol = e.pointerType !== 'mouse';
    // On touch, wait until the finger clearly taps or drags: a second finger arriving first means pinch/pan, not an edit.
    if (e.pointerType !== 'mouse') { if (!afterPinch) pending = { u, v, px, py, start, ev: { altKey: e.altKey, shiftKey: e.shiftKey }, id: e.pointerId }; return; }
    drag = runTool(u, v, px, py, start, e);
  });
  function runTool(u, v, px, py, start, ev) {
    if (S.picking === 'maskColor') { pickMaskColor(u, v); updateHint(); return null; }
    if (S.tool === 'wb') { pickWB(u, v); setTool(null); return null; }
    if (S.tool === 'crop') return cropDown(u, v, start);
    const s = Engine.outToSrc(lay.G, u, v);
    if (S.tool === 'heal') return healDown(s, start);
    if (S.tool === 'mask') return maskDown(s, px, py, start, ev);
    return { kind: 'pan', start };
  }
  wrap.addEventListener('pointermove', (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pending && e.pointerId === pending.id && !pinch) {
      if (Math.hypot(e.clientX - pending.start.x, e.clientY - pending.start.y) < 10) return;
      const p0 = pending; pending = null; drag = runTool(p0.u, p0.v, p0.px, p0.py, p0.start, p0.ev);
      if (drag) drag.start.moved = true;
    }
    if (pinch && pts.size >= 2) {
      const pi = pinchInfo(); let z = pinch.z0 * pi.d / Math.max(pinch.d, 1);
      if (z <= pinch.fit * 1.03) { S.zoom = 0; S.center = [0.5, 0.5]; }
      else {
        S.zoom = Math.min(z, 8); const G = lay.G, zc = S.zoom / lay.dpr, sw = wrap.clientWidth, sh = wrap.clientHeight;
        const cw = Math.min(sw, G.outW * zc), ch = Math.min(sh, G.outH * zc);
        S.center = [pinch.cu - (pi.mx - (sw - cw) / 2 - cw / 2) / (G.outW * zc), pinch.cv - (pi.my - (sh - ch) / 2 - ch / 2) / (G.outH * zc)];
      }
      requestRender(); return;
    }
    if (!drag) return;
    const [u, v, px, py] = evToOut(e); const st = drag.start;
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 3) st.moved = true;
    if (drag.kind === 'pan') {
      if (st.moved) clearTimeout(drag.hold);
      if (drag.holding) return;
      if (!S.zoom) {
        if (!drag.touch || S.tool) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!drag.swipe && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) drag.swipe = true;
        if (drag.swipe) { const list = visiblePhotos(), i = list.findIndex(x => x.id === S.cur); const edge = (dx > 0 && i <= 0) || (dx < 0 && i >= list.length - 1); slideStage(edge ? dx * 0.3 : dx, false); }
        return;
      }
      const [u0, v0, u1, v1] = lay.view;
      S.center = [st.center[0] - (e.clientX - st.x) / lay.w * (u1 - u0), st.center[1] - (e.clientY - st.y) / lay.h * (v1 - v0)];
      requestRender(); return;
    }
    if (drag.kind === 'split') { S.split = U.clamp(px / lay.w, 0.02, 0.98); requestRender(); return; }
    drag.move && drag.move(u, v, px, py, e);
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (!pts.size) afterPinch = false;
    if (pinch) { if (pts.size < 2) { pinch = null; drawNavigator(); renderEditLeft(); } drag = null; pending = null; return; }
    if (pending && e.pointerId === pending.id) {
      const p0 = pending; pending = null;
      if (e.type !== 'pointerup') return;
      drag = runTool(p0.u, p0.v, p0.px, p0.py, p0.start, p0.ev);
    }
    if (!drag) return; const d = drag; drag = null;
    clearTimeout(d.hold);
    if (d.holding) { S.compareHold = false; hideBadge(); requestRender(); return; }
    if (d.swipe) {
      const dx = e.clientX - d.start.x, list = visiblePhotos(), i = list.findIndex(x => x.id === S.cur), w = $('#stagewrap').clientWidth;
      const n = Math.abs(dx) > Math.min(110, w * 0.22) ? list[i + (dx < 0 ? 1 : -1)] : null;
      if (n && e.type === 'pointerup') { slideStage(dx < 0 ? -w : w, true); setTimeout(() => { swipeIn = dx < 0 ? 1 : -1; selectPhoto(n.id, null, list); }, 200); }
      else slideStage(0, true);
      return;
    }
    if (d.kind === 'pan' && !d.start.moved && !S.tool) {
      if (e.pointerType !== 'mouse') {
        const now = performance.now();
        if (!(lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30)) { lastTap = { t: now, x: e.clientX, y: e.clientY }; return; }
        lastTap = null;
      }
      if (S.zoom) animateZoom(0); else animateZoom(1, [d.start.u, d.start.v]);
      return;
    }
    if (d.kind === 'pan' && S.zoom) drawNavigator();
    d.up && d.up();
  };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
}
function cropDown(u, v, start) {
  const c = ensureCrop(); const c0 = U.clone(c);
  const hw0 = lay.G.crop[2], hh0 = lay.G.crop[3];
  const toQ = (uu, vv) => [(2 * uu - 1) * hw0, (2 * vv - 1) * hh0];
  const a = c0.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const toL = (q) => { const dx = q[0] - c0.cx, dy = q[1] - c0.cy; return [ca * dx + sa * dy, -sa * dx + ca * dy]; };
  const L0 = toL(toQ(u, v));
  const tol = (touchTol ? 30 : 16) / lay.w * 2 * hw0 * (lay.view[2] - lay.view[0]);
  const nx = Math.abs(Math.abs(L0[0]) - c0.hw) < tol, ny = Math.abs(Math.abs(L0[1]) - c0.hh) < tol;
  const inX = Math.abs(L0[0]) < c0.hw + tol, inY = Math.abs(L0[1]) < c0.hh + tol;
  let mode;
  if (nx && ny) mode = 'corner'; else if (nx && inY) mode = 'ex'; else if (ny && inX) mode = 'ey'; else if (Math.abs(L0[0]) < c0.hw && Math.abs(L0[1]) < c0.hh) mode = 'move'; else mode = 'rotate';
  const sx = Math.sign(L0[0]) || 1, sy = Math.sign(L0[1]) || 1; const r = cropRatio(); const min = 0.02;
  return {
    kind: 'crop', start,
    move(uu, vv) {
      const Q = toQ(uu, vv), L = toL(Q);
      if (mode === 'move') { c.cx = c0.cx + Q[0] - toQ(start.u, start.v)[0]; c.cy = c0.cy + Q[1] - toQ(start.u, start.v)[1]; c.hw = c0.hw; c.hh = c0.hh; }
      else if (mode === 'rotate') { const d = Math.atan2(L[1], L[0]) - Math.atan2(L0[1], L0[0]); c.angle = U.clamp(c0.angle + d * 180 / Math.PI, -45, 45); c.hw = c0.hw; c.hh = c0.hh; c.cx = c0.cx; c.cy = c0.cy; syncSlider('s-cropAngle'); }
      else {
        let ax = -sx * c0.hw, ay = -sy * c0.hh; let hw = c0.hw, hh = c0.hh, lx = 0, ly = 0;
        if (mode === 'corner' || mode === 'ex') hw = Math.max(min, (L[0] - ax) * sx / 2);
        if (mode === 'corner' || mode === 'ey') hh = Math.max(min, (L[1] - ay) * sy / 2);
        if (r) { if (mode === 'ex') hh = hw / r; else if (mode === 'ey') hw = hh * r; else if (hw / hh > r) hh = hw / r; else hw = hh * r; }
        lx = mode === 'ey' ? 0 : ax + sx * hw; ly = mode === 'ex' ? 0 : ay + sy * hh;
        c.hw = hw; c.hh = hh; c.cx = c0.cx + ca * lx - sa * ly; c.cy = c0.cy + sa * lx + ca * ly;
      }
      constrainCrop(c); requestRender();
    },
    up() { commit('Crop'); updateStagebar(); }
  };
}
function healDown(s, start) {
  const p = P(); const A = As();
  const dist = (x, y, r) => Math.hypot((s[0] - x) * A, s[1] - y) < r;
  for (let i = p.spots.length - 1; i >= 0; i--) {
    const sp = p.spots[i];
    if (sp.mode !== 'redeye' && dist(sp.sx, sp.sy, sp.r)) { S.selSpot = i; renderEditRight(); return spotDrag(sp, 'source', s, start); }
    if (dist(sp.tx, sp.ty, sp.r)) { S.selSpot = i; renderEditRight(); return spotDrag(sp, 'both', s, start); }
  }
  if (p.spots.length >= 24) { toast('Up to 24 healing spots per photo.'); return null; }
  const r = S.heal.size / 100;
  const sp = { tx: s[0], ty: s[1], sx: s[0], sy: s[1], r, feather: S.heal.feather, opacity: S.heal.opacity, mode: S.heal.mode };
  if (sp.mode !== 'redeye') {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    for (const [dx, dy] of dirs) { const x = s[0] + dx * r * 2.4 / A, y = s[1] + dy * r * 2.4; if (x - r / A > 0 && x + r / A < 1 && y - r > 0 && y + r < 1) { sp.sx = x; sp.sy = y; break; } }
  }
  p.spots.push(sp); S.selSpot = p.spots.length - 1; requestRender(); renderEditRight();
  return spotDrag(sp, sp.mode === 'redeye' ? 'none' : 'source', s, start, true);
}
function spotDrag(sp, what, s0, start, created) {
  const o = U.clone(sp);
  return {
    kind: 'spot', start,
    move(u, v) {
      const s = Engine.outToSrc(lay.G, u, v), dx = s[0] - s0[0], dy = s[1] - s0[1];
      if (what === 'source') { sp.sx = o.sx + dx; sp.sy = o.sy + dy; }
      if (what === 'both') { sp.tx = o.tx + dx; sp.ty = o.ty + dy; sp.sx = o.sx + dx; sp.sy = o.sy + dy; }
      requestRender();
    },
    up() { if (created || start.moved) commit(created ? 'Add spot' : 'Move spot'); },
    undo() { const p = P(); if (created) { const i = p.spots.indexOf(sp); if (i >= 0) p.spots.splice(i, 1); S.selSpot = -1; } else Object.assign(sp, o); requestRender(); renderEditRight(); }
  };
}
function maskDown(s, px, py, start, ev) {
  const p = P(); const m = p.masks[S.selMask]; const A = As();
  if (!m) { toast('Add a mask first.'); return null; }
  if (S.maskCreate === 'linear' || (m.type === 'linear' && !m.geom)) {
    m.geom = { x0: s[0], y0: s[1], x1: s[0], y1: s[1] + 0.001 };
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v); m.geom.x1 = q[0]; m.geom.y1 = q[1]; requestRender(); }, up() { S.maskCreate = null; commit('Linear gradient'); renderEditRight(); updateHint(); } };
  }
  if (S.maskCreate === 'radial' || (m.type === 'radial' && !m.geom)) {
    m.geom = { cx: s[0], cy: s[1], rx: 0.05, ry: 0.05, angle: 0, feather: 50 };
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v); m.geom.rx = Math.max(0.01, Math.abs(q[0] - s[0]) * A); m.geom.ry = Math.max(0.01, Math.abs(q[1] - s[1])); if (!ev.shiftKey && false) m.geom.ry = m.geom.rx; requestRender(); }, up() { if (!start.moved) { m.geom.rx = 0.25; m.geom.ry = 0.25; } S.maskCreate = null; commit('Radial gradient'); renderEditRight(); updateHint(); requestRender(); } };
  }
  const near = (su, sv) => { const [x, y] = srcToPx(su, sv); return Math.hypot(x - px, y - py) < (touchTol ? 28 : 14); };
  if (m.type === 'linear') {
    const g0 = U.clone(m.geom); let which = near(g0.x0, g0.y0) ? 'a' : near(g0.x1, g0.y1) ? 'b' : 'both';
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v), dx = q[0] - s[0], dy = q[1] - s[1];
      if (which !== 'b') { m.geom.x0 = g0.x0 + dx; m.geom.y0 = g0.y0 + dy; } if (which !== 'a') { m.geom.x1 = g0.x1 + dx; m.geom.y1 = g0.y1 + dy; } requestRender(); }, up() { if (start.moved) commit('Move gradient'); } };
  }
  if (m.type === 'radial') {
    const g0 = U.clone(m.geom), ang = g0.angle * Math.PI / 180;
    const ptS = (ex, ey) => [g0.cx + (ex * Math.cos(ang) - ey * Math.sin(ang)) / A, g0.cy + ex * Math.sin(ang) + ey * Math.cos(ang)];
    const ex = ptS(g0.rx, 0), ey = ptS(0, g0.ry);
    const which = near(...ex) ? 'rx' : near(...ey) ? 'ry' : 'move';
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v);
      if (which === 'move') { m.geom.cx = g0.cx + q[0] - s[0]; m.geom.cy = g0.cy + q[1] - s[1]; }
      else { const dx = (q[0] - g0.cx) * A, dy = q[1] - g0.cy; const lx = dx * Math.cos(-ang) - dy * Math.sin(-ang), ly = dx * Math.sin(-ang) + dy * Math.cos(-ang); if (which === 'rx') m.geom.rx = Math.max(0.01, Math.abs(lx)); else m.geom.ry = Math.max(0.01, Math.abs(ly)); }
      requestRender(); }, up() { if (start.moved) commit('Adjust radial'); } };
  }
  if (m.type === 'brush') {
    const st = { e: S.brush.erase || ev.altKey, r: S.brush.size / 200, f: S.brush.feather / 100, a: S.brush.flow / 100, pts: [s[0], s[1]] };
    m.strokes.push(st);
    const [bw, bh] = brushSize(img); const ent = maskCanvas(ph().id, m, bw, bh);
    let last = s; const paint = () => { ent.sig = m.strokes.length + ':' + m.strokes.reduce((a, q) => a + q.pts.length, 0); invalidateBrush(); requestRender(); };
    paint();
    return { kind: 'brush', start, move(u, v) {
      const q = Engine.outToSrc(lay.G, u, v); const d = Math.hypot((q[0] - last[0]) * A, q[1] - last[1]); const step = Math.max(st.r * 0.25, 0.001);
      if (d < step) return; const n = Math.floor(d / step); const from = st.pts.length;
      for (let k = 1; k <= n; k++) st.pts.push(last[0] + (q[0] - last[0]) * k / n, last[1] + (q[1] - last[1]) * k / n);
      last = [st.pts[st.pts.length - 2], st.pts[st.pts.length - 1]];
      drawDabs(ent.ctx, st, from, bw, bh); paint(); hover = { src: q, alt: ev.altKey }; },
      up() { commit(st.e ? 'Erase brush' : 'Brush'); },
      undo() { const i = m.strokes.indexOf(st); if (i >= 0) m.strokes.splice(i, 1); brushCanv.delete(ph().id + ':' + m.id); invalidateBrush(); requestRender(); } };
  }
  return null;
}

/* ============================== copy / paste / sync ============================== */
function copyDlg(mode) {
  const p = ph(); if (!p) return;
  const defaultsOn = (g) => !['crop', 'masks', 'spots'].includes(g);
  const checks = Object.keys(GROUPS).map(g => h('label', { class: 'chk' }, h('input', { type: 'checkbox', value: g, checked: defaultsOn(g) }), GROUPS[g][0]));
  const all = h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => checks.forEach(c => c.querySelector('input').checked = true) }, 'Check all'), h('button', { class: 'btn sm', onclick: () => checks.forEach(c => c.querySelector('input').checked = false) }, 'Check none'));
  const others = [...S.sel].filter(id => id !== p.id);
  dialog(mode === 'sync' ? `Sync settings to ${others.length} photo${others.length === 1 ? '' : 's'}` : 'Copy settings', [all, h('div', { class: 'grid2' }, checks)], mode === 'sync' ? 'Sync' : 'Copy', async () => {
    const values = {}; checks.forEach(c => { const cb = c.querySelector('input'); if (cb.checked) GROUPS[cb.value][1].forEach(k => values[k] = U.clone(p.edits[k])); });
    S.clip = { values, from: p.id };
    if (mode === 'sync') await pasteSettings(others); else { toast('Settings copied. Paste them onto other photos with Ctrl+V.'); renderStrip(); }
  });
}
async function pasteSettings(ids) {
  if (!S.clip) { toast('Copy settings from a photo first.'); return; }
  const busy = ids.length > 1 ? showBusy(`Applying settings to ${ids.length} photos…`) : null;
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    for (const [k, v] of Object.entries(S.clip.values)) p.edits[k] = U.clone(v);
    if (S.clip.values.masks) p.edits.masks.forEach(m => m.id = U.uid());
    pushHistoryFor(p, 'Paste settings');
    if (id === S.cur && S.view === 'edit') { invalidateBrush(); renderEditRight(); renderHistory(); requestRender(); }
    await refreshThumb(p);
  }
  busy && busy.remove();
  toast(`Settings applied to ${ids.length} photo${ids.length === 1 ? '' : 's'}.`);
  if (S.view === 'library') renderAll();
}

/* ============================== export ============================== */
function exportDlg() {
  const ids = S.sel.size ? [...S.sel] : (S.cur ? [S.cur] : []);
  if (!ids.length) { toast('Select photos to export.'); return; }
  let prefs = {}; try { prefs = JSON.parse(localStorage.getItem('safelight.export') || '{}'); } catch (e) {}
  const fmt = h('select', { id: 'exFmt' }, [['jpeg', 'JPEG'], ['png', 'PNG'], ['webp', 'WebP']].map(([v, t]) => h('option', { value: v, text: t }))); fmt.value = prefs.fmt || 'jpeg';
  const q = h('input', { type: 'range', id: 'exQ', min: 40, max: 100, value: prefs.q || 90 }); const qo = h('output', { text: (prefs.q || 90) }); q.oninput = () => qo.textContent = q.value;
  const size = h('select', { id: 'exSize' }, [['0', 'Full size'], ['3840', 'Long edge 3840 px'], ['2560', 'Long edge 2560 px'], ['2048', 'Long edge 2048 px'], ['1600', 'Long edge 1600 px'], ['1080', 'Long edge 1080 px']].map(([v, t]) => h('option', { value: v, text: t }))); size.value = prefs.size || '0';
  const name = h('input', { type: 'text', id: 'exName', value: prefs.name || '{name}-edit' });
  const wm = h('input', { type: 'text', id: 'exWm', value: prefs.wm || '', placeholder: 'e.g. © Your Name' });
  const wmPos = h('select', { id: 'exWmPos' }, [['br', 'Bottom right'], ['bl', 'Bottom left'], ['tr', 'Top right'], ['tl', 'Top left'], ['c', 'Centre']].map(([v, t]) => h('option', { value: v, text: t }))); wmPos.value = prefs.wmPos || 'br';
  const wmSize = h('input', { type: 'range', id: 'exWmSize', min: 1, max: 10, step: 0.5, value: prefs.wmSize || 3 });
  const wmOp = h('input', { type: 'range', id: 'exWmOp', min: 10, max: 100, value: prefs.wmOp || 70 });
  const shareBox = canShareFiles() ? h('input', { type: 'checkbox', id: 'exShare', checked: !!prefs.share }) : null;
  const status = h('div', { class: 'empty', style: { padding: 0 }, text: ids.length > 1 ? `${ids.length} photos will be saved together as one .zip file.` : 'One photo will be exported.' });
  const d = dialog(`Export ${ids.length} photo${ids.length === 1 ? '' : 's'}`, [
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Format' }), fmt), h('label', { class: 'field' }, h('span', { text: 'Size' }), size)),
    h('div', { class: 'sl' }, h('label', { for: 'exQ', text: 'Quality' }), q, qo),
    h('label', { class: 'field' }, h('span', { text: 'File name — {name} {seq} {date} {rating}' }), name),
    h('div', { class: 'sub', text: 'Watermark' }),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Text (leave empty for none)' }), wm), h('label', { class: 'field' }, h('span', { text: 'Position' }), wmPos)),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Size' }), wmSize), h('label', { class: 'field' }, h('span', { text: 'Opacity' }), wmOp)),
    shareBox ? h('label', { class: 'chk' }, shareBox, 'Share to another app (Photos, messages, social) instead of saving a file') : null,
    status], 'Export', async () => {
    const o = { fmt: fmt.value, q: +q.value, size: size.value, name: name.value, wm: wm.value, wmPos: wmPos.value, wmSize: +wmSize.value, wmOp: +wmOp.value, share: !!(shareBox && shareBox.checked) };
    try { localStorage.setItem('safelight.export', JSON.stringify(o)); } catch (e) {}
    d.ok.disabled = true; await runExport(ids, o, status); d.ok.disabled = false; return false;
  });
}
async function renderExport(p, o) {
  let hd = null, own = false;
  if (imgFor === p.id && img) hd = img;
  else { const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) throw new Error('unreadable'); hd = engine.loadImage(src); own = true; }
  const G = Engine.geom(hd, p.edits, false);
  let W = G.outW, H = G.outH; const lim = +o.size;
  if (lim && Math.max(W, H) > lim) { const s = lim / Math.max(W, H); W = Math.round(W * s); H = Math.round(H * s); }
  const id = engine.renderPixels(hd, p.edits, W, H, buildBrush(p.edits, hd, own ? 'x' : p.id));
  if (own) engine.freeImage(hd); else requestRender();
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.putImageData(id, 0, 0);
  if (o.wm.trim()) {
    const fs = Math.max(10, Math.round(Math.min(W, H) * o.wmSize / 100)); g.font = `500 ${fs}px "Instrument Sans", sans-serif`; g.fillStyle = `rgba(255,255,255,${o.wmOp / 100})`;
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = fs * 0.15; const tw = g.measureText(o.wm).width, m = fs;
    const pos = { br: [W - tw - m, H - m], bl: [m, H - m], tr: [W - tw - m, m + fs * 0.8], tl: [m, m + fs * 0.8], c: [(W - tw) / 2, H / 2 + fs * 0.35] }[o.wmPos];
    g.fillText(o.wm, pos[0], pos[1]);
  }
  const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[o.fmt];
  return await new Promise(r => c.toBlob(r, mime, o.q / 100));
}
function exportName(p, o, seq) {
  const base = p.name.replace(/\.[^.]+$/, '');
  const d = new Date(p.captureAt); const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const n = (o.name || '{name}').replace(/\{name\}/g, base).replace(/\{seq\}/g, String(seq).padStart(3, '0')).replace(/\{date\}/g, ds).replace(/\{rating\}/g, p.rating).replace(/[\\/:*?"<>|]/g, '_');
  return n + '.' + (o.fmt === 'jpeg' ? 'jpg' : o.fmt);
}
async function runExport(ids, o, status) {
  const files = []; let i = 0;
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue; i++;
    status.textContent = `Rendering ${i} of ${ids.length}: ${p.name}…`; await new Promise(r => setTimeout(r, 30));
    try { const blob = await renderExport(p, o); let nm = exportName(p, o, i); while (files.some(f => f.name === nm)) nm = nm.replace(/(\.[^.]+)$/, '-' + i + '$1'); files.push({ name: nm, blob }); }
    catch (e) { console.error(e); }
  }
  if (!files.length) { status.textContent = 'Nothing could be exported.'; return; }
  const out = files.length === 1 ? files[0] : { name: `safelight-export-${new Date().toISOString().slice(0, 10)}.zip`, blob: await U.zip(files) };
  status.textContent = `Saving ${out.name} (${(out.blob.size / 1048576).toFixed(1)} MB)…`;
  if (o.share && canShareFiles()) {
    try { await navigator.share({ files: files.map(f => new File([f.blob], f.name, { type: f.blob.type })), title: 'Safelight export' }); status.textContent = 'Shared.'; return; }
    catch (e) { if (e && e.name === 'AbortError') { status.textContent = 'Sharing cancelled.'; return; } }
  }
  const r = await saveFile(out.name, out.blob);
  status.textContent = r.ok ? `Saved ${out.name}.` : r.msg;
  if (r.ok) toast(`Exported ${files.length} photo${files.length === 1 ? '' : 's'}.`);
}
const inFrame = (() => { try { return window.top !== window; } catch (e) { return true; } })();
function canShareFiles() {
  if (inFrame || !navigator.canShare) return false;
  try { return navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/jpeg' })], 'x.jpg', { type: 'image/jpeg' })] }); } catch (e) { return false; }
}
async function saveFile(name, blob) {
  const dl = window.claude && window.claude.use ? await Promise.race([window.claude.use('downloads'), new Promise(r => setTimeout(() => r(null), 3000))]) : null;
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); return { ok: true }; }
    catch (e) { return { ok: false, msg: e && e.code === 'declined' ? 'Save cancelled.' : e && e.code === 'too_large' ? 'That file is too large to save here. Try a smaller size.' : `The file could not be saved (${e && e.code || 'error'}).` }; }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  return { ok: true };
}

/* ============================== keyboard ============================== */
function isTyping(e) { const t = e.target; return t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox') || t.tagName === 'SELECT' || t.isContentEditable); }
addEventListener('keydown', (e) => {
  if (isTyping(e) || document.querySelector('.modal')) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  const ids = [...S.sel].length ? [...S.sel] : (S.cur ? [S.cur] : []);
  const onRange = e.target && e.target.type === 'range';
  if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k.toLowerCase() === 'c' && !window.getSelection().toString()) { e.preventDefault(); copyDlg('copy'); return; }
  if (mod && k.toLowerCase() === 'v') { e.preventDefault(); pasteSettings(ids); return; }
  if (mod && k.toLowerCase() === 'e') { e.preventDefault(); exportDlg(); return; }
  if (mod && k.toLowerCase() === 'a' && S.view === 'library') { e.preventDefault(); S.sel = new Set(visiblePhotos().map(p => p.id)); renderAll(); return; }
  if (mod) return;
  if (k === 'g') { setView('library'); return; }
  if (k === 'e' || k === 'd') { setView('edit'); return; }
  if (/^[0-5]$/.test(k)) { setMeta(ids, p => p.rating = +k); if (S.view === 'edit') updateStagebar(); return; }
  if (/^[6-9]$/.test(k)) { const l = ['red', 'yellow', 'green', 'blue'][+k - 6]; setMeta(ids, p => p.label = p.label === l ? null : l); return; }
  if (k === 'p') { setMeta(ids, p => p.flag = 1); return; }
  if (k === 'x') { setMeta(ids, p => p.flag = -1); return; }
  if (k === 'u') { setMeta(ids, p => p.flag = 0); return; }
  if ((k === 'ArrowRight' || k === 'ArrowLeft') && !onRange) {
    const list = visiblePhotos(); const i = list.findIndex(p => p.id === S.cur); const n = list[U.clamp(i + (k === 'ArrowRight' ? 1 : -1), 0, list.length - 1)];
    if (n) { e.preventDefault(); selectPhoto(n.id, null, list); } return;
  }
  if (S.view !== 'edit') { if ((k === 'Delete' || k === 'Backspace') && ids.length) { S.source.kind === 'trash' ? purgeDlg(ids) : trashPhotos(ids); } if (k === 'Enter' && S.cur && S.source.kind !== 'trash') setView('edit'); return; }
  if (k === '\\') { S.compare = S.compare === 'before' ? 'off' : 'before'; updateStagebar(); requestRender(); return; }
  if (k === 'y') { S.compare = S.compare === 'split' ? 'off' : 'split'; updateStagebar(); requestRender(); return; }
  if (k === 'r') { setTool(S.tool === 'crop' ? null : 'crop'); return; }
  if (k === 'q') { setTool(S.tool === 'heal' ? null : 'heal'); return; }
  if (k === 'm') { setTool(S.tool === 'mask' ? null : 'mask'); return; }
  if (k === 'w') { setTool(S.tool === 'wb' ? null : 'wb'); return; }
  if (k === 'j') { toggleClip(); return; }
  if (k === 'o') { S.maskOverlay = !S.maskOverlay; requestRender(); const c = $('#maskOv'); if (c) c.checked = S.maskOverlay; return; }
  if (k === 'z') { S.zoom = S.zoom ? 0 : 1; layoutStage(); requestRender(); renderEditLeft(); return; }
  if (k === 'Escape') { if (S.maskCreate || S.picking) { S.maskCreate = null; S.picking = null; updateHint(); renderEditRight(); } else if (S.tool) setTool(null); return; }
  if (k === 'Enter' && S.tool === 'crop') { setTool(null); return; }
  if ((k === 'Delete' || k === 'Backspace') && S.tool === 'heal' && S.selSpot >= 0) { deleteSpot(); return; }
  if ((k === 'Delete' || k === 'Backspace') && !S.tool && S.cur) { trashPhotos([S.cur]); return; }
  if ((k === 'Delete' || k === 'Backspace') && S.tool === 'mask' && S.selMask >= 0) { P().masks.splice(S.selMask, 1); S.selMask = Math.min(S.selMask, P().masks.length - 1); invalidateBrush(); commit('Delete mask'); renderEditRight(); requestRender(); return; }
});

/* ============================== start ============================== */
async function start() {
  const glc = document.createElement('canvas');
  try { engine = Engine.create(glc); } catch (e) { console.error(e); engine = null; }
  if (!engine) {
    $('#center').append(h('div', { class: 'empty', style: { padding: '40px', textAlign: 'center' }, text: 'Safelight needs WebGL2, which this browser does not provide. Try a current version of Chrome, Edge, Firefox or Safari.' }));
    return;
  }
  const ok = await U.DB.open();
  $('#storeNote').textContent = ok ? 'Library saved in this browser' : 'This browser blocks storage: your library lasts only until you close the page';
  S.photos = (await U.DB.all('photos')).sort((a, b) => a.importedAt - b.importedAt);
  S.photos.forEach(p => { const d = defaults(); for (const k of Object.keys(d)) if (p.edits[k] === undefined) p.edits[k] = d[k]; });
  const expired = S.photos.filter(p => p.deleted && Date.now() - p.deleted > 30 * 864e5).map(p => p.id); if (expired.length) setTimeout(() => purgePhotos(expired), 1500);
  S.collections = await U.DB.all('collections');
  S.userPresets = await U.DB.all('presets');
  for (const l of await U.DB.all('luts')) { try { engine.registerLut(l.id, l.size, l.data instanceof Float32Array ? l.data : new Float32Array(l.data)); S.luts.push({ id: l.id, name: l.name, size: l.size }); } catch (e) { console.error(e); } }
  try { Object.assign(S.filter, JSON.parse(localStorage.getItem('safelight.filter') || '{}')); } catch (e) {}
  const meta = await U.DB.get('meta', 'state');
  if (meta) { S.lastImport = meta.lastImport; }
  $('#mLib').onclick = () => setView('library'); $('#mEdit').onclick = () => setView('edit');
  $('#bImport').onclick = () => $('#fileIn').click();
  $('#fileIn').onchange = (e) => { importFiles(e.target.files); e.target.value = ''; };
  $('#bExport').onclick = exportDlg;
  addEventListener('beforeunload', () => { const p = ph(); if (p) U.DB.put('photos', p); U.DB.put('meta', { id: 'state', lastImport: S.lastImport }); });
  setInterval(() => U.DB.put('meta', { id: 'state', lastImport: S.lastImport }), 10000);
  if (!S.photos.length) {
    renderAll();
    const samples = await U.makeSamples();
    await importFiles(samples.map(s => Object.assign(new File([s.blob], s.name, { type: 'image/jpeg', lastModified: Date.now() }), { exif: s.exif })), { sample: true, keywords: ['sample'] });
    const fruit = S.photos.find(p => /Fruit/.test(p.name)); if (fruit) { fruit.rating = 4; fruit.label = 'yellow'; savePhoto(fruit); }
    const lake = S.photos.find(p => /Lake/.test(p.name)); if (lake) { lake.flag = 1; lake.rating = 5; savePhoto(lake); }
  }
  if (!S.cur && S.photos.length) { S.cur = S.photos[0].id; S.sel = new Set([S.cur]); }
  let v = 'library'; try { v = localStorage.getItem('safelight.view') || 'library'; } catch (e) {}
  setView(v === 'edit' && S.photos.length ? 'edit' : 'library');
}

/* ============================== phone layout & installable app ============================== */
const mq = matchMedia('(max-width: 760px)');
const isMobile = () => mq.matches;
const TAB_ICONS = {
  photos: '<path d="M3 5h14v11H3z"/><path d="M3 13l4-4 3 3 2-2 5 5"/>',
  albums: '<path d="M3 6h5l2 2h7v8H3z"/>',
  info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6.5v.5"/>',
  looks: '<circle cx="7.5" cy="8" r="4"/><circle cx="12.5" cy="8" r="4"/><circle cx="10" cy="12.5" r="4"/>',
  light: '<circle cx="10" cy="10" r="3.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/>',
  color: '<path d="M10 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z"/>',
  effects: '<path d="M3 14l9-9 3 3-9 9H3z"/><path d="M14 2l.7 1.6L16 4l-1.3.6L14 6l-.6-1.4L12 4l1.4-.4z"/>',
  detail: '<circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/>',
  tools: '<path d="M5 2v12h12"/><path d="M2 5h12v12"/>',
  history: '<path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3v3h3M10 7v3l2 2"/>'
};
function renderTabbar() {
  const tb = $('#tabbar'); if (!tb) return;
  document.body.dataset.view = S.view;
  const tabs = S.view === 'library' ? [['photos', 'Photos'], ['albums', 'Albums'], ['info', S.selectMode && S.sel.size > 1 ? `Info (${S.sel.size})` : 'Info']]
    : [['looks', 'Looks'], ['light', 'Light'], ['color', 'Color'], ['effects', 'Effects'], ['detail', 'Optics'], ['tools', 'Tools'], ['history', 'History']];
  if (!tabs.some(t => t[0] === S.mtab)) S.mtab = S.view === 'library' ? 'photos' : 'light';
  tb.innerHTML = '';
  tabs.forEach(([id, label]) => tb.append(h('button', { class: S.mtab === id ? 'on' : '', 'aria-pressed': S.mtab === id ? 'true' : 'false', onclick: () => { if (S.mtab !== id) { S.mtab = id; renderTabbar(); [$('#left'), $('#right')].forEach(p => p && (p.scrollTop = 0)); } }, html: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[id]}</svg><span>${label}</span>` })));
  applyMobile();
}
function applyMobile() {
  const mob = isMobile();
  document.body.dataset.mtab = mob ? (S.mtab || '') : '';
  document.body.classList.toggle('selmode', mob && !!S.selectMode);
  for (const panel of [$('#left'), $('#right')]) {
    if (!panel) continue;
    let any = false;
    for (const el of panel.children) {
      const t = el.dataset.tab;
      const show = !mob || (t && t === S.mtab);
      if (mob && show && el.hidden) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
      el.hidden = !show; if (show) any = true;
    }
    panel.hidden = mob && !any;
  }
  if (mob && S.view === 'edit') requestAnimationFrame(() => { layoutStage(); requestRender(); });
}
mq.addEventListener('change', () => { if (!isMobile()) { S.selectMode = false; } renderAll(); });

let installEvt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('#bInstall') && $('#bInstall').classList.add('show'); });
addEventListener('appinstalled', () => { installEvt = null; $('#bInstall') && $('#bInstall').classList.remove('show'); toast('Safelight is installed.'); });
function setupInstall() {
  const btn = $('#bInstall'); if (!btn) return;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let inFrame = false; try { inFrame = window.top !== window; } catch (e) { inFrame = true; }
  if (!standalone && ios && !inFrame) btn.classList.add('show');
  btn.onclick = async () => {
    if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; btn.classList.remove('show'); return; }
    dialog('Install Safelight', [h('p', { style: { margin: 0, lineHeight: 1.6 } }, 'On iPhone or iPad: tap the Share button in Safari, then ', h('b', {}, 'Add to Home Screen'), '. Safelight then opens full screen like an app and works offline.'),
      h('p', { style: { margin: 0, lineHeight: 1.6, color: 'var(--muted)' } }, 'On Android: open the browser menu and choose Install app or Add to Home screen.')], null, null, { cancel: 'Close' });
  };
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !inFrame) navigator.serviceWorker.register('sw.js').catch(() => {});
}
setupInstall();

/* ============================== motion helpers ============================== */
let swipeIn = 0, zoomAnim = 0;
function slideStage(dx, animate) {
  for (const c of [engine.gl.canvas, $('#ov')]) {
    if (!c) continue;
    c.classList.toggle('swiping', !animate);
    c.style.transition = animate ? 'transform .26s cubic-bezier(.2,.8,.2,1), opacity .22s ease' : 'none';
    c.style.transform = dx ? `translateX(${dx}px)` : '';
  }
}
function showBadge(text) { const w = $('#stagewrap'); if (!w) return; hideBadge(); w.appendChild(h('div', { class: 'badge-before enter', id: 'cmpBadge', style: { left: '50%', transform: 'translateX(-50%)' }, text })); }
function hideBadge() { const b = $('#cmpBadge'); b && b.remove(); }
function fitZoom() { if (!lay) return 1; const G = lay.G, w = $('#stagewrap'); return Math.min((w.clientWidth - 32) / G.outW, (w.clientHeight - 32) / G.outH) * lay.dpr; }
function animateZoom(target, center) {
  cancelAnimationFrame(zoomAnim);
  const z0 = S.zoom || fitZoom(), z1 = target || fitZoom(), c0 = S.zoom ? S.center.slice() : [0.5, 0.5], c1 = target ? (center || S.center) : [0.5, 0.5];
  const t0 = performance.now(), D = 280;
  const stepf = (now) => {
    const t = Math.min(1, (now - t0) / D), k = ease(t);
    S.zoom = z0 + (z1 - z0) * k; S.center = [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k];
    if (t < 1) { S.interacting = true; requestRender(); zoomAnim = requestAnimationFrame(stepf); }
    else { S.zoom = target; S.center = c1.slice(); S.interacting = false; requestRender(); renderEditLeft(); }
  };
  zoomAnim = requestAnimationFrame(stepf);
}
function fadeInStage() {
  const c = engine && engine.gl.canvas; if (!c) return;
  if (swipeIn) {
    const w = ($('#stagewrap') || {}).clientWidth || 300, from = swipeIn * w * 0.35; swipeIn = 0;
    slideStage(from, false); c.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { slideStage(0, true); c.style.opacity = '1'; }));
  } else { c.style.transition = 'opacity .22s ease'; c.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { c.style.opacity = '1'; })); }
}
/* resizable sheet on phones */
(function setupGrab() {
  const g = $('#grab'); if (!g) return;
  let h0 = null; try { h0 = +localStorage.getItem('safelight.sheet') || null; } catch (e) {}
  const setH = (px) => { const vh = innerHeight; px = U.clamp(px, vh * 0.16, vh * 0.72); document.documentElement.style.setProperty('--sheet-h', px + 'px'); return px; };
  if (h0) setH(h0);
  let st = null;
  g.addEventListener('pointerdown', (e) => { const panel = [$('#left'), $('#right')].find(p => p && !p.hidden); st = { y: e.clientY, h: panel ? panel.getBoundingClientRect().height : innerHeight * 0.42, t: performance.now() }; g.setPointerCapture(e.pointerId); $('#app').classList.add('resizing'); });
  g.addEventListener('pointermove', (e) => { if (!st) return; setH(st.h - (e.clientY - st.y)); layoutStage(); requestRender(); });
  const up = (e) => {
    if (!st) return; const s0 = st; st = null; $('#app').classList.remove('resizing');
    let hh = s0.h - (e.clientY - s0.y);
    if (Math.abs(e.clientY - s0.y) < 6 && performance.now() - s0.t < 300) hh = s0.h > innerHeight * 0.3 ? innerHeight * 0.2 : innerHeight * 0.45;
    hh = setH(hh); try { localStorage.setItem('safelight.sheet', String(Math.round(hh))); } catch (er) {}
    layoutStage(); requestRender();
  };
  g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  g.addEventListener('keydown', (e) => { const panel = [$('#left'), $('#right')].find(p => p && !p.hidden); if (!panel) return; const cur = panel.getBoundingClientRect().height; if (e.key === 'ArrowUp') setH(cur + 40); else if (e.key === 'ArrowDown') setH(cur - 40); else return; e.preventDefault(); layoutStage(); requestRender(); });
})();
start();
