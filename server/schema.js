import {CHECKLIST,CATEGORIES,LEVELS,STATUSES} from '../shared/rules.js';
const str={type:'string',maxLength:60000};
const object=(properties)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const list=(items,maxItems=100)=>({type:'array',items,maxItems});
export const reviewSchema=object({
 overall:object({assessment:str,strengths:list(str,20),improvements:list(str,20),revisionLevel:{type:'string',enum:LEVELS},humanReview:str}),
 issues:list(object({category:{type:'string',enum:CATEGORIES},original:str,explanation:str,correction:str,severity:{type:'string',enum:LEVELS}})),
 revisedDocument:{type:'string',minLength:1,maxLength:60000},
 checklist:{...list(object({item:{type:'string',enum:CHECKLIST},status:{type:'string',enum:STATUSES},note:str}),14),minItems:14},
 facts:list(object({original:str,revised:str,status:{type:'string',enum:['Preserved','Needs Review']},reason:str}))
});
