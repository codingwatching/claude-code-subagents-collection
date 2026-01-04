---
name: discord-error-notifications
description: Send Discord notifications for long-running operations and important events
category: notifications
event: PostToolUse
matcher: Bash
language: bash
version: 1.0.0
---

# discord-error-notifications

Send Discord notifications for long-running operations and important events

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Bash`
- **Category**: notifications

## Environment Variables

- `DISCORD_WEBHOOK_URL`

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook discord-error-notifications

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook discord-error-notifications"
          }
        ]
      }
    ]
  }
}
```
