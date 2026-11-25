import type { WidgetTheme } from './types';

export interface ResolvedWidgetTheme {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  header_background: string;
  header_text_color: string;
  user_bubble_bg: string;
  user_bubble_text: string;
  agent_bubble_bg: string;
  agent_bubble_text: string;
  border_radius: string;
  font_family: string;
  theme_mode: 'light' | 'dark' | 'auto';
}

export interface ResolveOptions {
 
  prefersDark?: boolean;
}

type RGB = [number, number, number];
interface OKLCH {
  L: number;
  C: number;
  h: number;
}

const AA = 4.5;
const AA_UI = 3.0; 
const DEFAULT_PRIMARY = '#4F46E5';
const INK = '#0F172A'; 
const WHITE = '#FFFFFF';
const BLACK = '#000000';

const DARK_CROSSOVER_LUM = 0.179;
const DEFAULT_FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));




export function parseHex(input?: string | null): RGB | null {
  if (!input) return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function hexToRgb(hex: string): RGB {
  return parseHex(hex) ?? [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function normalizeHex(input: string | null | undefined, fallback: string): string {
  const rgb = parseHex(input);
  return rgb ? rgbToHex(...rgb) : fallback;
}

const override = (v?: string | null): string | undefined => {
  const rgb = parseHex(v);
  return rgb ? rgbToHex(...rgb) : undefined;
};


export function getRelativeLuminance(r: number, g: number, b: number): number {
  const lin = (val: number) => {
    const v = val / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function getContrastRatio(lum1: number, lum2: number): number {
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

export function contrastBetween(hexA: string, hexB: string): number {
  return getContrastRatio(
    getRelativeLuminance(...hexToRgb(hexA)),
    getRelativeLuminance(...hexToRgb(hexB)),
  );
}


export function getContrastColor(bgHex: string, darkColor = INK, lightColor = WHITE): string {
  const light = contrastBetween(bgHex, lightColor);
  const dark = contrastBetween(bgHex, darkColor);
  if (Math.max(light, dark) >= AA) return light >= dark ? lightColor : darkColor;
  return contrastBetween(bgHex, WHITE) >= contrastBetween(bgHex, BLACK) ? WHITE : BLACK;
}


export function getBrandContrastColor(bgHex: string, darkColor = INK, lightColor = WHITE): string {
  const { L, C } = hexToOklch(bgHex);
  const whiteRatio = contrastBetween(bgHex, lightColor);

  
  if (whiteRatio >= AA || (L <= 0.73 && C >= 0.12 && whiteRatio >= 2.7)) {
    return lightColor;
  }
  return getContrastColor(bgHex, darkColor, lightColor);
}



const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const fromLinear = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
};

export function hexToOklch(hex: string): OKLCH {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}


export function oklchToHex(L: number, C: number, h: number): string {
  const Lc = clamp(L, 0, 1);
  let chroma = C;
  let rgb: RGB = [0, 0, 0];
  for (let i = 0; i < 30; i++) {
    const a = chroma * Math.cos((h * Math.PI) / 180);
    const b = chroma * Math.sin((h * Math.PI) / 180);
    const l = Math.pow(Lc + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(Lc - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(Lc - 0.0894841775 * a - 1.291485548 * b, 3);
    const lin: RGB = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    rgb = [
      fromLinear(clamp(lin[0], 0, 1)),
      fromLinear(clamp(lin[1], 0, 1)),
      fromLinear(clamp(lin[2], 0, 1)),
    ];
    const eps = 1e-4;
    if (lin.every((v) => v >= -eps && v <= 1 + eps) || chroma < 1e-4) break;
    chroma *= 0.92;
  }
  return rgbToHex(...rgb);
}


function deriveRichBrandShade(p: OKLCH, deltaL: number, minL = 0.25, maxL = 0.92): string {
  const targetL = clamp(p.L + deltaL, minL, maxL);
  const isWarm = p.h >= 35 && p.h <= 105;

  const hueShift = isWarm && deltaL < 0 ? deltaL * 35 : 0;
  const targetH = (p.h + hueShift + 360) % 360;

  const targetC = deltaL < 0 ? Math.min(p.C * 1.05, 0.28) : p.C;
  return oklchToHex(targetL, targetC, targetH);
}


export function ensureContrast(fg: string, bg: string, min = AA): string {
  if (contrastBetween(fg, bg) >= min) return fg;
  const { L, C, h } = hexToOklch(fg);
  const dir = getRelativeLuminance(...hexToRgb(bg)) > DARK_CROSSOVER_LUM ? -1 : 1;
  for (let i = 1; i <= 50; i++) {
    const cand = oklchToHex(L + dir * i * 0.02, C, h);
    if (contrastBetween(cand, bg) >= min) return cand;
  }
  return dir < 0 ? BLACK : WHITE;
}



const RADIUS_RE = /^\d+(\.\d+)?(px|rem|em|%)$/;

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}


export function resolveTheme(
  theme?: Partial<WidgetTheme>,
  opts: ResolveOptions = {},
): ResolvedWidgetTheme {
  const primary = normalizeHex(theme?.primary_color, DEFAULT_PRIMARY);
  const mode = theme?.theme_mode ?? 'light';
  const explicitBg = override(theme?.background_color);

  let isDark = mode === 'dark' || (mode === 'auto' && (opts.prefersDark ?? systemPrefersDark()));
  if (explicitBg) isDark = getRelativeLuminance(...hexToRgb(explicitBg)) < DARK_CROSSOVER_LUM;

  const p = hexToOklch(primary);


  const secondary =
    override(theme?.secondary_color) ??
    (isDark
      ? deriveRichBrandShade(p, 0.06, 0.35, 0.88)
      : deriveRichBrandShade(p, -0.05, 0.25, 0.85));


  const background = explicitBg ?? (isDark ? '#0F172A' : WHITE);

  
  const headerBg =
    override(theme?.header_background) ??
    (isDark
      ? '#1E293B'
      : p.L > 0.78
        ? primary 
        : deriveRichBrandShade(p, -0.03, 0.3, 0.72));
  const headerText = override(theme?.header_text_color) ?? getBrandContrastColor(headerBg);


  const userBg = override(theme?.user_bubble_bg) ?? primary;
  const userText = override(theme?.user_bubble_text) ?? getBrandContrastColor(userBg);

  
  const agentBg =
    override(theme?.agent_bubble_bg) ??
    (isDark
      ? oklchToHex(0.24, Math.min(p.C * 0.08, 0.015), p.h)
      : oklchToHex(0.968, Math.min(p.C * 0.05, 0.008), p.h));

  
  const agentTextSeed = isDark
    ? '#F8FAFC'
    : oklchToHex(0.22, Math.min(p.C * 0.08, 0.015), p.h);
  const agentText = override(theme?.agent_bubble_text) ?? ensureContrast(agentTextSeed, agentBg);

  const radius =
    theme?.border_radius && RADIUS_RE.test(theme.border_radius) ? theme.border_radius : '16px';
  const font =
    theme?.font_family && theme.font_family !== 'inherit' ? theme.font_family : DEFAULT_FONT;

  return {
    primary_color: primary,
    secondary_color: secondary,
    background_color: background,
    header_background: headerBg,
    header_text_color: headerText,
    user_bubble_bg: userBg,
    user_bubble_text: userText,
    agent_bubble_bg: agentBg,
    agent_bubble_text: agentText,
    border_radius: radius,
    font_family: font,
    theme_mode: mode,
  };
}


export function auditTheme(t: ResolvedWidgetTheme): { pair: string; ratio: number }[] {
  const pairs: [string, string, string, number][] = [
    ['header', t.header_text_color, t.header_background, AA_UI],
    ['user_bubble', t.user_bubble_text, t.user_bubble_bg, 2.7],
    ['agent_bubble', t.agent_bubble_text, t.agent_bubble_bg, AA],
  ];
  return pairs
    .map(([pair, fg, bg, min]) => ({
      pair,
      ratio: Math.round(contrastBetween(fg, bg) * 100) / 100,
      min,
    }))
    .filter((r) => r.ratio < r.min)
    .map(({ pair, ratio }) => ({ pair, ratio }));
}