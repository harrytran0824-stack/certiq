import { Extraction } from './types';

/**
 * Document preview for the review pane.
 *
 * Real uploads carry the actual file (PDF or image) as a data URL. The seeded
 * sample documents have no underlying file, so we render a representative
 * certificate image from the extracted values — clearly watermarked SAMPLE so
 * it's never mistaken for a real filing. A reviewer can then compare the AI's
 * extraction against the document, which is the whole point of the pane.
 */
export interface DocumentPreview {
  kind: 'pdf' | 'image' | 'sample';
  dataUrl: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build a representative certificate image (SVG) from extracted fields. */
export function sampleDocDataUrl(extraction: Extraction, fileName: string): string {
  const v = (k: keyof Extraction) => esc(extraction[k].value);
  // Simulate a poor scan when the source was clearly low quality.
  const lowres =
    extraction.taxIdNumber.confidence < 0.6 ||
    /scan|lowres|\.jpg|\.jpeg/i.test(fileName);
  const signed = extraction.signaturePresent.value.trim().toLowerCase() === 'yes';

  const row = (y: number, label: string, value: string) => `
    <text x="48" y="${y}" font-size="11" fill="#6b7280" font-family="Helvetica, Arial, sans-serif">${esc(
      label
    )}</text>
    <text x="48" y="${y + 18}" font-size="15" fill="#111827" font-family="Helvetica, Arial, sans-serif" font-weight="600">${value}</text>
    <line x1="48" y1="${y + 26}" x2="564" y2="${y + 26}" stroke="#e5e7eb" stroke-width="1"/>
  `;

  const inner = `
    <rect x="0" y="0" width="612" height="792" fill="#ffffff"/>
    <rect x="24" y="24" width="564" height="744" fill="none" stroke="#d1d5db" stroke-width="1.5"/>

    <rect x="24" y="24" width="564" height="78" fill="#0f3d6e"/>
    <text x="48" y="62" font-size="20" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-weight="700">${v(
      'state'
    )} DEPARTMENT OF REVENUE</text>
    <text x="48" y="86" font-size="13" fill="#cfe0f3" font-family="Helvetica, Arial, sans-serif">Sales &amp; Use Tax Exemption Certificate</text>

    <text x="48" y="138" font-size="12" fill="#374151" font-family="Helvetica, Arial, sans-serif">The undersigned purchaser certifies the following transaction is exempt from sales tax.</text>

    ${row(178, 'PURCHASER NAME', v('purchaserName'))}
    ${row(230, 'PURCHASER ADDRESS', v('purchaserAddress'))}
    ${row(282, 'SELLER NAME', v('sellerName'))}
    ${row(334, 'REASON FOR EXEMPTION', v('exemptionReason'))}
    ${row(386, 'TAX ID / PERMIT NUMBER', v('taxIdNumber'))}
    ${row(438, 'ISSUE DATE', v('issueDate'))}
    ${row(490, 'EXPIRATION DATE', v('expirationDate'))}

    <text x="48" y="600" font-size="11" fill="#6b7280" font-family="Helvetica, Arial, sans-serif">AUTHORIZED SIGNATURE</text>
    <line x1="48" y1="648" x2="320" y2="648" stroke="#9ca3af" stroke-width="1.2"/>
    ${
      signed
        ? `<text x="60" y="640" font-size="26" fill="#1e3a8a" font-family="'Snell Roundhand','Apple Chancery',cursive" font-style="italic">${v(
            'purchaserName'
          )}</text>`
        : `<text x="60" y="638" font-size="13" fill="#b91c1c" font-family="Helvetica, Arial, sans-serif" font-style="italic">— no signature on file —</text>`
    }

    <text x="48" y="724" font-size="10" fill="#9ca3af" font-family="Helvetica, Arial, sans-serif">${esc(
      fileName
    )}</text>
    <text x="306" y="430" font-size="120" fill="#000000" fill-opacity="0.05" font-family="Helvetica, Arial, sans-serif" font-weight="700" text-anchor="middle" transform="rotate(-30 306 430)">SAMPLE</text>
  `;

  const svg = lowres
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792">
        <defs><filter id="b"><feGaussianBlur stdDeviation="0.6"/></filter></defs>
        <rect width="612" height="792" fill="#eceae4"/>
        <g filter="url(#b)" opacity="0.92" transform="rotate(-1.2 306 396)">${inner}</g>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792">${inner}</svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
