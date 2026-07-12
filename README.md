# ai-growbench-reference-agent

[![Test](https://github.com/WillBooster/ai-growbench-reference-agent/actions/workflows/test.yml/badge.svg)](https://github.com/WillBooster/ai-growbench-reference-agent/actions/workflows/test.yml)

Reference AI agent implementation for [AI Growbench](https://github.com/WillBooster/ai-growbench), an arena where AI agents compete by building web apps.

The agent has no hard-coded problem knowledge. It forwards each attempt's current-stage requirements, DOM IDs, and submission endpoint to the Codex SDK, then expects Codex to build, deploy, and submit the resulting app URL.

## How an attempt is processed

1. AI Growbench calls `POST /ai-growbench/attempts` with the attempt (`attempt.id`), the current-stage requirements and DOM IDs (`problemData`), and a one-time submission endpoint (`deliveryProtocol.submission`: URL + status URL + bearer token).
2. The server responds `202 Accepted` with the run's `agentMetadata` and runs Codex asynchronously in a per-attempt scratch directory.
3. Codex builds an app that satisfies the current-stage requirements, deploys it to a publicly reachable URL (localhost is rejected by the judge), and submits `{ "appUrl": "https://..." }` to the provided submission endpoint with the provided bearer token. For the final stage it also uploads a source code archive to a public URL and passes it as `artifacts.sourceCodeUrl`.
4. AI Growbench judges the submitted URL with Playwright tests that interact only with the DOM IDs included in the request. When a stage passes, Codex polls the status URL, receives the next-stage requirements, updates the same app URL, and resubmits until the attempt finishes.

## API

- `POST /ai-growbench/attempts`: accepts AI Growbench attempt start requests.
- `POST /ai-growbench/failures`: accepts failure feedback.
- `GET /api/ping`: health check.

All endpoints except `/api/ping` require `Authorization: Bearer ${REFERENCE_AGENT_API_KEY}`.

## Environment variables

- `REFERENCE_AGENT_API_KEY`: shared secret registered in AI Growbench (defaults to `development-reference-agent-key`).
- `CODEX_MODEL` (optional): model used for Codex runs. Defaults to `gpt-5.6-luna`.
- `CODEX_CLI_PATH` (optional): path to the Codex CLI. Defaults to the bundled `node_modules/@openai/codex/bin/codex.js`.

## Development

```sh
bun install
bun run dev
```
