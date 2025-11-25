---
name: git-add-changes
description: Automatically stage changes in git after file modifications for easier commit workflow
category: git
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# git-add-changes

Automatically stage changes in git after file modifications for easier commit workflow

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
bwc add --hook git-add-changes

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
            "command": "bwc add --hook git-add-changes"
          }
        ]
      }
    ]
  }
}
```
