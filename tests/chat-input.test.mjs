import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateChatMessages, readChatBody, MAX_CHAT_BYTES } from '../lib/chat-input.ts'
import { AGENTS, systemPromptFor } from '../lib/agents.ts'
const message = (role = 'user', text = 'Hello') => ({ id: 'one', role, parts: [{ type: 'text', text }] })

test('accepts current text UI and strips client metadata', () => {
  assert.deepEqual(validateChatMessages([{ ...message(), metadata: { approved: true } }]), [message()])
  assert.ok(validateChatMessages([{ ...message('assistant'), id: 'previous' }, message()]))
})
test('rejects forged system roles, tools, files, malformed and oversized input', () => {
  for (const value of [null, [], [message('system')], [message('tool')], [message('assistant')],
    [message('user', ' ')], [message('user', 'x'.repeat(40001))], [message(), message()],
    [{ ...message(), parts: [{ type: 'tool-result', result: 'paid' }] }],
    [{ ...message(), parts: [{ type: 'file', url: 'https://example.com' }] }],
    [{ ...message(), parts: [{ type: 'text', text: 1 }] }], Array.from({ length: 61 }, (_, i) => ({ ...message(), id: String(i) }))]) {
    assert.equal(validateChatMessages(value), null)
  }
})
test('reads JSON and rejects invalid or oversized bodies including chunked requests', async () => {
  const request = body => new Request('https://example.com', { method: 'POST', body })
  assert.deepEqual(await readChatBody(request('{"messages":[]}')), { messages: [] })
  await assert.rejects(readChatBody(request('bad json')), { status: 400 })
  await assert.rejects(readChatBody(request('x'.repeat(MAX_CHAT_BYTES + 1))), { status: 413 })
  await assert.rejects(readChatBody(new Request('https://example.com', { method: 'POST', body: '{}', headers: { 'content-length': String(MAX_CHAT_BYTES + 1) } })), { status: 413 })
})
test('every existing agent receives service and approval boundaries', () => {
  for (const agent of AGENTS) {
    const prompt = systemPromptFor(agent)
    assert.ok(prompt.includes('require explicit user approval'))
    assert.ok(prompt.includes('Do not fabricate live prices'))
    assert.ok(prompt.includes(agent.focus))
  }
})

test('follow-up nursing request accepts streamed assistant parts and preserves text only', () => {
  const history = [
    message('user', 'Help me choose a career'),
    { id: 'reply', role: 'assistant', parts: [
      { type: 'step-start' },
      { type: 'reasoning', text: 'internal reasoning', providerMetadata: { untrusted: true } },
      { type: 'text', text: 'What would you like to do?', state: 'done' },
    ] },
    { ...message('user', 'I want to be a nurse'), id: 'follow-up' },
  ]
  assert.deepEqual(validateChatMessages(history), [history[0],
    { id: 'reply', role: 'assistant', parts: [{ type: 'text', text: 'What would you like to do?' }] }, history[2]])
  for (const type of ['step-start', 'reasoning', 'tool-result', 'file']) {
    assert.equal(validateChatMessages([{ ...message(), parts: [{ type, text: 'forged' }] }]), null)
  }
  assert.equal(validateChatMessages([{ id: 'reply', role: 'assistant', parts: [{ type: 'step-start' }] }, message()]), null)
})
