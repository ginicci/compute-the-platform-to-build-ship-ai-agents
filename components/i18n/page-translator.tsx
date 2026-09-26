'use client'

import { useEffect } from 'react'

const SKIP_SELECTOR = '[translate="no"], .notranslate, script, style, noscript, code, pre, textarea, kbd, samp'
const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'] as const
const HAS_LETTER = /\p{L}/u
const BATCH_SIZE = 100

type TextTarget = { kind: 'text'; node: Text; lead: string; trail: string }
type AttrTarget = { kind: 'attr'; el: Element; attr: string }
type Target = TextTarget | AttrTarget

export function PageTranslator({ locale }: { locale: string }) {
  useEffect(() => {
    const root = document.documentElement
    if (locale === 'en') {
      root.removeAttribute('data-i18n-pending')
      return
    }

    const storageKey = `northstar-i18n:${locale}`
    const cache = new Map<string, string>()
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, string>
      for (const [source, translated] of Object.entries(stored)) cache.set(source, translated)
    } catch {}

    const applied = new WeakMap<Node, string>()
    const appliedAttrs = new WeakMap<Element, Map<string, string>>()
    const requested = new Set<string>()
    let pending: Target[] = []
    let timer: ReturnType<typeof setTimeout> | undefined
    let revealed = false
    let persistTimer: ReturnType<typeof setTimeout> | undefined

    const reveal = () => {
      if (revealed) return
      revealed = true
      root.removeAttribute('data-i18n-pending')
    }
    const revealFallback = setTimeout(reveal, 2500)

    const persist = () => {
      clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(cache)))
        } catch {}
      }, 400)
    }

    const sourceOf = (target: Target) =>
      target.kind === 'text' ? target.node.nodeValue?.trim() ?? '' : target.el.getAttribute(target.attr)?.trim() ?? ''

    const apply = (target: Target, translated: string) => {
      if (target.kind === 'text') {
        const value = target.lead + translated + target.trail
        applied.set(target.node, value)
        if (target.node.nodeValue !== value) target.node.nodeValue = value
      } else {
        let map = appliedAttrs.get(target.el)
        if (!map) appliedAttrs.set(target.el, (map = new Map()))
        map.set(target.attr, translated)
        if (target.el.getAttribute(target.attr) !== translated) target.el.setAttribute(target.attr, translated)
      }
    }

    const collect = (scope: Node, into: Target[]) => {
      const element = scope.nodeType === Node.ELEMENT_NODE ? (scope as Element) : scope.parentElement
      if (!element || element.closest(SKIP_SELECTOR)) return

      if (scope.nodeType === Node.TEXT_NODE) {
        const node = scope as Text
        const raw = node.nodeValue ?? ''
        if (applied.get(node) === raw) return
        const trimmed = raw.trim()
        if (!trimmed || !HAS_LETTER.test(trimmed)) return
        into.push({ kind: 'text', node, lead: raw.match(/^\s*/)![0], trail: raw.match(/\s*$/)![0] })
        return
      }

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(SKIP_SELECTOR)) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        },
      })
      const visit = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          collect(node, into)
          return
        }
        const el = node as Element
        for (const attr of ATTRIBUTES) {
          const value = el.getAttribute(attr)
          if (!value || appliedAttrs.get(el)?.get(attr) === value) continue
          if (!HAS_LETTER.test(value)) continue
          into.push({ kind: 'attr', el, attr })
        }
      }
      visit(scope)
      let current = walker.nextNode()
      while (current) {
        visit(current)
        current = walker.nextNode()
      }
    }

    const flush = async () => {
      const batch = pending
      pending = []
      const waiting: Target[] = []
      for (const target of batch) {
        const source = sourceOf(target)
        if (!source) continue
        const hit = cache.get(source)
        if (hit) apply(target, hit)
        else waiting.push(target)
      }

      const toRequest = [...new Set(waiting.map(sourceOf))].filter((s) => !requested.has(s) && s.length <= 1200)
      if (toRequest.length === 0) {
        if (waiting.length === 0) reveal()
        return
      }
      toRequest.forEach((s) => requested.add(s))

      for (let i = 0; i < toRequest.length; i += BATCH_SIZE) {
        const chunk = toRequest.slice(i, i + BATCH_SIZE)
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale, texts: chunk }),
          })
          if (!response.ok) continue
          const { translations } = (await response.json()) as { translations: (string | null)[] }
          chunk.forEach((source, index) => {
            const translated = translations[index]
            if (translated) cache.set(source, translated)
            else requested.delete(source)
          })
          persist()
        } catch {
          chunk.forEach((source) => requested.delete(source))
        }
        for (const target of waiting) {
          const hit = cache.get(sourceOf(target))
          if (hit) apply(target, hit)
        }
        reveal()
      }
    }

    const schedule = (targets: Target[]) => {
      if (targets.length === 0) return
      pending.push(...targets)
      clearTimeout(timer)
      timer = setTimeout(flush, 60)
    }

    const initial: Target[] = []
    collect(document.body, initial)
    if (initial.length === 0) reveal()
    schedule(initial)

    const observer = new MutationObserver((mutations) => {
      const found: Target[] = []
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') collect(mutation.target, found)
        else if (mutation.type === 'attributes') collect(mutation.target, found)
        else mutation.addedNodes.forEach((node) => collect(node, found))
      }
      schedule(found)
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    })

    return () => {
      observer.disconnect()
      clearTimeout(timer)
      clearTimeout(revealFallback)
      clearTimeout(persistTimer)
    }
  }, [locale])

  return null
}
