# Obsidian Heptabase

![Obsidian](https://img.shields.io/badge/Obsidian-%3E%3D1.5.0-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

Heptabase-like heading explorer for Obsidian Canvas — search, browse, and drag headings onto Canvas as new notes.

[日本語](docs/README.ja.md)

<!-- TODO: Add demo GIF/screenshot here -->

## What is Heptabase?

[Heptabase](https://heptabase.com/) is a visual knowledge management tool that lets you break down notes into cards and arrange them on whiteboards. This plugin brings a similar workflow to Obsidian by letting you extract heading sections from your vault and place them onto Canvas as individual notes.

## Features

- **Sidebar heading explorer** — Browse all notes and their heading hierarchy in a right sidebar
- **Debounced search** — Quickly filter notes by title with real-time search
- **Drag & drop to Canvas** — Drag any heading onto an open Canvas to create a new note
- **Smart content extraction** — Automatically extracts the full section content, including nested headings
- **Auto file creation** — Creates new files with sanitized names and handles filename collisions
- **Configurable node size** — Set default width and height for new Canvas nodes
- **Configurable output** — Choose an output folder and file name prefix for extracted notes
- **Backlink option** — Optionally leave a backlink in the original note after extraction
- **Keyboard accessible** — Full keyboard navigation support

## Installation

### Manual

1. Clone or download this repository
2. Install dependencies and build:
   ```bash
   pnpm install
   pnpm build
   ```
3. Copy `main.js`, `manifest.json`, and `styles.css` (if present) to your vault's plugin directory:
   ```
   <vault>/.obsidian/plugins/obsidian-heptabase/
   ```
4. Restart Obsidian and enable the plugin in Settings > Community Plugins

## Usage

1. Open a Canvas in Obsidian
2. Click the **list-tree** icon in the ribbon (left sidebar) to open the Heading Explorer
3. Browse or search for notes in the explorer panel
4. Expand a note to see its heading hierarchy
5. Drag a heading onto the Canvas — a new note is created with the extracted section content

## Settings

| Setting                | Description                                                                          | Default   |
| ---------------------- | ------------------------------------------------------------------------------------ | --------- |
| Extracted files folder | Folder to save extracted heading files. Leave empty to use the source file's folder. | _(empty)_ |
| Default node width     | Width for new Canvas nodes (200–800)                                                 | 400       |
| Default node height    | Height for new Canvas nodes (100–600)                                                | 300       |
| File name prefix       | Prefix for extracted file names                                                      | _(empty)_ |
| Leave backlink         | Leave a backlink in the original note after extracting                               | Off       |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
```

### Commands

```bash
pnpm dev        # Build in watch mode
pnpm build      # Production build
pnpm test       # Run tests
pnpm lint       # Lint with oxlint
pnpm format     # Auto-format with oxfmt
```

## Contributing

Contributions are welcome! Feel free to open an [issue](../../issues) or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and add tests
4. Run `pnpm test && pnpm lint` to verify
5. Submit a pull request

## License

[MIT](LICENSE)

## Acknowledgments

Inspired by [Heptabase](https://heptabase.com/) and its approach to visual knowledge management.
