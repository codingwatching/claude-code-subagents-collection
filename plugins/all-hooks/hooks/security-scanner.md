---
name: security-scanner
description: Scan code for security vulnerabilities and secrets after modifications
category: security
event: PostToolUse
matcher: Edit|Write
language: bash
version: 1.0.0
---

# security-scanner

Scan code for security vulnerabilities and secrets after modifications

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit|Write`
- **Category**: security

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook security-scanner

# Or add to your .claude/settings.json
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bwc add --hook security-scanner"
          }
        ]
      }
    ]
  }
}
```
