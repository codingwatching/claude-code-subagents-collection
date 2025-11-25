---
name: auto-git-add
description: Automatically stage modified files with git add after editing
category: git
event: PostToolUse
matcher: Edit|MultiEdit|Write
language: bash
version: 1.0.0
---

# auto-git-add

Automatically stage modified files with git add after editing

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit|MultiEdit|Write`
- **Category**: git

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook auto-git-add

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
            "command": "bwc add --hook auto-git-add"
          }
        ]
      }
    ]
  }
}
```
