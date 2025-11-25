---
name: telegram-detailed-notifications
description: Send detailed Telegram notifications with session information and metrics
category: notifications
event: Stop
matcher: *
language: bash
version: 1.0.0
---

# telegram-detailed-notifications

Send detailed Telegram notifications with session information and metrics

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
bwc add --hook telegram-detailed-notifications

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
            "command": "bwc add --hook telegram-detailed-notifications"
          }
        ]
      }
    ]
  }
}
```
