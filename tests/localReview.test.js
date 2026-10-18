import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLocalReview} from '../src/localReview.js';
import {CHECKLIST} from '../shared/rules.js';

test('Local review flags a dash and keeps the original facts', () => {
  const text = 'Please submit the report — by Friday.';
  const result = buildLocalReview('Memorandum', text);
  assert.equal(result.issues.some((issue) => issue.category === 'Punctuation'), true);
  assert.equal(result.revisedDocument.includes('—'), false);
  assert.equal(result.revisedDocument.includes('Friday'), true);
  assert.equal(result.checklist.length, CHECKLIST.length);
  assert.equal(new Set(result.checklist.map((row) => row.item)).size, CHECKLIST.length);
});

test('Local review does not invent issues for a short plain sentence', () => {
  const result = buildLocalReview('Email', 'Subject: Leave\n\nPlease file the form today.\n\nRegards');
  assert.equal(result.issues.some((issue) => issue.category === 'Punctuation'), false);
  assert.equal(result.overall.revisionLevel, 'Minor');
});
