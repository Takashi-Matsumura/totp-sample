# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Runs Next.js dev server on http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm run start` - Runs production server
- **Lint**: `npm run lint` - Runs ESLint with Next.js configuration

## Architecture Overview

This is a Next.js 15 application using the App Router architecture with TypeScript and Tailwind CSS.

**Key Structure:**
- Uses App Router (`app/` directory) for routing and layouts
- `app/layout.tsx` defines the root layout with Geist fonts
- `app/page.tsx` contains the main homepage component
- TypeScript configured with strict mode and Next.js optimizations
- Tailwind CSS v4 for styling with PostCSS integration
- ESLint configured with Next.js best practices

**Font Configuration:**
- Uses Geist Sans and Geist Mono fonts via `next/font/google`
- CSS custom properties for font families: `--font-geist-sans`, `--font-geist-mono`

**Styling Approach:**
- Tailwind utility classes throughout components
- Dark mode support with `dark:` prefixes
- Responsive design with breakpoint prefixes (`sm:`, `md:`)