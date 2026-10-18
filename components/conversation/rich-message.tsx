'use client'
import Markdown from 'react-markdown'
import { useState } from 'react'
export function RichMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return <div className="min-w-0 break-words"><div className="space-y-3 text-base leading-relaxed [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-secondary [&_pre]:p-3 [&_code]:font-mono [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_a]:underline"><Markdown skipHtml components={{ a: props => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{text}</Markdown></div><button className="min-h-11 text-xs underline" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy response'}</button></div>
}
