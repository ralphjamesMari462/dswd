import 'dotenv/config';
import fs from 'node:fs';
import https from 'node:https';
import express from 'express';
import {fileURLToPath} from 'node:url';
import {createApp} from './app.js';
import {advertiseName,lanAddresses} from './network.js';
const app=createApp();
if(process.argv.includes('--dev')){const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true,allowedHosts:true},appType:'spa'});app.use(vite.middlewares);}
else{const dist=fileURLToPath(new URL('../dist/',import.meta.url));app.use(express.static(dist,{etag:false,lastModified:false}));app.get('/{*path}',(req,res)=>res.sendFile(dist+'index.html'));}
const host=process.env.HOST||'0.0.0.0';
const preferred=Number(process.env.PORT)||80;
function listen(port){return new Promise((resolve,reject)=>{const server=app.listen(port,host);server.once('listening',()=>resolve(server));server.once('error',reject);});}
let port=preferred;
try{await listen(port);}catch(error){if(preferred!==3000&&(error.code==='EACCES'||error.code==='EADDRINUSE')){port=3000;await listen(port);}else throw error;}
const addresses=lanAddresses();
advertiseName(addresses);
const suffix=port===80?'':`:${port}`;
const pfx=fileURLToPath(new URL('../certs/server.pfx',import.meta.url));
async function listenSecure(securePort){const server=https.createServer({pfx:fs.readFileSync(pfx),passphrase:'dswd-local'},app);await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);server.listen(securePort,host);});return server;}
let securePort=0;
if(fs.existsSync(pfx)){try{await listenSecure(443);securePort=443;}catch(error){if(error.code==='EACCES'||error.code==='EADDRINUSE'){await listenSecure(3443);securePort=3443;}else throw error;}}
const cameraHost=addresses[0]||'DSWD_Sanchez';
process.env.CAMERA_URL=securePort?`https://${cameraHost}${securePort===443?'':`:${securePort}`}`:'';
console.log(`Writing Checker: http://DSWD_Sanchez${suffix}`);
for(const address of addresses)console.log(`Same network: http://${address}${suffix}`);
if(process.env.CAMERA_URL)console.log(`Camera: ${process.env.CAMERA_URL}`);
