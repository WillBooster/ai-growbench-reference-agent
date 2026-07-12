import { z } from 'zod';

import { json } from '@/lib/http';
import { acceptReferenceAttempt, agentMetadata } from '@/lib/referenceAgent';

const schema = z.object({
  attempt: z.object({
    id: z.string(),
  }),
  problemData: z.object({
    taskId: z.string(),
    mode: z.string().optional(),
    stage: z.object({
      currentIndex: z.number().optional(),
      passedCount: z.number(),
      totalCount: z.number(),
    }),
    currentPrompt: z
      .object({
        id: z.string(),
        index: z.number(),
        title: z.string(),
        requirements: z.string(),
      })
      .optional(),
    task: z.object({
      title: z.string(),
      domIds: z.record(z.string(), z.string()),
    }),
  }),
  deliveryProtocol: z.object({
    type: z.literal('agentApi'),
    submission: z.object({
      method: z.literal('POST'),
      url: z.string().url(),
      statusUrl: z.string().url(),
      token: z.string(),
    }),
  }),
});

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REFERENCE_AGENT_API_KEY ?? 'development-reference-agent-key';
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => {});
  if (body === undefined) return json({ error: 'Invalid JSON body' }, { status: 400 });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.message }, { status: 400 });
  await acceptReferenceAttempt(parsed.data);
  return json({ status: 'accepted', agentMetadata }, { status: 202 });
}
