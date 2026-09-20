/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: 'var(--color-app)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-alt2': 'var(--color-surface-alt2)',
        ink: 'var(--color-ink)',
        'ink-hover': 'var(--color-ink-hover)',
        'on-ink': 'var(--color-on-ink)',
        subtle: 'var(--color-border-subtle)',
        default: 'var(--color-border-default)',
        strong: 'var(--color-border-strong)',
        focus: 'var(--color-border-focus)',
        faint: 'var(--color-text-faint)',
        muted: 'var(--color-text-muted)',
        secondary: 'var(--color-text-secondary)',
        body: 'var(--color-text-body)',
        heading: 'var(--color-text-heading)',
        primary: 'var(--color-text-primary)',
        'primary-strong': 'var(--color-text-primary-strong)',
      },
    },
  },
  plugins: [],
}
