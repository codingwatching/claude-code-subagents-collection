# Ultraship

Claude Code plugin for pre-deploy auditing, workflow enforcement, and project tooling.

## Install

```bash
claude plugin marketplace add Houseofmvps/ultraship
claude plugin install ultraship
```

Or standalone:

```bash
npx ultraship ship .
```

## What it does

`/ship` runs 5 tools in parallel and outputs a scorecard covering SEO/GEO/AEO, security, code quality, and bundle size.

### Auditing (7 tools)

SEO scanner (60+ rules including GEO/AEO), secret scanner, code profiler (N+1 queries, memory leaks, ReDoS), bundle tracker, dependency doctor, content scorer, Lighthouse runner.

### Validation (6 tools)

Health check (HTTP + SSL + security headers), env validator, migration checker (Drizzle/Prisma/Knex), OG validator, redirect checker, API smoke test.

### Generators (4 tools)

Sitemap, robots.txt (AI-crawler friendly), llms.txt, JSON-LD structured data.

### Project & Operations (12 tools)

Competitive analysis, launch prep, demo readiness, incident commander, growth tracker, cost tracker, onboarding generator, architecture mapper, pattern analyzer, audit history, Google Search Console client, Bing Webmaster client.

### Workflows (32 skills)

Brainstorming, planning, TDD, implementation, code review, debugging, refactoring, frontend design, API design, data modeling, git workflow, deploy pipeline, release, SEO/GEO/AEO audit, security audit, performance audit, and more.

## Technical details

- 1 dependency (`htmlparser2`)
- 113 tests (`node:test`)
- Node.js ESM, no build step
- `execFileSync` with array args (no shell interpolation)
- SSRF protection on all HTTP tools
- Zero telemetry

## Links

- [npm](https://www.npmjs.com/package/ultraship)
- [GitHub](https://github.com/Houseofmvps/ultraship)
- [Documentation](https://github.com/Houseofmvps/ultraship#readme)
