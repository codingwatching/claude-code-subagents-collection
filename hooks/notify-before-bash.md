---
name: notify-before-bash
description: Show notification before any Bash command execution for security awareness
category: notifications
event: PreToolUse
matcher: Bash
language: bash
version: 1.0.0
---

# notify-before-bash

Show notification before any Bash command execution for security awareness

## Event Configuration

- **Event Type**: `PreToolUse`
- **Tool Matcher**: `Bash`
- **Category**: notifications

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook notify-before-bash

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook notify-before-bash"
          }
        ]
      }
    ]
  }
}
```
