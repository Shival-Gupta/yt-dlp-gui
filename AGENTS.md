# AGENTS.md — yt-dlp-gui Project

## Project Overview
Full-featured Tauri 2 / React 19 desktop GUI for yt-dlp, with a Windows NSIS installer, standalone MCP server, and AI agent SKILL.md.

**Repo:** https://github.com/Shival-Gupta/yt-dlp-gui  
**Stack:** Tauri 2 · Rust · React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · NSIS

## Subagent Roster & Execution Order

```
A (Foundation) ──────────┬──────────────────────────────┐
                          │                              │
                    B (Download UX)              C (Panels)
                    E (MCP Server)               F (Skill)
                          │                              │
                          └──────────────────────────────┤
                                                         │
                                                   D (Polish)
                                                         │
                                                   G (Installer)
                                                         │
                                                   H (CI/CD)
```

## Subagent Goal Files

Each subagent has a complete goal file in `.agents/goals/`:

| Agent | File | Depends On | Can Run In Parallel With |
|---|---|---|---|
| **A** — Foundation | `A-foundation-agent.md` | Nothing | F (Skill) |
| **B** — Download UX | `B-download-ux-agent.md` | A | C, E |
| **C** — Panels | `C-panels-agent.md` | A | B, E |
| **D** — Polish | `D-polish-agent.md` | B + C | — |
| **E** — MCP Server | `E-mcp-agent.md` | A | B, C, F |
| **F** — Skill | `F-skill-agent.md` | Nothing | A, B, C, E |
| **G** — Installer | `G-installer-agent.md` | D + E + F | — |
| **H** — CI/CD | `H-cicd-agent.md` | G | — |

## Conventions
- **Package manager:** `pnpm` (never `npm` or `yarn`)
- **Commit style:** Conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`
- **Commit frequency:** One commit per task in the goal file
- **Branch:** All work on `main` (single-developer project)
- **Push after each subagent completes**

## Key Files
| File | Purpose |
|---|---|
| `src/types/ytdlp.ts` | Shared TypeScript types (DownloadJob, YtdlpOptions, etc.) |
| `src/lib/ytdlp-args.ts` | Single source of truth: YtdlpOptions → CLI args[] |
| `src/lib/progress-parser.ts` | Parse yt-dlp JSON progress output |
| `src/store/downloadStore.ts` | Active job state (Zustand) |
| `src/store/settingsStore.ts` | App settings (Zustand + tauri-plugin-store) |
| `src-tauri/src/commands/download.rs` | Spawn yt-dlp sidecar, stream events |
| `ytdeck-mcp/src/main.rs` | MCP server entry point |
| `skill/SKILL.md` | AI agent documentation |
| `.agents/goals/` | Per-subagent goal files |

## IPC Contract
- **Frontend → Rust:** `invoke('command_name', { args })` returns Promise
- **Rust → Frontend:** `window.emit('event-name', payload)` received via `listen('event-name', handler)`

Key events:
| Event | Direction | Payload |
|---|---|---|
| `ytdlp-output` | Rust → Frontend | `{ jobId: string, line: string, stream: 'stdout'|'stderr' }` |
| `ytdlp-done` | Rust → Frontend | `{ jobId: string, exitCode: number }` |
| `update-available` | Rust → Frontend | `{ version: string, notes: string }` |
| `update-progress` | Rust → Frontend | `{ percent: number }` |

Key commands:
| Command | Args | Returns |
|---|---|---|
| `spawn_ytdlp` | `{ args: string[], jobId?: string }` | `{ jobId: string }` |
| `cancel_download` | `{ jobId: string }` | `void` |
| `fetch_info` | `{ url: string }` | `string` (JSON) |
| `fetch_formats` | `{ url: string }` | `string` (raw -F output) |
| `check_update` | `{}` | `UpdateInfo | null` |
| `download_update` | `{}` | `void` |
| `install_update` | `{}` | `void` |

## Do NOT
- Use `npm` or `yarn` (use `pnpm`)
- Write credentials to the log panel
- Expose `--username`/`--password` in CommandPreview (mask with ***)
- Modify files outside your assigned scope
- Auto-restart the app during update (always ask user)
- Implement anything not in your goal file (check other agents' goal files for scope boundaries)
