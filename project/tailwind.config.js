/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: {
          light: '#3B82F6', // blue-500
          DEFAULT: '#2563EB', // blue-600
          dark: '#1D4ED8', // blue-700
        },
        background: {
          light: '#FFFFFF',
          dark: '#111827', // gray-900
        },
        surface: {
          light: '#F9FAFB', // gray-50
          dark: '#1F2937', // gray-800
        },
        text: {
          light: {
            primary: '#111827', // gray-900
            secondary: '#4B5563', // gray-600
            tertiary: '#6B7280', // gray-500
          },
          dark: {
            primary: '#F9FAFB', // gray-50
            secondary: '#E5E7EB', // gray-200
            tertiary: '#9CA3AF', // gray-400
          }
        },
        border: {
          light: '#E5E7EB', // gray-200
          dark: '#374151', // gray-700
        },
        status: {
          pending: {
            light: '#FEF3C7', // yellow-100
            dark: '#92400E', // yellow-800
            text: {
              light: '#92400E', // yellow-800
              dark: '#FEF3C7', // yellow-100
            }
          },
          reviewed: {
            light: '#DBEAFE', // blue-100
            dark: '#1E40AF', // blue-800
            text: {
              light: '#1E40AF', // blue-800
              dark: '#DBEAFE', // blue-100
            }
          },
          accepted: {
            light: '#D1FAE5', // green-100
            dark: '#065F46', // green-800
            text: {
              light: '#065F46', // green-800
              dark: '#D1FAE5', // green-100
            }
          },
          rejected: {
            light: '#FEE2E2', // red-100
            dark: '#991B1B', // red-800
            text: {
              light: '#991B1B', // red-800
              dark: '#FEE2E2', // red-100
            }
          }
        }
      },
    },
  },
  plugins: [],
}
