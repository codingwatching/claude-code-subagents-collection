# codex-hud

A Claude Code plugin that displays OpenAI Codex usage and rate limits — right inside your Claude Code session.

## Features

- **Real-time statusline**: Integrates with [claude-hud](https://github.com/jarrodwatts/claude-hud) to show Codex Usage/Weekly rate limits alongside Claude Code's own statusline
- **Slash commands**: `usage-today/week/month`, `costs-today/week/month`, `summary`, `setup`
- **Dual data sources**: Local Codex CLI session logs (no API key needed) + OpenAI Usage API (optional, for dollar costs)
- **Zero npm runtime dependencies**: Only uses Node.js built-in modules
- **Graceful degradation**: Works with just local logs if no API key is configured

## Statusline Integration

When paired with claude-hud, codex-hud adds Codex rate limits below the Claude Code statusline:

```
[Opus 4.6 (1M context)]              <- claude-hud
Context ██░░░░░░░░ 19%
Usage   █░░░░░░░░░ 14% (resets in 4h 37m)
Weekly  ██░░░░░░░░ 22% (resets in 5d 18h)
── Codex team ──                      <- codex-hud
Usage   █░░░░░░░░░ 1% (resets in 5h)
Weekly  ░░░░░░░░░░ 0% (resets in 7d)
1 session | team
```

## Installation

```bash
git clone https://github.com/haenara-shin/codex-hud.git
cd codex-hud
npm install && npm run build
```

Then in Claude Code:

```
/plugin marketplace add haenara-shin/codex-hud
/plugin install codex-hud@codex-hud
```

## Links

- [Repository](https://github.com/haenara-shin/codex-hud)
- [Full documentation (English)](https://github.com/haenara-shin/codex-hud/blob/main/README.md)
- [Full documentation (Korean)](https://github.com/haenara-shin/codex-hud/blob/main/README_KR.md)

## License

MIT
