import { json } from '@/lib/http';

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REFERENCE_AGENT_API_KEY ?? 'development-reference-agent-key';
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  console.error('Reference agent received Ranked AA failure feedback:', body);
  return json({ status: 'received' });
}
