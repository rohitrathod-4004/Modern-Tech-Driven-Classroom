/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'hacker-bg': '#0a0e1a',
                'hacker-secondary': '#1a1f2e',
                'hacker-accent': '#00ff41',
                'danger-red': '#ff3860',
                'success-green': '#00d1b2',
            },
        },
    },
    plugins: [],
}
