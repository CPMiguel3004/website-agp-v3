/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'agp-bg': '#0d0d0d',
        'agp-red': '#c0392b',
        'agp-red-hover': '#e74c3c',
        'agp-muted': '#aaaaaa',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'Oswald', 'sans-serif'],
        body: ['Inter', 'Poppins', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
      },
      backgroundImage: {
        'red-glow': 'radial-gradient(ellipse at center, rgba(192,57,43,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
