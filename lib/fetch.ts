// lib/fetch.ts
// Safe fetch wrapper — never throws on empty/invalid JSON responses

export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options)
    const text = await res.text()
    if (!text.trim()) return {}
    return JSON.parse(text)
  } catch (err) {
    console.warn('[safeFetch]', url, err)
    return {}
  }
}

export function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
