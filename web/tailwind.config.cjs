/**
 * Tailwind CSS configuration.
 *
 * The `content` array tells Tailwind where to look for class names. It scans
 * your HTML and TS/TSX files under src/ and compiles only the classes you
 * actually use. This helps keep your CSS bundle small.
 */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};