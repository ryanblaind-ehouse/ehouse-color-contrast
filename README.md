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
- APCA with configurable text size and font weight, evaluated with the official APCA lookup table

Palette choices, the selected contrast mode, and APCA typography settings are
all persisted in the URL so results are easy to share.

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

## Shadcn Tooling

This project is configured for the current `shadcn` CLI and includes the
project-level shadcn skill for Codex.

Common commands:

- `npm run ui -- add button`
- `npm run ui:add -- card`
- `npm run ui:view -- button`
- `npm run ui:search -- button`
- `npm run ui:info -- --json`
- `npm run ui:docs -- button`
- `npm run ui:mcp:init -- --client codex`

Project files:

- [`components.json`](/Users/ryanblaind/Sites/color-contrast/components.json)
- [`skills-lock.json`](/Users/ryanblaind/Sites/color-contrast/skills-lock.json)
- [`SKILL.md`](/Users/ryanblaind/Sites/color-contrast/.agents/skills/shadcn/SKILL.md)

The Codex MCP server is configured in `~/.codex/config.toml`. Codex needs a
restart before the new `shadcn` MCP server is available.
