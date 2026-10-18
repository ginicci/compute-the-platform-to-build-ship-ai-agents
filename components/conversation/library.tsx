'use client'
import { useEffect, useRef, useState } from 'react'
import type { UIMessage } from 'ai'
type Conversation = { id: string; title: string; messages: UIMessage[]; revision: number }
export function ConversationLibrary({ messages, onLoad, busy }: { messages: UIMessage[]; onLoad: (messages: UIMessage[]) => void; busy: boolean }) {
  const [history, setHistory] = useState<Conversation[]>([])
  const [active, setActive] = useState('')
  const revision = useRef(0)
  const saving = useRef(false)
  const [notice, setNotice] = useState('')
  const [autoSave, setAutoSave] = useState(false)
  const [voice, setVoice] = useState('marin')
  const lastSaved = useRef('')
  async function refresh() {
    try { const r = await fetch('/api/conversations', { cache: 'no-store' }); if (!r.ok) throw Error(); setHistory((await r.json()).conversations) } catch { setNotice('Account history unavailable. Your conversation remains on screen.') }
  }
  useEffect(() => {
    refresh()
    const readPreferences = () => fetch('/api/preferences', { cache: 'no-store' }).then(async r => { if (r.ok) { const p = await r.json(); setAutoSave(p.auto_save); setVoice(p.voice) } }).catch(() => {})
    readPreferences()
    const focus = () => { void refresh(); void readPreferences() }; window.addEventListener('focus', focus)
    return () => window.removeEventListener('focus', focus)
  }, [])
  async function save() {
    if (busy || !messages.length || saving.current) return
    saving.current = true
    const id = active || crypto.randomUUID()
    const title = messages.find(m => m.role === 'user')?.parts.filter(p => p.type === 'text').map(p => p.text).join('').slice(0, 60) || 'Conversation'
    try {
      const r = await fetch('/api/conversations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title, messages, revision: revision.current }) })
      if (!r.ok) throw Error()
      revision.current = (await r.json()).revision
      setActive(id); lastSaved.current = JSON.stringify(messages); setNotice('Saved privately to your account.'); refresh()
    } catch { setNotice('Could not save, or a newer copy exists on another device. Refresh history and reopen it before editing. No browser storage fallback is used.') } finally { saving.current = false }
  }
  useEffect(() => {
    if (!autoSave || busy || !messages.length || JSON.stringify(messages) === lastSaved.current) return
    const timer = setTimeout(() => { void save() }, 1000)
    return () => clearTimeout(timer)
  }, [messages, busy, autoSave])
  async function preferences(nextAuto: boolean, nextVoice: string) {
    try {
      const r = await fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auto_save: nextAuto, voice: nextVoice }) })
      if (!r.ok) throw Error()
      setAutoSave(nextAuto); setVoice(nextVoice); setNotice('Account preferences saved.')
    } catch { setNotice('Preferences could not be saved; no setting was changed.') }
  }
  return <details className="border-b px-4 py-2 text-sm"><summary className="min-h-11 cursor-pointer">Conversations & preferences</summary><div className="space-y-3 py-3"><div className="flex flex-wrap gap-3"><button className="min-h-11 underline" disabled={busy} onClick={() => { setActive(''); revision.current = 0; lastSaved.current = ''; onLoad([]) }}>New conversation</button><button className="min-h-11 underline" disabled={busy || !messages.length} onClick={save}>Save to account</button><button className="min-h-11 underline" onClick={refresh}>Refresh history</button></div><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={autoSave} onChange={e => preferences(e.target.checked, voice)} /> Automatically save this interface's conversation to my account</label><label>Live voice <select className="ml-2 min-h-11 border bg-background" value={voice} onChange={e => preferences(autoSave, e.target.value)}><option value="marin">Marin</option><option value="cedar">Cedar</option></select></label><p role="status">{notice}</p><nav aria-label="Shared account conversations" className="max-h-44 overflow-auto">{history.map(c => <button key={c.id} className="block min-h-11 w-full text-left underline" disabled={busy} onClick={() => { setActive(c.id); revision.current = c.revision; lastSaved.current = JSON.stringify(c.messages); onLoad(c.messages) }}>{c.title}</button>)}</nav></div></details>
}
