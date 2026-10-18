import {CHECKLIST, DOCUMENT_RULES} from '../shared/rules.js';

const DASH = /\s*[—–]\s*/g;
const CUES = {
  Memorandum: [['TO or FOR', /\b(TO|FOR)\b/], ['FROM', /\bFROM\b/], ['SUBJECT', /\bSUBJECT\b/], ['DATE', /\bDATE\b/]],
  Endorsement: [['recipient', /\b(TO|FOR)\b/], ['referenced document', /\b(memorandum|letter|dated|reference)\b/i]],
  Letter: [['salutation', /\b(dear|sir|madam)\b/i], ['closing', /\b(sincerely|respectfully|truly)\b/i]],
  Email: [['subject', /\bsubject\b/i], ['closing', /\b(regards|sincerely|respectfully)\b/i]],
  Advisory: [['announcement', /\b(advisory|announces|informed|effective)\b/i]],
  'Meeting Minutes': [['attendees or decisions', /\b(attendees|present|decision|action)\b/i]],
  Report: [['findings or purpose', /\b(purpose|background|findings|recommendation)\b/i]],
  'Executive Brief': [['issue or background', /\b(issue|subject|background|implication)\b/i]]
};

function clip(value) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 280 ? `${text.slice(0, 277)}...` : text;
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

export function buildLocalReview(type, text) {
  const issues = [];
  const dashLines = [...new Set(text.split('\n').map((line) => line.trim()).filter((line) => /[—–]/.test(line)))].slice(0, 3);
  if (dashLines.length) {
    issues.push({
      category: 'Punctuation',
      original: dashLines.map(clip).join('\n'),
      explanation: 'An em dash or en dash appears in the text. The local preference is to avoid both.',
      correction: 'Replace each dash with a comma, colon, parentheses, or a new sentence, unless it belongs to an exact quotation or identifier.',
      severity: 'Minor'
    });
  }
  const long = sentences(text).filter((sentence) => sentence.split(/\s+/).length > 40).slice(0, 3);
  for (const sentence of long) {
    issues.push({
      category: 'Clarity',
      original: clip(sentence),
      explanation: 'This sentence is very long, so the action or point is harder to follow.',
      correction: 'Split it into shorter sentences and keep the original facts in place.',
      severity: 'Minor'
    });
  }
  const seen = new Set();
  for (const line of text.split('\n').map((item) => item.trim()).filter((item) => item.length > 40)) {
    const key = line.toLowerCase();
    if (seen.has(key)) {
      issues.push({
        category: 'Redundancy',
        original: clip(line),
        explanation: 'This line is repeated.',
        correction: 'Keep one occurrence unless the repetition is required.',
        severity: 'Minor'
      });
      break;
    }
    seen.add(key);
  }
  const missing = (CUES[type] || []).filter(([, pattern]) => !pattern.test(text)).map(([label]) => label);
  if (missing.length && DOCUMENT_RULES[type]) {
    issues.push({
      category: 'Document Structure',
      original: '',
      explanation: `A ${type} often includes ${missing.join(', ')}. This is a structure suggestion, not a confirmed requirement.`,
      correction: 'Add a missing label only when the document type calls for it. Do not invent a rank, date, name, or action.',
      severity: 'Minor'
    });
  }
  const revisedDocument = text.replace(DASH, ', ');
  const checklist = CHECKLIST.map((item) => {
    if (item === 'No em dashes or en dashes') {
      return {item, status: dashLines.length ? 'Needs Review' : 'Passed', note: dashLines.length ? 'An em dash or en dash is in the extracted text. The revision replaces it with a comma.' : 'No em dash or en dash found.'};
    }
    if (item === 'Appropriate structure') {
      return {item, status: missing.length ? 'Needs Review' : 'Passed', note: missing.length ? `Look for: ${missing.join(', ')}.` : 'The expected labels were found. Still confirm the format.'};
    }
    if (item === 'Concise wording') {
      return {item, status: long.length ? 'Needs Review' : 'Passed', note: long.length ? 'At least one very long sentence was found.' : 'No sentence over 40 words was found. This is only a length check.'};
    }
    if (item === 'Clear purpose') {
      return {item, status: 'Needs Review', note: 'A local check cannot judge whether the purpose is clear.'};
    }
    if (item === 'No unnecessary repetition') {
      return {item, status: issues.some((issue) => issue.category === 'Redundancy') ? 'Needs Review' : 'Passed', note: 'Only exact repeated lines were checked.'};
    }
    if (item === 'Original facts preserved' || item === 'No invented information' || item === 'Document references preserved') {
      return {item, status: 'Passed', note: 'The local check does not add or remove facts. Still compare names, dates, amounts, and references.'};
    }
    return {item, status: 'Needs Review', note: 'Not judged by the local check. Verify it yourself, or turn on AI review.'};
  });
  return {
    overall: {
      assessment: issues.length
        ? `Local style check found ${issues.length} ${issues.length === 1 ? 'item' : 'items'} to look at. This is not an AI review, and it does not rewrite the document.`
        : 'Local style check found no dashes, repeated lines, or very long sentences. This is not an AI review of grammar, tone, or meaning.',
      strengths: ['Your extracted text stays in place. Only dash characters are swapped for commas in the revision.'],
      improvements: issues.length ? issues.map((issue) => issue.explanation) : ['Add an AI key on the computer running this app for grammar, tone, and a full revision.'],
      revisionLevel: issues.length > 3 ? 'Moderate' : 'Minor',
      humanReview: 'Verify every name, date, amount, and reference before you use the text.'
    },
    issues,
    revisedDocument: revisedDocument.trim() || text,
    checklist,
    facts: []
  };
}
