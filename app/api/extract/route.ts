import { NextResponse } from 'next/server';
import { extractWithClaude } from '@/lib/anthropic';
import { mockExtract } from '@/lib/mock';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ExtractRequest {
  fileName: string;
  fileBase64?: string;
  mediaType?: string;
}

export async function POST(req: Request) {
  let body: ExtractRequest;
  try {
    body = (await req.json()) as ExtractRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!hasKey || !body.fileBase64 || !body.mediaType) {
    return NextResponse.json({
      extraction: mockExtract(body.fileName),
      mode: 'mock',
    });
  }

  try {
    const extraction = await extractWithClaude(body.fileBase64, body.mediaType);
    return NextResponse.json({ extraction, mode: 'live' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
