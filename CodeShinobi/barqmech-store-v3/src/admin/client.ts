export class AdminApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
export async function adminRequest<T>(path: string, init: RequestInit = {}, request: typeof fetch = fetch): Promise<T> {
  const base = typeof import.meta.env?.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim().replace(/\/$/, '') : ''
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await request(base + path, {...init, credentials:'include', cache:'no-store', signal:controller.signal,
      headers:{Accept:'application/json', ...(init.body ? {'Content-Type':'application/json'} : {}), ...init.headers}})
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) throw new AdminApiError('Sign-in service is unavailable. Please try again shortly.', res.status)
    const data = await res.json()
    if (!res.ok) throw new AdminApiError(res.status === 401 && path!=='/api/admin-login' ? 'Your session has ended. Please sign in again.' : typeof data.error === 'string' ? data.error : 'The request could not be completed.', res.status)
    return data as T
  } catch (error) {
    if (error instanceof AdminApiError) throw error
    throw new AdminApiError(controller.signal.aborted ? 'The request timed out. Please try again.' : 'Could not connect to the admin API. Please try again.', 0)
  } finally { clearTimeout(timeout) }
}
