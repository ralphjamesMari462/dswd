import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {analyze,validateInput} from './review.js';
import {isAllowedHost} from './network.js';
export function createApp(env=process.env,reviewer=analyze){
 const app=express();app.disable('x-powered-by');
 const reviewLimits=[
  rateLimit({windowMs:60000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many reviews. Wait one minute before trying again.'}}),
  rateLimit({windowMs:3600000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'The hourly review limit was reached. Try again later.'}})
 ];
 if(env.VERCEL)app.set('trust proxy',1);
 const pageOrigins=String(env.API_ALLOWED_ORIGINS||'').split(',').map(value=>value.trim().replace(/\/$/,'')).filter(value=>{try{const url=new URL(value);return url.protocol==='https:'&&url.origin===value;}catch{return false;}});
 app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false,crossOriginOpenerPolicy:false,originAgentCluster:false,strictTransportSecurity:false,crossOriginResourcePolicy:pageOrigins.length?{policy:'cross-origin'}:undefined}));
 app.get('/favicon.ico',(req,res)=>res.redirect(302,'/favicon.svg'));
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');if(!isAllowedHost(req.hostname,env))return res.status(403).json({error:env.VERCEL?'This address is not allowed.':'Open this app at http://DSWD_Sanchez or from a device on the same network.'});next();});
 app.use('/api',(req,res,next)=>{const raw=req.get('origin');if(raw){let origin;try{origin=new URL(raw);}catch{return res.status(403).end();}const allowed=origin.host===req.get('host')||pageOrigins.includes(origin.origin);if(!allowed)return res.status(403).json({error:'Cross-origin requests are not allowed.'});if(origin.host!==req.get('host')){res.set('Access-Control-Allow-Origin',origin.origin);res.set('Vary','Origin');res.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type');res.set('Access-Control-Max-Age','600');}}if(req.method==='OPTIONS')return res.status(204).end();next();});
 app.use(express.json({limit:'160kb'}));
 app.get('/api/config',(req,res)=>res.json({configured:!!env.AI_API_KEY,provider:env.AI_PROVIDER_LABEL||'Configured AI provider',model:env.AI_MODEL||'gpt-4.1-mini',cameraUrl:env.CAMERA_URL||''}));
 app.post('/api/review',...reviewLimits,async(req,res)=>{
  let input;try{input=validateInput(req.body);}catch(e){return res.status(400).json({error:e.message});}
  if(!env.AI_API_KEY)return res.status(503).json({error:'AI review is not configured. Set AI_API_KEY on the server. Uploads and OCR remain available.'});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),90000);res.on('close',()=>controller.abort());
  try{const result=await reviewer(input,env,controller.signal);if(!res.destroyed)res.json(result);}catch(e){if(!res.destroyed)res.status(502).json({error:controller.signal.aborted?'The review timed out. Please try again.':e instanceof SyntaxError?'The AI returned invalid JSON. Please retry.':e.message||'Review failed. Please retry.'});}finally{clearTimeout(timeout);}
 });
 app.use((err,req,res,next)=>{res.status(err.status===413?413:400).json({error:err.status===413?'The request is too large.':'Invalid request. Use valid JSON.'});});
 return app;
}
