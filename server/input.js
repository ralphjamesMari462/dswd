import {TYPES,LIMITS} from '../shared/rules.js';
export function validateInput(body){
 if(!body||!TYPES.includes(body.documentType)||typeof body.text!=='string'||!body.text.trim()||body.text.length>LIMITS.chars) throw new Error('Choose a document type and enter 1–30,000 characters.');
 if(body.consent!==true||body.verified!==true) throw new Error('Verify the text and consent to AI processing before reviewing.');
 return {text:body.text,documentType:body.documentType};
}
