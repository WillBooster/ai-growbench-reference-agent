import { z } from 'zod';

import { json } from '@/lib/http';
import { acceptReferenceAttempt } from '@/lib/referenceAgent';

const schema = z.object({
  attemptId: z.string(),
  taskId: z.string(),
  mode: z.string().optional(),
  requirements: z.string(),
  domIds: z.record(z.string(), z.string()),
  submission: z.object({
    method: z.literal('POST'),
    url: z.string().url(),
    token: z.string(),
  }),
});

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REFERENCE_AGENT_API_KEY ?? 'development-reference-agent-key';
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return json({ error: parsed.error.message }, { status: 400 });
  await acceptReferenceAttempt(parsed.data);
  return json({ status: 'accepted' }, { status: 202 });
}
