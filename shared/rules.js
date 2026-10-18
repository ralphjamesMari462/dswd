export const SOURCE='https://fo8.dswd.gov.ph/km-portal/wp-content/uploads/2024/04/DSWD-Handbook-of-Style_2020.pdf';
export const DOCUMENT_RULES={
 Memorandum:['TO or FOR (rank-dependent; do not infer rank), FROM, SUBJECT, DATE','purpose, instructions and action','concise block paragraphs'],
 Endorsement:['recipient','referenced document','endorsement purpose and supporting context','requested action'],
 Letter:['date and recipient','salutation','subject if appropriate','body, closing and signature'],
 Email:['subject','recipient if supplied','professional greeting','clear message and requested action','closing'],
 Advisory:['intended audience','subject and announcement','important instructions','effective date if applicable'],
 'Meeting Minutes':['meeting date','venue or platform','attendees and agenda','discussion summaries','recorded decisions and action items with responsible personnel where applicable'],
 Report:['title and purpose','background','findings and supporting information','conclusions and recommendations where applicable'],
 'Executive Brief':['subject or issue','relevant background and essential facts','implications','proposed action only if provided','concise presentation']
};
export const TYPES=Object.keys(DOCUMENT_RULES);
export const OFFICIAL_RULES=[
 {source:SOURCE,pages:'11–12',rule:'Use American English, concise language, clear meaning and consistent information.'},
 {source:SOURCE,pages:'27–28',rule:'For memos, use concise subjects and block paragraphs. TO is for equal/lower rank and FOR for higher rank; flag unknown rank rather than guess. Avoid redundant compliance/guidance closing phrases. Check final page layout manually.'}
];
export const CHECKLIST=['Appropriate administrative tone','Grammar and spelling','Punctuation','Clear purpose','Appropriate structure','Concise wording','No unnecessary repetition','Clear instructions where applicable','Responsible office/personnel identified where needed','Deadlines specified where required and available','Original facts preserved','Document references preserved','No invented information','No em dashes or en dashes'];
export const CATEGORIES=['Grammar','Spelling','Punctuation','Tone','Clarity','Redundancy','Document Structure','Missing Information','Factual Consistency'];
export const LEVELS=['Minor','Moderate','Major'];
export const STATUSES=['Passed','Needs Review','Not Applicable'];
export const LIMITS={chars:30000,fileBytes:15*1024*1024,pages:10,imagePixels:24000000};
