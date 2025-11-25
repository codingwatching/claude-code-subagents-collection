---
name: smart-formatting
description: Smart code formatting based on file type
category: development
event: PostToolUse
matcher: Edit|MultiEdit
language: bash
version: 1.0.0
---

# smart-formatting

Smart code formatting based on file type

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
bwc add --hook smart-formatting

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
            "command": "bwc add --hook smart-formatting"
          }
        ]
      }
    ]
  }
}
```
