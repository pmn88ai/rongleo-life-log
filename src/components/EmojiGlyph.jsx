// Emoji glyphs are drawn by the OS/browser color-emoji font, not text you
// can `color:` — the only way to recolor one without swapping it for a
// generic icon (forbidden, spec §21/§34) is a CSS filter on the glyph
// itself. Keyed by character so every place an emoji renders (tile, row,
// detail, stat card, modal title) picks up the override automatically.
const COLOR_OVERRIDES = {
  '💩': 'grayscale(1) sepia(1) hue-rotate(280deg) saturate(6) brightness(1.1)',
};

export function EmojiGlyph({ children, className }) {
  const filter = COLOR_OVERRIDES[children];
  return (
    <span className={className} style={filter ? { filter } : undefined}>
      {children}
    </span>
  );
}
