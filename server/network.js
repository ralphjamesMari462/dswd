import dgram from 'node:dgram';
import os from 'node:os';

export const APP_HOST = 'dswd_sanchez';

function deploymentHosts(env) {
  return [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_BRANCH_URL, ...String(env.APP_HOSTS || '').split(',')]
    .map((value) => String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, ''))
    .filter(Boolean);
}

export function isAllowedHost(hostname, env = process.env) {
  const bare = String(hostname || '').trim().toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  if (deploymentHosts(env).includes(bare)) return true;
  if (env.VERCEL) return false;
  if (['localhost', '127.0.0.1', '::1', APP_HOST, `${APP_HOST}.local`].includes(bare)) return true;
  if (bare === os.hostname().toLowerCase()) return true;
  return isPrivateAddress(bare);
}

function isPrivateAddress(ip) {
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  const match = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(ip);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  const v6 = ip.toLowerCase();
  if (v6.includes(':') && (v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80'))) return true;
  return false;
}

export function lanAddresses() {
  const found = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      found.push({name, address: entry.address});
    }
  }
  const wifi = found.filter((item) => /wi-?fi|wlan|wireless/i.test(item.name) && !item.address.startsWith('169.254.'));
  const usable = found.filter((item) => !item.address.startsWith('169.254.') && !item.address.startsWith('192.168.56.'));
  const chosen = wifi.length ? wifi : usable.length ? usable : found;
  return [...new Set(chosen.map((item) => item.address))];
}

function encodeName(host) {
  return Buffer.concat([...host.split('.').map((part) => Buffer.concat([Buffer.from([Buffer.byteLength(part)]), Buffer.from(part)])), Buffer.from([0])]);
}

function decodeName(msg, offset) {
  const labels = [];
  let cursor = offset;
  let guard = 0;
  while (cursor < msg.length && guard < 20) {
    const len = msg[cursor];
    if (len === 0) return labels.join('.');
    if ((len & 0xc0) === 0xc0) {
      if (cursor + 1 >= msg.length) return '';
      cursor = ((len & 0x3f) << 8) | msg[cursor + 1];
      guard += 1;
      continue;
    }
    labels.push(msg.subarray(cursor + 1, cursor + 1 + len).toString('utf8'));
    cursor += len + 1;
    guard += 1;
  }
  return labels.join('.');
}

function answersFor(name, addresses, pointer) {
  return addresses.map((ip) => {
    const rdata = Buffer.from(ip.split('.').map((part) => Number(part)));
    const label = pointer ? Buffer.from([0xc0, 0x0c]) : name;
    const answer = Buffer.alloc(label.length + 10 + rdata.length);
    label.copy(answer, 0);
    answer.writeUInt16BE(1, label.length);
    answer.writeUInt16BE(1, label.length + 2);
    answer.writeUInt32BE(120, label.length + 4);
    answer.writeUInt16BE(rdata.length, label.length + 8);
    rdata.copy(answer, label.length + 10);
    return answer;
  });
}

function buildPacket(id, question, name, addresses) {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(id, 0);
  header.writeUInt16BE(0x8400, 2);
  header.writeUInt16BE(question ? 1 : 0, 4);
  header.writeUInt16BE(addresses.length, 6);
  const body = question ? [question, ...answersFor(name, addresses, true)] : answersFor(name, addresses, false);
  return Buffer.concat([header, ...body]);
}

function answerQuery(msg, name, addresses) {
  if (msg.length < 12 || (msg.readUInt16BE(2) & 0x8000) || msg.readUInt16BE(4) < 1) return null;
  if (decodeName(msg, 12).toLowerCase() !== 'dswd_sanchez.local') return null;
  let offset = 12;
  while (offset < msg.length) {
    const len = msg[offset];
    if (len === 0) { offset += 1; break; }
    if ((len & 0xc0) === 0xc0) { offset += 2; break; }
    offset += 1 + len;
  }
  if (offset + 4 > msg.length) return null;
  const qtype = msg.readUInt16BE(offset);
  if (qtype !== 1 && qtype !== 255) return null;
  return buildPacket(msg.readUInt16BE(0), msg.subarray(12, offset + 4), name, addresses);
}

export function advertiseName(addresses) {
  if (!addresses.length) return;
  const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
  const name = encodeName('DSWD_Sanchez.local');
  socket.on('error', () => {});
  socket.on('message', (msg, rinfo) => {
    const response = answerQuery(msg, name, addresses);
    if (response) socket.send(response, rinfo.port, rinfo.address);
  });
  socket.bind(5353, () => {
    try { socket.addMembership('224.0.0.251'); } catch { /* another mDNS listener may already own the group */ }
    const announce = () => socket.send(buildPacket(0, null, name, addresses), 5353, '224.0.0.251');
    announce();
    setInterval(announce, 60000).unref();
  });
}
