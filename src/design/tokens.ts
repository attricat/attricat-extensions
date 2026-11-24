// Maps the Attricat design token snapshot (see scripts/sync-design.mjs) to CSS custom properties.
// Components use these variables; never hardcode token values in this repository.
import colors from './colors.json';
import elevation from './elevation.json';
import radius from './radius.json';
import spacing from './spacing.json';
import typography from './typography.json';

type Mode = 'light' | 'dark';

const px = (value: number) => `${value}px`;
const declarations = (vars: Record<string, string>) =>
  Object.entries(vars).map(([name, value]) => `--${name}:${value};`).join('');

function modeVars(mode: Mode) {
  const c = colors[mode];
  const s = c.semantic;
  return declarations({
    primary: c.brand.primary,
    accent: c.brand.accent,
    'on-primary': c.brand.onPrimary,
    bg: c.background.default,
    surface: c.background.surface,
    elevated: c.background.elevated,
    inset: c.background.inset,
    fg: c.text.primary,
    muted: c.text.secondary,
    disabled: c.text.disabled,
    inverse: c.text.inverse,
    border: c.border.default,
    subtle: c.border.subtle,
    strong: c.border.strong,
    hover: c.action.hover,
    selected: c.action.selected,
    focus: c.action.focus,
    success: s.success.main,
    'success-tint': s.success.tint,
    warning: s.warning.main,
    'warning-tint': s.warning.tint,
    'warning-fg': s.warning.foreground,
    'warning-on': s.warning.onMain,
    error: s.error.main,
    'error-tint': s.error.tint,
    info: s.info.main,
    'info-tint': s.info.tint,
    'shadow-raised': elevation[mode].raised,
    'shadow-overlay': elevation[mode].overlay,
  });
}

const roles = typography.roles;
const role = (name: keyof typeof roles) => {
  const r = roles[name];
  return {
    [`${name}-size`]: px(r.size),
    [`${name}-lh`]: String(r.lineHeight),
    [`${name}-weight`]: String(r.weight),
    [`${name}-tracking`]: r.tracking,
  };
};

const staticVars = declarations({
  sans: typography.families.sans,
  mono: typography.families.mono,
  ...(Object.keys(roles) as Array<keyof typeof roles>).reduce((all, name) => ({ ...all, ...role(name) }), {}),
  'radius-small': px(radius.small),
  'radius-control': px(radius.control),
  'radius-surface': px(radius.surface),
  'radius-dialog': px(radius.dialog),
  'radius-pill': px(radius.pill),
  ...Object.fromEntries(Object.entries(spacing.scale).map(([step, value]) => [`space-${step}`, px(value)])),
  gutter: px(spacing.layout.pageGutter),
  'gutter-mobile': px(spacing.layout.mobileGutter),
  'content-max': px(spacing.layout.contentMax),
  'section-gap': px(spacing.layout.sectionGap),
});

export const themeColor = { light: colors.light.background.default, dark: colors.dark.background.default };

// Follows the system preference unless the theme toggle sets data-theme on <html>.
export const tokenCss =
  `:root{color-scheme:light;${staticVars}${modeVars('light')}}` +
  `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;${modeVars('dark')}}}` +
  `:root[data-theme=dark]{color-scheme:dark;${modeVars('dark')}}`;
