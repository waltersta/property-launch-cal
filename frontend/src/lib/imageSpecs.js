/** Guidance shown in admin — matches layout in SchedulePage + index.css */

export const BUILTIN_HEADER_PATH = '/header.png'

export const HERO_IMAGE_SPEC = {
  title: 'Hero background',
  summary: 'Full-width photo behind the property name and tagline (dark overlay applied).',
  specs: [
    'Size: at least 1920 × 1080 px; 2400 × 1350 px (16∶9) is ideal for retina displays.',
    'Orientation: landscape — the image is cropped with “cover”, centered.',
    'Subject: property exterior or architecture; keep the focal point near the center.',
    'Format: JPG or WebP; avoid tiny or heavily compressed files.',
    'Tip: busy skies or dark foliage still read well because white text sits on a dark gradient.',
  ],
}

export const HEADER_IMAGE_SPEC = {
  title: 'Header banner',
  summary: 'Site-wide strip above the hero on every transaction (logo or brand bar). Stored once for the whole app.',
  specs: [
    'Size: 1024 × 76 px (13.5∶1 wide banner). Use 2048 × 152 px for sharper results on large screens.',
    'Orientation: very wide horizontal strip — not a square or portrait photo.',
    'Format: PNG with transparency for logos, or JPG for a flat photo banner.',
    'Content: brokerage logo, team mark, or simple brand bar; avoid small text (it will not scale up).',
    `Built-in default: ${BUILTIN_HEADER_PATH} (static file in the app, not in the database).`,
    'Clearing the field and saving restores that default.',
  ],
}
