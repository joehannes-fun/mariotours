module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tropicalGreen: '#2BB673',
        tropicalBlue: '#0095D9',
        sandyBeige: '#F4E1B1',
        sunsetOrange: '#FF6F20',
        oceanWave: '#007BFF',
      },
      backgroundImage: {
        'tropical-pattern': "url('/public/tropical-background.jpg')",
      },
      boxShadow: {
        'tropical': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}