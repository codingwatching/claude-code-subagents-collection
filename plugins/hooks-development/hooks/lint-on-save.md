---
name: lint-on-save
description: Automatically run linting tools after file modifications
category: development
event: PostToolUse
matcher: Edit|MultiEdit|Write
language: bash
version: 1.0.0
---

# lint-on-save

Automatically run linting tools after file modifications

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit|MultiEdit|Write`
- **Category**: development

## Environment Variables

- `CLAUDE_TOOL_FILE_PATH`

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook lint-on-save

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook lint-on-save"
          }
        ]
      }
    ]
  }
}
```
