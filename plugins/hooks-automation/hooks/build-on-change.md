---
name: build-on-change
description: Automatically trigger build processes when source files change
category: automation
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# build-on-change

Automatically trigger build processes when source files change

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit`
- **Category**: automation

## Environment Variables

- `CLAUDE_TOOL_FILE_PATH`
- `CLAUDE_PROJECT_DIR`

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook build-on-change

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook build-on-change"
          }
        ]
      }
    ]
  }
}
```
