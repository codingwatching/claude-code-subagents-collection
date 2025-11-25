---
name: performance-monitor
description: Monitor system performance during Claude Code operations
category: performance
event: PostToolUse
matcher: *
language: bash
version: 1.0.0
---

# performance-monitor

Monitor system performance during Claude Code operations

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `*`
- **Category**: performance

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook performance-monitor

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
            "command": "bwc add --hook performance-monitor"
          }
        ]
      }
    ]
  }
}
```
