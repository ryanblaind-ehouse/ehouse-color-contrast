# Accessible Color Matrix

A modernized accessible color palette builder for exploring text/background
contrast combinations.

This project started from the original
[`toolness/accessible-color-matrix`](https://github.com/toolness/accessible-color-matrix)
tool and has been modernized to a React, TypeScript, Vite, and Tailwind stack.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- `apca-w3` for APCA contrast scoring

## Included checks

- WCAG AA
- WCAG AAA
- WCAG large text
- APCA body text (evaluated with the official APCA lookup for 16px, 400-weight text)

## Development

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
```
