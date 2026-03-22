export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('thriftlens_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('thriftlens_session_id', id)
  }
  return id
}
