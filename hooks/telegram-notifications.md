---
name: telegram-notifications
description: Send Telegram notifications when Claude Code finishes working
category: notifications
event: Stop
matcher: *
language: bash
version: 1.0.0
---

# telegram-notifications

Send Telegram notifications when Claude Code finishes working

## Event Configuration

- **Event Type**: `Stop`
- **Tool Matcher**: `*`
- **Category**: notifications

## Environment Variables

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook telegram-notifications

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook telegram-notifications"
          }
        ]
      }
    ]
  }
}
```
