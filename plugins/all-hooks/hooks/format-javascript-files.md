---
name: format-javascript-files
description: Automatically format JavaScript/TypeScript files after any Edit operation using prettier
category: formatting
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# format-javascript-files

Automatically format JavaScript/TypeScript files after any Edit operation using prettier

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit`
- **Category**: formatting

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook format-javascript-files

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
            "command": "bwc add --hook format-javascript-files"
          }
        ]
      }
    ]
  }
}
```
