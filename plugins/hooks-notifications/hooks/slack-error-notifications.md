---
name: slack-error-notifications
description: Send Slack notifications when Claude Code encounters long-running operations or when tools take significant time
category: notifications
event: Notification
matcher: "*"
language: bash
version: 1.0.0
---

# slack-error-notifications

Send Slack notifications when Claude Code encounters long-running operations or when tools take significant time

## Event Configuration

- **Event Type**: `Notification`
- **Tool Matcher**: `*`
- **Category**: notifications

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook slack-error-notifications

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook slack-error-notifications"
          }
        ]
      }
    ]
  }
}
```
