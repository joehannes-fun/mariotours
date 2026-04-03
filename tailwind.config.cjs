module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tropicalGreen: '#1EA3A8',
        tropicalBlue: '#0A6F7E',
        sandyBeige: '#FFE5C2',
        sunsetOrange: '#FF6F61',
        oceanWave: '#574A78',
      },
      backgroundImage: {
        'tropical-pattern': "radial-gradient(circle at 15% 15%, rgba(255,111,97,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(30,163,168,0.28), transparent 38%), linear-gradient(160deg, #f4f6ff 0%, #f4fcff 50%, #eefaf7 100%)",
      },
      boxShadow: {
        tropical: '0 12px 32px rgba(31, 23, 54, 0.14)',
      },
      borderRadius: {
        organic: '28px 42px 28px 42px',
      },
    },
  },
  plugins: [],
}
