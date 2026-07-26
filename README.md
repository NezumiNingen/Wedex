# wedex

wedex is an independent, open-source desktop client for working with local folders through the official Codex CLI. It uses Tauri 2, React, TypeScript, and Rust—there is no Electron layer and no wedex cloud service.

## What it does

- Runs the locally installed Codex CLI inside a selected project directory.
- Streams CLI events into a messenger-style desktop UI.
- Keeps projects, conversation history, preferences, language, and avatar choices on the local machine.
- Supports light, dark, and system themes, as well as Chinese and English navigation/settings UI.
- Includes Mock mode so the interface remains usable when Codex CLI is unavailable.

## Codex compatibility

wedex does **not** bundle Codex or share login credentials. Every person using wedex must install and authenticate the official Codex CLI with their own account.

At launch, wedex looks for `codex` on the system PATH and common official/user installation locations. On macOS it also recognizes the Codex executable bundled with the ChatGPT desktop app. If automatic detection fails, enter the executable path in **Settings → CLI path**. The Settings page always reports whether it found a working CLI.

This design works on macOS, Windows, and Linux when that platform's Tauri prerequisites and Codex CLI are installed. Packages must be built on their target operating system: macOS builds macOS apps; Windows builds MSI/NSIS installers.

## Requirements

For development:

- Node.js 20+ and pnpm 9+
- Rust stable and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

For real tasks:

- Official [Codex CLI](https://developers.openai.com/codex/cli/) installed and logged in

## Development

```bash
pnpm install
pnpm tauri dev
```

## Release build

```bash
pnpm lint
pnpm test
pnpm build
pnpm tauri build
```

Release artifacts are generated for the operating system that performs the build. Do not commit `dist/` or `src-tauri/target/`; both are ignored.

## Publishing to GitHub

This folder is ready to be a GitHub repository:

```bash
git init
git add .
git commit -m "Initial open-source release"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/wedex.git
git push -u origin main
```

Create a GitHub Release and upload the target-platform package built by `pnpm tauri build`. Never upload personal Codex credentials, local databases, or `node_modules`.

## Privacy and safety

wedex is local-first. It does not operate a server, upload project files, read or store Codex credentials, or bypass Codex approvals. Removing a project from wedex removes only its local application record—not the real project folder.

## License

[MIT](LICENSE)
