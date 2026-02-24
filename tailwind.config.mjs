export default {
  content: ["./src/**/*.{astro,html,md,mdx,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        noto: ['"Noto Serif Display"', 'serif'],
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        montserrat: ['"Montserrat"', '"Helvetica Neue"', "Helvetica", "sans-serif"],
        
      },
      fontSize: {
         h1: ['50px', { lineHeight: '1.2', fontWeight: '100' }],
        base: ['0.875rem', { lineHeight: '1.6' }], // 14px
        nav: ['0.625rem', { letterSpacing: '0.25em', textTransform: 'uppercase' }], // 10px menu/footer
        hero: ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // titoli grandi
        
      },
      fontWeight: {
        thin: 200,
        light: 300,
        bold: 700,
      },
    },
  },
  plugins: [],
};


