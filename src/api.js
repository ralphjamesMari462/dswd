export function apiBase() {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
}

export function apiUrl(path) {
  const base = apiBase();
  if (!base) return path;
  const url = new URL(base);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('The review API must be an HTTPS address without a key or password.');
  }
  return `${url.origin}${url.pathname.replace(/\/$/, '')}${path}`;
}
