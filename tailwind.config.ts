import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@pxlkit/ui-kit/**/*.js',
    './node_modules/@pxlkit/core/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
