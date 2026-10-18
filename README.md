# DSWD Administrative Writing Checker

A personal React + Vite application with an Express review API. No database, login, document history or saved uploads. This is independent writing assistance, not an official DSWD service or compliance certification.

## Delivery status

Source implementation is provided. **This build has not been run end to end in the delivery environment.** The environment could not resolve the npm registry and did not have the necessary packages in its offline cache. Do not treat the source package as a verified production release.

- 18 dependency-free core tests passed using Node.js 24.
- Non-JSX JavaScript syntax checks passed (see TESTING.md).
- Dependency installation, Vite compilation, backend integration tests and browser tests remain to be run on a machine with internet access.
- Live review requires your own server-side AI credential and a compatible structured-output model. No review results are fabricated when configuration is missing.
- Camera, multi-page OCR and mobile behavior need manual verification on actual devices.

## Install and run

Install Node.js 22.12 or later (Node 24 recommended), including npm. Extract this package, open a terminal in its folder, and run:

```sh
npm install
```

In Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` in a local editor:

```dotenv
AI_API_KEY=your-own-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
AI_PROVIDER_LABEL=OpenAI
PORT=80
HOST=0.0.0.0
```

Do not paste your key into the app, commit `.env`, or use `VITE_` variables for secrets. A ChatGPT subscription does not itself configure this application’s API access. Your provider’s API access, supported model and billing must be configured separately.

Start development mode:

```sh
npm run dev
```

Open **http://DSWD_Sanchez**. On another device connected to the same network, use that same address, or the network address printed in the terminal. Leave the terminal running; Ctrl+C stops it.

For a compiled local build:

```sh
npm run build
npm start
```

The local server listens on this computer’s network interfaces and answers to the name DSWD_Sanchez. That copy stops when the computer is off. A public HTTPS copy can be hosted on Vercel; see below. Anyone who can reach a running copy can use the review endpoint.

## Deploy on Vercel

The site is a Vite frontend. `/api/config` and `/api/review` run as one Vercel Function. Uploaded files, OCR, and the camera stay in the browser and are not saved. Do not commit `.env` or `certs/`.

On Vercel, set only these environment variables for Production:

- `AI_API_KEY`
- `AI_BASE_URL` (`https://api.openai.com/v1` unless you use another HTTPS provider)
- `AI_MODEL` (`gpt-4.1-mini` or another model that supports strict JSON schema)
- `AI_PROVIDER_LABEL` (the name shown in the consent notice)

Leave `PORT`, `HOST`, and `CAMERA_URL` unset. Choose Node.js 22. For a custom domain, set `APP_HOSTS` to that hostname. A review stops after 90 seconds, and the function is limited to 120 seconds. Set a spending limit in the AI provider dashboard as well; the app’s request limits apply to each server instance and are not a billing cap.

If no key is configured, extraction remains available and the page shows setup instructions. After changing environment variables, restart the server and reload the page.

## Deploy the page on GitHub Pages

GitHub Pages publishes the Vite frontend only. The repository name must be `dswd-sanchez`, so the site is served at `https://YOUR_USER.github.io/dswd-sanchez/`. Pushing to `main` runs `.github/workflows/deploy.yml`, builds `dist/`, and publishes that folder. In the repository settings, set Pages to **GitHub Actions**.

The build does not include `AI_API_KEY`. Paste, upload, scanning, OCR, and the local style check run in the browser. AI review calls `VITE_API_BASE_URL`, a public HTTPS address such as `https://dswd-sanchez.vercel.app`. Add that address as a GitHub Actions variable named `VITE_API_BASE_URL` before building. Leave it empty until the API is deployed.

On the API host, set `API_ALLOWED_ORIGINS` to `https://YOUR_USER.github.io` and keep `AI_API_KEY` only in that server’s environment. If the API hostname is not assigned by Vercel, also set `APP_HOSTS` to that hostname.

## Features implemented in source

1. Eight document types: Memorandum, Endorsement, Letter, Email, Advisory, Meeting Minutes, Report, Executive Brief.
2. Paste text, image/PDF/DOCX upload, drag-and-drop, preview where supported, processing status and editable extracted text.
3. Browser OCR using Tesseract.js, PDF text extraction and scanned-page OCR using PDF.js, DOCX extraction with Mammoth.
4. Camera capture with rear-camera preference, up to ten ordered pages, retake, remove, rotate, crop and reorder controls.
5. Explicit text verification and separate provider consent before each review; changing text/type invalidates results and consent.
6. Server-side AI configuration, structured JSON response schema, output validation, duplicate-submission lock, timeouts, errors, request limits and same-origin access.
7. Four result sections: Overall Assessment; Issues and Recommended Corrections; Revised Document; Final Compliance Checklist.
8. Editable revision, clipboard copying, original/revised comparison and highlighted candidate factual differences.
9. Clear All cancels pending work, clears source/result/scan state, resets file inputs and stops the camera. Reload clears session state. Clipboard copies are outside application state and are not cleared.
10. No document-content logging, browser storage, analytics, database, accounts or document history.

## Rules and references

The verified primary reference is the [DSWD Handbook of Style (2020)](https://fo8.dswd.gov.ph/km-portal/wp-content/uploads/2024/04/DSWD-Handbook-of-Style_2020.pdf), accessed October 18, 2026. Printed pages 11–12 support American English, clarity, concision and consistency; printed pages 27–28 address memo structure. Memo TO/FOR depends on rank; unknown rank is flagged, not inferred. Page layout and memo length must be checked manually after formatting.

`shared/rules.js` separates the small verified handbook rule set from context-dependent structure suggestions. The latter are not asserted as mandatory DSWD requirements. The no-em/en-dash rule is a personal preference. Exact quotations and identifiers take priority over this preference and should be flagged if they conflict.

This is not a comprehensive encoding of every DSWD issuance. Unverified rules must remain suggestions. The app does not verify the validity of cited laws or policy references.

## AI compatibility and privacy

The backend uses an OpenAI-compatible Chat Completions endpoint with strict `json_schema` output and `store:false`. An alternative provider must support that request format; the app reports an error rather than silently falling back to fake reviews. Local/private providers can use an HTTP loopback endpoint if compatible. `AI_API_KEY` must still be set to the configured provider's required value.

Original files are processed in the browser. Approved document text and generated results necessarily exist temporarily in backend/provider memory during the request, and the results return to browser memory. The application does not write them to persistent storage or log them. The provider may retain or process content according to its policies; `store:false` is not a guarantee of zero retention. Use anonymized content or an institutionally approved private service for confidential records.

OCR may fetch worker/core/language resources on first use. These requests download resources, not document images. OCR is English-first; Filipino/local-language passages and complex layouts need careful manual correction. Third-party resource availability can affect OCR. Application source/dependencies and OCR language resources may be cached; documents are not deliberately cached by this app.

Limits: 15 MB per file, ten PDF/scanned pages, 30,000 input characters, 24-megapixel image check, bounded PDF render size, DOCX ZIP expansion guard, 160 KB JSON requests, five review requests per minute, 20 per hour, and a 90-second provider timeout.

## Factual safeguards and limitations

The AI receives explicit preservation and prompt-injection resistance instructions. Server validation checks the output structure. A deterministic comparison flags changed/missing/new numbers, capitalized-name candidates, amounts, references and quotations. The AI also reports semantic changes involving decisions and commitments.

These checks are conservative heuristics, not proof. They may flag harmless formatting changes and miss a semantic change. The facts, references and invented-information checklist items always require human review. Editing the revision marks the earlier checklist outdated and recalculates local factual differences.

PDF extraction follows the PDF text order and may misread columns/tables. A page with fewer than 20 extracted characters is OCRed; an image embedded in a text-rich page may require separate OCR. DOCX page counts are not reliable from raw text and are shown as unavailable. Exact fonts, tab stops and rich formatting are not preserved in the plain-text editor; paragraph breaks and numbering are retained where extraction permits.

## Files

| Location | Purpose |
|---|---|
| `src/main.jsx`, `src/style.css` | Responsive input page, consent and session state |
| `src/extraction.js` | Local file validation, PDF/DOCX extraction and OCR |
| `src/Scanner.jsx` | Camera and scanned-page editing |
| `src/Results.jsx` | Four review sections, editing, copy and comparison |
| `shared/rules.js`, `shared/facts.js` | Rule provenance, document types and fact candidates |
| `server/app.js`, `server/index.js` | Local Express API and Vite/compiled frontend serving |
| `api/[...path].js`, `vercel.json` | Public Vercel Function and static-site configuration |
| `.github/workflows/deploy.yml` | GitHub Pages build and publication of `dist/` |
| `server/input.js`, `server/review.js`, `server/schema.js` | Consent, prompt, AI integration and validation |
| `tests/core.test.js`, `tests/backend.test.js` | Automated core and backend tests |
| `.env.example`, `.gitignore`, `package.json`, `vite.config.js`, `index.html` | Setup and configuration |
| `TESTING.md` | Actual test results and manual acceptance checklist |

No existing project files were modified; this project was created in its own directory. No hosting deployment was performed.
