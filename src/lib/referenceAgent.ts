import { join } from 'node:path';

import { Codex } from '@openai/codex-sdk';

export interface AttemptStartRequest {
  attemptId: string;
  taskId: string;
  stage: {
    currentIndex?: number;
    passedCount: number;
    totalCount: number;
  };
  currentPrompt: {
    id: string;
    index: number;
    title: string;
    requirements: string;
  };
  task: {
    title: string;
    domIds: Record<string, string>;
  };
  submission: {
    method: 'POST';
    url: string;
    statusUrl: string;
    token: string;
  };
}

const processed = new Set<string>();

export async function acceptReferenceAttempt(request: AttemptStartRequest): Promise<void> {
  if (processed.has(request.attemptId)) return;
  processed.add(request.attemptId);
  void runCodexGeneration(request).catch((error) => {
    console.error('Codex reference generation failed:', error);
  });
}

async function runCodexGeneration(request: AttemptStartRequest): Promise<string> {
  const codex = new Codex({ codexPathOverride: codexCliPath() });
  const thread = codex.startThread({
    approvalPolicy: 'never',
    networkAccessEnabled: true,
    sandboxMode: 'workspace-write',
    workingDirectory: process.cwd(),
  });
  const turn = await thread.run(`You are the generic Ranked AA reference agent.

Implement software that satisfies the requirements below without assuming any fixed problem domain. Build the requested application, deploy it to a public URL, then submit that URL to Ranked AA using the submission API.

attemptId: ${request.attemptId}
taskId: ${request.taskId}
taskTitle: ${request.task.title}
stage: ${JSON.stringify(request.stage, undefined, 2)}
currentPrompt:
${formatPrompt(request.currentPrompt)}

DOM IDs:
${JSON.stringify(request.task.domIds, undefined, 2)}

Submission destination:
${JSON.stringify(request.submission, undefined, 2)}

Submission body shape:
{
  "appUrl": "https://public-url.example"
}

Status response shape (currentPrompt may be omitted when no next stage remains):
{
  "attemptId": "${request.attemptId}",
  "status": "running",
  "appUrl": "https://public-url.example",
  "currentPrompt": {
    "id": "prompt-id",
    "index": 2,
    "title": "Next stage title",
    "requirements": "Next stage requirements"
  },
  "passedPromptCount": 1,
  "promptCount": ${request.stage.totalCount}
}

Use the exact submission method, URL, and bearer token provided above. Use the same submitted app URL for every stage in this attempt.

After each submission, poll the provided statusUrl via GET every 5 to 10 seconds with the same bearer token in the Authorization header as Authorization: Bearer <token> until the status updates. If the status response contains a next currentPrompt, update the same app URL to satisfy that prompt, submit the same app URL again, and repeat this polling and updating process until no currentPrompt remains or the attempt has finished.

Do not use any bundled fallback application or hard-coded problem knowledge.`);
  return turn.finalResponse;
}

function formatPrompt(prompt: AttemptStartRequest['currentPrompt']): string {
  return `### Stage ${prompt.index}: ${prompt.title}
${prompt.requirements}`;
}

function codexCliPath(): string {
  if (process.env.CODEX_CLI_PATH) return process.env.CODEX_CLI_PATH;
  return join(process.cwd(), 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
}
