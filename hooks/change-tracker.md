---
name: change-tracker
description: Track file changes in a simple log
category: development
event: PostToolUse
matcher: Edit|MultiEdit
language: bash
version: 1.0.0
---

# change-tracker

Track file changes in a simple log

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit|MultiEdit`
- **Category**: development

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook change-tracker

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook change-tracker"
          }
        ]
      }
    ]
  }
}
```
