---
name: file-protection-hook
description: Protect critical files from accidental modification
category: security
event: PreToolUse
matcher: Edit|MultiEdit|Write
language: bash
version: 1.0.0
---

# file-protection-hook

Protect critical files from accidental modification

## Event Configuration

- **Event Type**: `PreToolUse`
- **Tool Matcher**: `Edit|MultiEdit|Write`
- **Category**: security

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook file-protection-hook

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook file-protection-hook"
          }
        ]
      }
    ]
  }
}
```
