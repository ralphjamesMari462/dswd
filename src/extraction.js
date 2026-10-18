import {LIMITS} from '../shared/rules.js';
let epoch=0;
const workers=new Set();
export async function stopOCR(){epoch++;const pending=[...workers];workers.clear();await Promise.allSettled(pending.map(async p=>(await p).terminate()));}
export async function imageToText(source,onProgress){
 const started=epoch;
 const {createWorker}=await import('tesseract.js');
 if(started!==epoch)throw new Error('Cancelled');
 const pending=createWorker('eng',1,{logger:m=>{if(started===epoch)onProgress(`${m.status}${m.progress!=null?` ${Math.round(m.progress*100)}%`:''}`);}});workers.add(pending);
 try{const worker=await pending;if(started!==epoch)throw new Error('Cancelled');const {data}=await worker.recognize(source,{}, {text:true,blocks:true});
 const uncertain=[];for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[])for(const word of line.words||[])if(word.confidence<65)uncertain.push(word.text);
 return {text:data.text,warning:`OCR confidence: ${Math.round(data.confidence)}%. Verify every name, date, amount and reference.${uncertain.length?' Uncertain words: '+uncertain.slice(0,30).join(', '):''}`};
 }catch{throw new Error('OCR could not read this page. Try a clearer image. The OCR language resources need internet on first use.');}finally{workers.delete(pending);try{await (await pending).terminate();}catch{}}
}
export async function loadImage(source){
 const img=new Image();img.src=source;await img.decode();if(img.naturalWidth*img.naturalHeight>LIMITS.imagePixels)throw new Error('Image is too large. Use an image below 24 megapixels.');return img;
}
export async function validateFile(file){
 if(file.size>LIMITS.fileBytes)throw new Error('Maximum file size is 15 MB.');
 const ext=file.name.split('.').pop().toLowerCase();if(!['jpg','jpeg','png','pdf','docx'].includes(ext))throw new Error('Choose a JPG, PNG, PDF or DOCX file.');
 const b=new Uint8Array(await file.slice(0,8).arrayBuffer());
 const valid=ext==='pdf'?String.fromCharCode(...b.slice(0,5))==='%PDF-':ext==='docx'?b[0]===80&&b[1]===75:ext==='png'?b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71:b[0]===255&&b[1]===216;
 if(!valid)throw new Error('The file contents do not match its extension.');return ext;
}
export async function extractFile(file,onProgress,checkCancelled=()=>{}){
 const ext=await validateFile(file);checkCancelled();const warnings=[];
 if(['jpg','jpeg','png'].includes(ext)){
  const url=URL.createObjectURL(file);try{await loadImage(url);checkCancelled();const result=await imageToText(url,onProgress);checkCancelled();return {text:result.text,pages:1,warnings:[result.warning]};}finally{URL.revokeObjectURL(url);}
 }
 const buffer=await file.arrayBuffer();checkCancelled();
 if(ext==='docx'){
  onProgress('Inspecting DOCX');const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(buffer);checkCancelled();
  // Check expansion before Mammoth inflates document XML.
  let total=0;const entries=Object.values(zip.files);if(entries.length>2000)throw new Error('DOCX has too many embedded parts.');
  for(const entry of entries){total+=entry._data?.uncompressedSize||0;if(total>40*1024*1024)throw new Error('DOCX expands beyond the 40 MB processing limit.');}
  if(!zip.file('word/document.xml'))throw new Error('This file is not a valid Word DOCX document.');
  const mammoth=await import('mammoth/mammoth.browser');onProgress('Extracting DOCX text');const result=await (mammoth.default||mammoth).extractRawText({arrayBuffer:buffer});checkCancelled();
  return {text:result.value,pages:null,warnings:['DOCX layout, text boxes, images and tables may need manual comparison with the original.',...result.messages.map(m=>m.message)]};
 }
 const pdfjs=await import('pdfjs-dist');const workerURL=(await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;pdfjs.GlobalWorkerOptions.workerSrc=workerURL;
 const task=pdfjs.getDocument({data:buffer,isEvalSupported:false});let pdf;
 try{pdf=await task.promise;checkCancelled();if(pdf.numPages>LIMITS.pages)throw new Error('Maximum PDF length is 10 pages.');const texts=[];
  for(let i=1;i<=pdf.numPages;i++){
   checkCancelled();onProgress(`Reading PDF page ${i} of ${pdf.numPages}`);const page=await pdf.getPage(i);const content=await page.getTextContent();
   let text='',lastY=null;for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>3)text+='\n';else if(text&&!text.endsWith('\n'))text+=' ';text+=item.str;if(item.hasEOL)text+='\n';lastY=y;}
   if(text.trim().length<20){const initial=page.getViewport({scale:1});const scale=Math.min(2,Math.sqrt(6000000/(initial.width*initial.height)));const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;checkCancelled();const result=await imageToText(canvas,m=>onProgress(`Page ${i}/${pdf.numPages}: ${m}`));text=result.text;warnings.push(`Page ${i}: ${result.warning}`);canvas.width=canvas.height=0;}
   texts.push(text.trim());page.cleanup();if(texts.join('\n').length>LIMITS.chars)throw new Error('Extracted document exceeds 30,000 characters. Split it into smaller documents.');
  }
  warnings.push('Check reading order and tables. Embedded images on otherwise text-based pages may need separate OCR.');return {text:texts.join('\n\n'),pages:pdf.numPages,warnings};
 }finally{if(pdf)await pdf.destroy();else await task.destroy();}
}
