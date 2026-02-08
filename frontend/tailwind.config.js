/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    yellow: '#F9F489',
                    plum: '#3C1B25',
                    cream: '#FAF9F6',
                    brown: '#8C7378',
                    gray: '#4A4A4A',
                    banner: '#FFF95D',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
