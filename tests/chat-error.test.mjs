import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatStreamError } from '../lib/chat-error.ts'

test('recognizes the production gateway funding error and nested provider errors', () => {
  const error = { statusCode: 402, message: 'A positive credit balance is required for all requests, including BYOK' }
  for (const value of [error, { cause: error }]) {
    assert.equal(JSON.parse(chatStreamError(value)).code, 'service_funding_required')
  }
})
test('does not expose provider details or misclassify quota and other failures', () => {
  for (const error of [null, new Error('private provider details'), { statusCode: 402, message: 'quota_for_entity_exceeded' }, { statusCode: 500, message: 'insufficient_funds' }]) {
    assert.equal(chatStreamError(error), 'The reply could not be completed. Please retry.')
  }
  const circular = {}; circular.cause = circular
  assert.equal(chatStreamError(circular), 'The reply could not be completed. Please retry.')
})
