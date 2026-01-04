---
name: smart-commit
description: Intelligent git commit creation with automatic message generation and validation
category: git
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# smart-commit

Intelligent git commit creation with automatic message generation and validation

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit`
- **Category**: git

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook smart-commit

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
            "command": "bwc add --hook smart-commit"
          }
        ]
      }
    ]
  }
}
```
