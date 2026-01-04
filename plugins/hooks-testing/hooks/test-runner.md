---
name: test-runner
description: Automatically run relevant tests after code changes
category: testing
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# test-runner

Automatically run relevant tests after code changes

## Event Configuration

- **Event Type**: `PostToolUse`
- **Tool Matcher**: `Edit`
- **Category**: testing

## Environment Variables

None required

## Requirements

None

## Installation

```bash
# Using bwc CLI
bwc add --hook test-runner

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
            "command": "bwc add --hook test-runner"
          }
        ]
      }
    ]
  }
}
```
