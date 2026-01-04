---
name: simple-notifications
description: Send simple desktop notifications when Claude Code operations complete
category: notifications
event: PostToolUse
matcher: "*"
language: bash
version: 1.0.0
---

# simple-notifications

Send simple desktop notifications when Claude Code operations complete

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `*`
- **Category**: notifications

## Environment Variables

- `CLAUDE_TOOL_NAME`

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook simple-notifications

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook simple-notifications"
          }
        ]
      }
    ]
  }
}
```
