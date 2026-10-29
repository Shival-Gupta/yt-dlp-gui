# E2E Test Infra: yt-dlp-gui

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation internals.
- Derived strictly from `ORIGINAL_REQUEST.md`, `AGENTS.md`, and `.agents/goals/A-H`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory Coverage Target
All 84 features enumerated in `PROJECT.md § Feature Inventory` are targeted for end-to-end verification across Tiers 1-4:
- Desktop GUI IPC, Command builders, Arguments validation, Presets, Error translation.
- Standalone MCP server tools (12 tools), resources (4 resources), stdio/SSE protocol conformity.
- AI Agent Skill syntax, recipe validation, multi-agent installer script verification.
- Windows NSIS installer script syntax, sidecar download logic, registry structure.
- CI/CD workflow YAML schemas and action compatibility.

## Test Architecture
- **E2E Test Runner**: Vitest / Node test runner for frontend & IPC contracts (`pnpm test`); Rust integration test harnesses (`cargo test -p ytdeck-mcp`, `cargo test --bin yt-dlp-gui`); PowerShell automated test runners for scripts and installer.
- **Test Directory Layout**:
  - `tests/e2e/tier1-feature-coverage/`
  - `tests/e2e/tier2-boundary-corner/`
  - `tests/e2e/tier3-cross-feature/`
  - `tests/e2e/tier4-application-scenarios/`
  - `tests/fixtures/`

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: Isolated functional verification of each feature in isolation (CLI generation, store mutations, format parsing, MCP tools, skill recipes). Minimum >= 5 tests per major feature area.
- **Tier 2 (Boundary & Corner Cases)**: Empty URLs, credential redactions (`***`), malformed JSON lines from yt-dlp, 500-entry circular buffer overflow, missing sidecar fallback, special characters in filenames/templates, timeout handling.
- **Tier 3 (Cross-Feature Combinations)**: Format selector + post-processing audio extraction; SponsorBlock + chapters; Cookies auth + rate limiting; Batch URL list + history tracking; MCP download tool + SSE progress streaming.
- **Tier 4 (Real-World Application Scenarios)**:
  1. Full YouTube 4K Video Download with Subtitles & Chapters
  2. Audio-Only MP3 Extraction with Cover Art Embedding
  3. Bulk Batch Download of 50 URLs with Rate Limiting & Proxy
  4. Programmatic MCP AI Agent Workflow (Search -> Fetch Formats -> Download -> Get Status)
  5. Offline App Launch with Missing Network & Resilient UI Fallbacks
  6. NSIS Installer Script Validation & AI Agent Config Patching Dry-Run

## Completion Signal
When all test suites for Tiers 1-4 are authored and validated, the E2E Testing Orchestrator publishes `TEST_READY.md` at the project root.
