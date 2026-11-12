// Line icons (24px grid, drawn for this site). Used via the `icon` filter.
const I = {
  shield: '<path d="M12 3.2 19 6v5.3c0 4.3-2.9 8-7 9.5-4.1-1.5-7-5.2-7-9.5V6l7-2.8Z"/><path d="M12 15.6s-3.2-1.9-3.2-4.2a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2.3-3.2 4.2-3.2 4.2Z"/>',
  sprout: '<path d="M12 21v-8.5"/><path d="M12 12.5c0-4.1 3-7.2 7.3-7.2 0 4.1-3.1 7.2-7.3 7.2Z"/><path d="M12 15.2c0-3.2-2.5-5.6-6.2-5.6 0 3.2 2.6 5.6 6.2 5.6Z"/><path d="M8 21h8"/>',
  dawn: '<path d="M2.5 18.5h19"/><path d="M6.2 18.5a5.8 5.8 0 0 1 11.6 0"/><path d="M12 4.5v3"/><path d="m5.3 7.8 2 2"/><path d="m18.7 7.8-2 2"/><path d="M6 21.5h12"/>',
  book: '<path d="M3 5.6c2.6-1 6-1 9 1 3-2 6.4-2 9-1v13.2c-2.6-1-6-1-9 1-3-2-6.4-2-9-1Z"/><path d="M12 6.6v13.2"/>',
  people: '<circle cx="9" cy="7.5" r="3.2"/><path d="M2.8 20.5c0-3.5 2.8-6.3 6.2-6.3s6.2 2.8 6.2 6.3"/><path d="M16 4.6a3 3 0 0 1 0 5.8"/><path d="M17.6 14.4c2.2.6 3.6 2.9 3.6 5.6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M8 10.5h8"/><path d="M4.5 13.5c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  message: '<path d="M4 5.5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4.5 3.5V17.5H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z"/><path d="M7.5 10.5h9"/><path d="M7.5 13.5h5.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
  play: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
};

// Resource "Small label" -> icon
const TYPE_ICONS = [
  [/book/i, "book"], [/podcast|audio|radio/i, "mic"], [/youtube|video|watch/i, "play"],
  [/filter|accountab/i, "lock"], [/web|site/i, "globe"],
];

export const iconNames = Object.keys(I);
export function icon(name, size = 24) {
  const body = I[name];
  if (!body) return "";
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
export function typeIcon(type, size = 14) {
  const hit = TYPE_ICONS.find(([re]) => re.test(type || ""));
  return hit ? icon(hit[1], size) : "";
}
