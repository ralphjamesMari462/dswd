// Conservative exact-value comparison, not a proof of semantic equivalence.
export function anchors(text){
 const values=new Set();
 const patterns=[/\b\d[\d,.:/\-]*(?:\s*(?:%|million|billion))?/g,/\b[A-Z]{2,}(?:[-/]\w+)*\b/g,/\b(?:[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+){1,5})\b/gu,/[“"]([^”"\n]+)[”"]/g,/\b(?:Republic Act|Administrative Order|Memorandum|Circular|Reference|Ref\.?|No\.?)\s*(?:No\.?\s*)?[A-Z0-9][\w./-]*/gi,/(?:₱|PHP|Php|P)\s*\d[\d,.]*/g];
 for(const p of patterns) for(const m of text.matchAll(p)) values.add(m[0].trim());
 return [...values];
}
export function compareFacts(original,revised){
 const before=anchors(original),after=anchors(revised);
 const oldValues=new Set(before),newValues=new Set(after);
 return [...before.filter(v=>!newValues.has(v)).map(value=>({kind:'Missing or changed',value})),...after.filter(v=>!oldValues.has(v)).map(value=>({kind:'New or changed',value}))];
}
