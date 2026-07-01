import { FETCH_TIMEOUT_MS } from './constants.mjs';

export function sanitizeProviderErrorDetail(detail, maxLength = 200) {
  const compact = String(detail || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) {
    return 'No additional details returned.';
  }
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}…` : compact;
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
