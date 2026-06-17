import Anthropic from '@anthropic-ai/sdk';
import { Extraction, FIELD_KEYS } from './types';

const EXTRACTION_PROMPT = `You are an expert sales tax exemption certificate reviewer.
Extract the following fields from the attached document. For each field, report a
confidence between 0 and 1 reflecting how certain you are about the extracted value.
Use "not found" with low confidence when a field is absent or illegible.

Fields:
- purchaserName, purchaserAddress, sellerName
- state: 2-letter issuing state, or the governing state for multistate forms
- exemptionReason: e.g. Resale, Manufacturing, Government, Nonprofit
- taxIdNumber: permit / registration / tax ID number
- signaturePresent: "yes" or "no"
- issueDate, expirationDate: ISO format if possible, "none" if not applicable

Respond with ONLY a JSON object of the shape:
{ "<field>": { "value": string, "confidence": number }, ... }`;

export async function extractWithClaude(
  fileBase64: string,
  mediaType: string
): Promise<Extraction> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fileBlock =
    mediaType === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
        }
      : {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: fileBase64 },
        };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        // Cast: document blocks may lag behind the SDK's published types.
        content: [fileBlock as never, { type: 'text', text: EXTRACTION_PROMPT }],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Be tolerant of stray prose or code fences around the JSON object.
  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const json = match ? match[0] : cleaned;

  let parsed: Record<string, { value?: string; confidence?: number }>;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Model did not return valid JSON for the extraction.');
  }

  const extraction = {} as Extraction;
  for (const key of FIELD_KEYS) {
    const field = parsed[key] ?? {};
    extraction[key] = {
      value: typeof field.value === 'string' ? field.value : 'not found',
      confidence:
        typeof field.confidence === 'number'
          ? Math.max(0, Math.min(1, field.confidence))
          : 0.3,
    };
  }
  return extraction;
}
