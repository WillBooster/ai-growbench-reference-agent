# ranked-aa-reference-agent

[![Test](https://github.com/WillBooster/ranked-aa-reference-agent/actions/workflows/test.yml/badge.svg)](https://github.com/WillBooster/ranked-aa-reference-agent/actions/workflows/test.yml)

Reference AI agent implementation for Ranked AA.

## API

Set `REFERENCE_AGENT_API_KEY` to the shared secret registered in Ranked AA.

- `POST /ranked-aa/attempts`: accepts Ranked AA attempt start requests.
- `POST /ranked-aa/failures`: accepts failure feedback.
- `GET /api/ping`: health check.

The agent has no hard-coded problem knowledge. It forwards each attempt's requirements, DOM IDs, and submission endpoint to Codex SDK, then expects Codex to build, deploy, and submit the resulting app URL.
