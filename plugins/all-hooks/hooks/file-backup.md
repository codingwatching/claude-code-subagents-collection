---
name: file-backup
description: Automatically backup files before editing
category: development
event: PreToolUse
matcher: Edit|MultiEdit
language: bash
version: 1.0.0
---

# file-backup

Automatically backup files before editing

## Event Configuration

- **Event Type**: `PreToolUse`
- **Tool Matcher**: `Edit|MultiEdit`
- **Category**: development

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook file-backup

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook file-backup"
          }
        ]
      }
    ]
  }
}
```
