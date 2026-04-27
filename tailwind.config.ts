import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f5f5f7',
        ocean: '#0a84ff',
        mint: '#30d158',
        coral: '#ff9f0a',
        danger: '#ff453a',
        reef: '#bf5af2'
      },
      boxShadow: {
        glow: '0 18px 60px rgba(10, 132, 255, 0.28)'
      },
      opacity: {
        6: '0.06',
        7: '0.07',
        8: '0.08',
        10: '0.10',
        12: '0.12',
        15: '0.15',
        16: '0.16',
        18: '0.18',
        20: '0.20',
        22: '0.22',
        30: '0.30',
        35: '0.35',
        40: '0.40',
        45: '0.45',
        50: '0.50',
        55: '0.55',
        60: '0.60',
        70: '0.70',
        72: '0.72',
        80: '0.80',
        82: '0.82',
        90: '0.90'
      }
    }
  },
  plugins: []
};

export default config;
