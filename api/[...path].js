import {createApp} from '../server/app.js';

const app = createApp();

export default function handler(req, res) {
  const url = req.url || '/';
  const path = url.split('?')[0];
  if (path !== '/api' && !path.startsWith('/api/')) {
    req.url = `/api${path.startsWith('/') ? path : `/${path}`}${url.includes('?') ? url.slice(url.indexOf('?')) : ''}`;
  }
  return app(req, res);
}

export const maxDuration = 120;
