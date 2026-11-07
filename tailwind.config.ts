import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-0': 'var(--bg-0)',
        'bg-1': 'var(--bg-1)',
        'bg-2': 'var(--bg-2)',
        'bg-3': 'var(--bg-3)',
        'line-1': 'var(--line-1)',
        'line-2': 'var(--line-2)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        cyan: {
          DEFAULT: 'var(--cyan)',
          dim: 'var(--cyan-dim)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
        },
        green: {
          DEFAULT: 'var(--green)',
        },
        red: {
          DEFAULT: 'var(--red)',
        },
        'class-person': 'var(--class-person)',
        'class-vehicle': 'var(--class-vehicle)',
        'class-bag': 'var(--class-bag)',
        'class-animal': 'var(--class-animal)',
        'class-other': 'var(--class-other)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        hud: ['10.5px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '500' }],
        section: ['11px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '500' }],
        data: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        small: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        body: ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'body-strong': ['13px', { lineHeight: '20px', fontWeight: '550' }],
        metric: ['20px', { lineHeight: '24px', fontWeight: '500' }],
      },
      borderRadius: {
        '2': '2px',
        '4': '4px',
        '6': '6px',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        // full is ONLY permitted for small circular indicators/dots <= 8px
        full: '9999px',
      },
      boxShadow: {
        floating: 'var(--shadow-floating)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
      },
      zIndex: {
        base: 'var(--z-base)',
        overlay: 'var(--z-overlay)',
        sticky: 'var(--z-sticky)',
        drawer: 'var(--z-drawer)',
        dialog: 'var(--z-dialog)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      spacing: {
        'btn-sm': '28px',
        'btn-md': '32px',
        header: '36px',
        toolbar: '40px',
        topbar: '44px',
        row: '52px',
        timeline: '136px',
        'sb-collapsed': '56px',
        'sb-expanded': '208px',
        'intel-sm': '320px',
        intel: '360px',
        'detail-card': '220px',
      },
      height: {
        'btn-sm': '28px',
        'btn-md': '32px',
        header: '36px',
        toolbar: '40px',
        topbar: '44px',
        row: '52px',
        timeline: '136px',
      },
      width: {
        'btn-sm': '28px',
        'btn-md': '32px',
        'sb-collapsed': '56px',
        'sb-expanded': '208px',
        'intel-sm': '320px',
        intel: '360px',
        'detail-card': '220px',
      },
    },
  },
  plugins: [],
};

export default config;
