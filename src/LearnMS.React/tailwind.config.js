/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        patua: "Patua One",
        signika: "Signika",
        catamaran: "Catamaran",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            a: {
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: "500",
              pointerEvents: "auto",
              cursor: "pointer",
              "&:hover": {
                color: "#1d4ed8",
                textDecoration: "underline",
              },
            },
            "a:visited": {
              color: "#7c3aed",
            },
          },
        },
        sm: {
          css: {
            a: {
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: "500",
              pointerEvents: "auto",
              cursor: "pointer",
              "&:hover": {
                color: "#1d4ed8",
                textDecoration: "underline",
              },
            },
            "a:visited": {
              color: "#7c3aed",
            },
          },
        },
        lg: {
          css: {
            a: {
              color: "#2563eb",
              textDecoration: "underline",
              fontWeight: "500",
              pointerEvents: "auto",
              cursor: "pointer",
              "&:hover": {
                color: "#1d4ed8",
                textDecoration: "underline",
              },
            },
            "a:visited": {
              color: "#7c3aed",
            },
          },
        },
        invert: {
          css: {
            a: {
              color: "#60a5fa",
              textDecoration: "underline",
              fontWeight: "500",
              pointerEvents: "auto",
              cursor: "pointer",
              "&:hover": {
                color: "#93c5fd",
                textDecoration: "underline",
              },
            },
            "a:visited": {
              color: "#a78bfa",
            },
          },
        },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        color1: "#1E4196",
        color2: "#2E65EB",
        heading: "hsl(var(--heading))",
        subheading: "hsl(var(--subheading))",
        paragraph: "hsl(var(--paragraph))",
        hero: "hsl(var(--hero))",
        gradesSection: "hsl(var(--gradesSection))",
        aboutSection: "hsl(var(--aboutSection))",
        seniorsSection: "hsl(var(--seniorsSection))",
        memoriesSection: "hsl(var(--memoriesSection))",
        footer: {
          DEFAULT: "hsl(var(--footer))",
          foreground: "hsl(var(--footer-foreground))",
        },
        coursePage: "hsl(var(--coursePage))",
        paymentPage: "hsl(var(--paymentPage))",
        lecturePage: "hsl(var(--lecturePage))",
        navbar: {
          foreground: "hsl(var(--navbar-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(75%, -70%) scale(2)",
          },
          "100%": {
            opacity: 0.4,
            transform: "translate(-75%, 0%) scale(1.5)",
          },
        },
      },
      animation: {
        spotlight: "spotlight 2s cubic-bezier(0.55, 0, 0.1, 1) .75s 1 forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
