# Math Message Link Builder

A full client-side React app that lets users compose a rich message (title + markdown content), encode it into a compressed URL payload, and share it via link or QR code.

## Tech Stack

- React + Vite + TypeScript
- TailwindCSS + shadcn-style UI components
- MDXEditor (user-friendly editor with toolbar)
- lz-string compression
- react-markdown + remark/rehype plugins
- KaTeX math rendering
- highlight.js code highlighting
- qrcode.react

## Features

- Create page with title + rich editor
- Generate compressed share URL using `?data=` query param
- QR code generation for easy sharing
- Copy link button
- View page automatically decodes and renders shared content
- Supports markdown tables/lists/headings, math formulas, code blocks, emojis, Unicode, subscripts/superscripts/fractions syntax

## Project Structure

```text
src/
  components/
    Editor.tsx
    QRCodeCard.tsx
    MarkdownRenderer.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
  pages/
    CreatePage.tsx
    ViewPage.tsx
  utils/
    compress.ts
    decode.ts
    encode.ts
  lib/
    utils.ts
  App.tsx
  main.tsx
  index.css
```

## Run Locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```
