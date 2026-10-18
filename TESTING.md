# Verification record

Date: October 18, 2026.

## Executed

`node --test tests/core.test.js`: **18 passed, 0 failed**.

Coverage:
- Eight individual tests accept valid input for each document type and check that each has its own guidance.
- Strict boolean consent and verification, unknown types, empty text, invalid types and oversized text.
- Unchanged facts, changed names/amounts/deadlines/codes, invented numeric deadlines and removed quotations.
- Fourteen distinct checklist items.
- Unsupported extensions, mismatched file signatures, file size limit and supported signatures.

The first run found one failure: a changed numeric day could be hidden by a substring match within an unrelated amount. Exact candidate-set comparison replaced substring matching. The second run passed all 18 tests.

These tests validate input and candidate checks, not AI writing quality or full end-to-end review for the eight types.

## Blocked or unverified

- Dependency installation: npm registry hostname could not resolve. Offline installation also failed because necessary packages were not cached. A package lock could not be generated. Run `npm install` and retain the resulting package-lock.json before deployment.
- `npm run build`: not executed successfully because dependencies are unavailable.
- `node --test tests/backend.test.js`: not run because Express/Ajv dependencies are unavailable.
- Live AI request and eight-type output quality: not tested; API credential required.
- Browser rendering, responsive layout and copy interaction: not visually verified.
- Image OCR, PDF and DOCX extraction: source implemented but not exercised with real files here.
- Camera capture, permission errors, crop/rotate, multi-page ordering and physical-device/mobile checks: not exercised here.
- No claim of complete acceptance testing or production readiness is made.

## Run after installing

```sh
npm test
npm run build
npm run dev
```

## Manual acceptance checklist

Use only fictional or anonymized content. Check each of the eight document types with complete and incomplete examples.

- [ ] Paste a document, confirm verification and consent, and complete a real AI review.
- [ ] Check grammar, tone and structure issues are explained without inventing fields.
- [ ] Check exactly four primary result sections and fourteen checklist entries.
- [ ] Upload readable JPG and PNG; verify OCR progress, uncertainty and editable text.
- [ ] Upload a multi-page text PDF; check reading order and paragraph breaks.
- [ ] Upload a multi-page scanned PDF; check OCR page order.
- [ ] Upload DOCX with headings/numbering; compare extraction to the original.
- [ ] Reject unsupported, corrupted, oversized and over-ten-page files.
- [ ] Capture multiple pages, retake, rotate, crop, reorder, remove and extract.
- [ ] Deny camera permission; confirm usable upload alternative.
- [ ] Verify camera closes after capture, switching input mode, or Clear All.
- [ ] Change names, amounts, dates and codes in the revision; check highlighted differences.
- [ ] Confirm changing source/type clears the prior review and consent.
- [ ] Confirm editing the revision invalidates the old checklist.
- [ ] Copy the revision and paste it elsewhere; check clipboard-denied feedback.
- [ ] Clear while OCR or AI is running; ensure late results do not reappear.
- [ ] Refresh after entering content; confirm no document/result/history is restored.
- [ ] Remove AI configuration, use a rejected key, trigger provider failure and timeout; no fake successful results should appear.
- [ ] Inspect Network: original file bytes must not be uploaded; only explicitly approved text goes to `/api/review`.
- [ ] Inspect server logs and browser storage: no document text/results should be saved.
- [ ] At 375px and desktop widths, check readable layout with no page-level horizontal scrolling.
- [ ] Test keyboard navigation, labels, error announcements and focus visibility.

Suggested fictional source:

> TO: Maria Santos
> FROM: Ana Reyes
> DATE: October 18, 2026
> SUBJECT: Report submission
>
> Please submit Report No. DSWD-2026-014 by October 20, 2026. The approved amount is PHP 25,000. The team are requested to send the report to the Planning Office.

Check that names, deadline, office, reference and amount remain intact; grammar can be improved. Also test a sentence that says an action is merely proposed, ensuring the revision does not describe it as approved.
