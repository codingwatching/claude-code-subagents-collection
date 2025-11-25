---
name: run-tests-after-changes
description: Automatically run quick tests after code modifications to ensure nothing breaks
category: testing
event: PostToolUse
matcher: Edit
language: bash
version: 1.0.0
---

# run-tests-after-changes

Automatically run quick tests after code modifications to ensure nothing breaks

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
bwc add --hook run-tests-after-changes

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
            "command": "bwc add --hook run-tests-after-changes"
          }
        ]
      }
    ]
  }
}
```
