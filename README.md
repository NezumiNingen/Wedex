# wedex

wedex is an independent, open-source desktop client for working with local folders through the official Codex CLI or Kimi Code CLI. It uses Tauri 2, React, TypeScript, and Rust—there is no Electron layer and no wedex cloud service.

> **[↓ 下载 wedex for macOS（Apple Silicon）](https://github.com/NezumiNingen/Wedex/releases/download/v0.1.0/wedex_0.1.0_aarch64.dmg)**
>
> 适用于 M1 / M2 / M3 / M4 Mac。安装后仍需自行安装并登录官方 Codex CLI。

也可以选择 **Code → Download ZIP** 下载源码；安装包请从 GitHub Releases 下载，或按下面的 Release build 步骤自行构建。

## What it does

- Runs the locally installed Codex CLI or Kimi Code CLI inside a selected project directory.
- Streams CLI events into a messenger-style desktop UI.
- Lets you drag files, folders, and macOS `.app` bundles into the composer as explicit task context; images are sent to Codex through its native image input.
- Keeps a separate provider session for every sub-conversation so Kimi context can be resumed.
- Keeps projects, conversation history, preferences, language, and avatar choices on the local machine.
- Supports light, dark, and system themes, as well as Chinese and English navigation/settings UI.
- Includes Mock mode so the interface remains usable when Codex CLI is unavailable.

## Codex and Kimi compatibility

wedex does **not** bundle either CLI or share login credentials. Every person using wedex installs and authenticates their chosen official CLI with their own account.

At launch, wedex looks for `codex` on the system PATH and common official/user installation locations. On macOS it also recognizes the Codex executable bundled with the ChatGPT desktop app. If automatic detection fails, enter the executable path in **Settings → CLI path**. The Settings page always reports whether it found a working CLI.

For Kimi, select **Settings → AI provider → Kimi**. wedex looks for `kimi` on PATH and in the official per-user Kimi Code installation directory. It supports a manual executable path as a fallback, uses the CLI's structured JSON output, and stores only the returned session ID—not authentication tokens. Install and sign in with `kimi login` before starting real tasks.

This design works on macOS, Windows, and Linux when that platform's Tauri prerequisites and the selected CLI are installed. Packages must be built on their target operating system: macOS builds macOS apps; Windows builds MSI/NSIS installers.

## Requirements

For development:

- Node.js 20+ and pnpm 9+
- Rust stable and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

For real tasks:

- Official [Codex CLI](https://developers.openai.com/codex/cli/) installed and logged in, or
- Official [Kimi Code CLI](https://www.kimi.com/code/docs/kimi-code-cli/) installed and logged in

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

wedex is local-first. It does not operate a server or read/store Codex or Kimi credentials. Prompts and the project context selected by each official CLI are sent to that provider under the user's own account. When you explicitly attach a file or folder, its local path is sent as context; for Codex, attached folders are added to that task's accessible directories and attached images use the official native image flag. Codex uses its configured sandbox policy. Kimi currently runs through Kimi Code CLI's structured non-interactive mode, whose tool permissions are governed by Kimi's own safety policy. Removing a project from wedex removes only its local application record—not the real project folder.

## License

[MIT](LICENSE)
