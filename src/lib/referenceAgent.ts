import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Codex } from '@openai/codex-sdk';

export interface AttemptStartRequest {
  attempt: {
    id: string;
  };
  problemData: {
    taskId: string;
    stage: {
      currentIndex?: number;
      passedCount: number;
      totalCount: number;
    };
    currentPrompt?: {
      id: string;
      index: number;
      title: string;
      requirements: string;
    };
    task: {
      title: string;
      domIds: Record<string, string>;
    };
  };
  deliveryProtocol: {
    type: 'agentApi';
    submission: {
      method: 'POST';
      url: string;
      statusUrl: string;
      token: string;
    };
  };
}

export const agentMetadata = {
  agentName: 'Codex SDK Reference Agent',
  modelName: codexModel(),
  skillSetName: 'ai-growbench-reference-agent',
} as const;

const processed = new Set<string>();

export async function acceptReferenceAttempt(request: AttemptStartRequest): Promise<void> {
  if (processed.has(request.attempt.id)) return;
  processed.add(request.attempt.id);
  void runCodexGeneration(request).catch((error) => {
    console.error('Codex reference generation failed:', error);
  });
}

async function runCodexGeneration(request: AttemptStartRequest): Promise<string> {
  const workspace = await createAttemptWorkspace(request.attempt.id);
  try {
    return await runCodexTurn(request, workspace);
  } finally {
    // Generated apps routinely include node_modules, so a long-lived process would fill the disk
    // without this cleanup; the deployed app itself lives on the hosting provider, not here.
    await rm(workspace, { recursive: true, force: true });
  }
}

async function runCodexTurn(request: AttemptStartRequest, workspace: string): Promise<string> {
  const codex = new Codex({ codexPathOverride: codexCliPath() });
  const thread = codex.startThread({
    approvalPolicy: 'never',
    model: codexModel(),
    networkAccessEnabled: true,
    sandboxMode: 'workspace-write',
    // The per-attempt scratch directory is created outside any git repository on purpose.
    skipGitRepoCheck: true,
    workingDirectory: workspace,
  });
  const { stage, currentPrompt, task } = request.problemData;
  const turn = await thread.run(`You are the generic AI Growbench reference agent.

Implement software that satisfies the requirements below without assuming any fixed problem domain. Build the requested application, deploy it to a publicly reachable URL (localhost is rejected by the judge), then submit that URL to AI Growbench using the submission API.

Deployment rules:
- Deploy to a fresh deployment target dedicated to this attempt (e.g. a newly created project). Never reuse, link to, or overwrite an existing project or deployment, even if one looks related.
- Before submitting, verify with HTTP requests that the public URL is serving the app you just built (not an older deployment) and that its endpoints respond correctly. Submit only after this verification succeeds.

attemptId: ${request.attempt.id}
taskId: ${request.problemData.taskId}
taskTitle: ${task.title}
stage: ${JSON.stringify(stage, undefined, 2)}
currentPrompt:
${formatPrompt(currentPrompt)}

DOM IDs:
${JSON.stringify(task.domIds, undefined, 2)}

Submission destination:
${JSON.stringify(request.deliveryProtocol.submission, undefined, 2)}

Submission body shape:
{
  "appUrl": "https://public-url.example",
  "artifacts": {
    "sourceCodeUrl": "https://public-url.example/source.tar.gz"
  }
}

For the final stage (stage.currentIndex equals stage.totalCount), artifacts.sourceCodeUrl is REQUIRED: upload a zip or tar.gz archive of the full source code to a public URL whose path ends with .zip, .tar.gz, or .tgz (serving the archive from the deployed app itself also works), and pass it as artifacts.sourceCodeUrl. A final-stage submission without it is rejected with a retryable error, so resubmit with the artifact. artifacts may be omitted for non-final stages.

Status response shape (currentPrompt may be omitted when no next stage remains):
{
  "attempt": {
    "id": "${request.attempt.id}",
    "status": "running",
    "appUrl": "https://public-url.example"
  },
  "problemData": {
    "stage": {
      "currentIndex": 2,
      "passedCount": 1,
      "totalCount": ${stage.totalCount}
    },
    "currentPrompt": {
      "id": "prompt-id",
      "index": 2,
      "title": "Next stage title",
      "requirements": "Next stage requirements"
    }
  }
}

Use the exact submission method, URL, and bearer token provided above. Use the same submitted app URL for every stage in this attempt.

After each submission, poll the provided statusUrl via GET every 5 to 10 seconds with the same bearer token in the Authorization header as Authorization: Bearer <token> until problemData.stage.passedCount increases, problemData.currentPrompt.index changes, problemData.currentPrompt is omitted, or attempt.status becomes failed, succeeded, or timed_out. If the status response contains a next problemData.currentPrompt, update the same app URL to satisfy that prompt, submit the same app URL again, and repeat this polling and updating process until no currentPrompt remains or the attempt has finished.

Do not use any bundled fallback application or hard-coded problem knowledge.`);
  return turn.finalResponse;
}

/**
 * Runs Codex in a per-attempt scratch directory so generated apps never pollute this repository
 * and parallel attempts cannot overwrite each other. Bundled skills are copied along because
 * Codex discovers them relative to its working directory.
 */
async function createAttemptWorkspace(attemptId: string): Promise<string> {
  // The attempt id crosses a trust boundary (HTTP body), so strip anything path-like before
  // embedding it in the temp directory prefix.
  const safeAttemptId = attemptId.replaceAll(/[^\w-]/gu, '').slice(0, 80);
  const workspace = await mkdtemp(join(tmpdir(), `ai-growbench-${safeAttemptId}-`));
  await cp(join(process.cwd(), '.agents'), join(workspace, '.agents'), { recursive: true, force: true }).catch(() => {
    // The .agents directory is optional; Codex still runs without bundled skills.
  });
  return workspace;
}

function formatPrompt(prompt: AttemptStartRequest['problemData']['currentPrompt']): string {
  if (!prompt) return '(no current prompt)';
  return `### Stage ${prompt.index}: ${prompt.title}
${prompt.requirements}`;
}

function codexModel(): string {
  return process.env.CODEX_MODEL ?? 'gpt-5.6-sol';
}

function codexCliPath(): string {
  if (process.env.CODEX_CLI_PATH) return process.env.CODEX_CLI_PATH;
  return join(process.cwd(), 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
}
