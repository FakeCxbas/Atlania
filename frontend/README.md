This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ASI dossiers, methodology and mobile HUD (issue #4)

- **Methodology & Data Sources** opens a native modal dialog with the five-axis
  formula, dataset target weights, NASA POWER provenance and analogy limitations.
  Escape or Close dismisses it and returns focus to the trigger.
- **Export Dossier · JSON / Markdown** in telemetry downloads the current site
  and selected comparison, including scores, weights, strengths, breakdowns and
  climate provenance. JSON preserves the full site record and methodology.
- Below **1024 px**, the map fills the workspace. Directory and Telemetry buttons
  toggle one bottom drawer at a time; selecting a site opens telemetry. Close,
  the toggle button, or Escape from within a drawer returns to the map. Desktop
  retains the three-panel layout.

### Verification

Use Node.js 22.6+ for the built-in TypeScript test runner; no test dependencies
are required.

```bash
npm ci
npm test
npm run lint
npm run build
npm run start
```

The dossier regression tests cover all dataset site/target combinations, missing
comparison fallback, explicit fallback-climate labeling, empty strengths and
Markdown escaping.

Browser checks: test widths 320, 390, 768, 1023 and 1024 px; open/close both mobile
drawers, select a different site, and confirm the map remains usable. Change the
comparison target and download both formats; verify that their target and score
match telemetry. Open the methodology dialog with the keyboard, navigate its
links, and press Escape to check focus restoration. At desktop widths, both
side panels should remain visible.
