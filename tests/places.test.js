import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifiedSnapshot as snapshot } from '../data/verifiedPlaces.js';
import { queryOverpass, PROBE_QUERY, validMuseum } from '../scripts/overpass-client.js';

async function request(handler, method = 'GET', url = '/api/places') {
  let result;
  const headers = {};
  await handler({ method, url }, {
    setHeader(name, value) { headers[name] = value; },
    end(body) { result = { status: this.statusCode, body: JSON.parse(body), headers }; },
  });
  return result;
}

test('persistent snapshot survives cold starts and requires zero upstream requests', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('External network unavailable'); };
  try {
    for (const version of ['cold1', 'cold2']) {
      const { default: handler } = await import(`../api/places.js?${version}`);
      const result = await request(handler);
      assert.equal(result.status, 200);
      assert.equal(result.body.elements.length, 10);
      assert.deepEqual(result.body, snapshot);
      assert.ok(result.body.elements.every(validMuseum));
      assert.match(result.headers['Cache-Control'], /s-maxage=86400/);
      assert.equal((await request(handler, 'POST')).status, 405);
      assert.equal((await request(handler, 'GET', '/api/places?refresh=1')).status, 400);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('small museum query switches independent instances after upstream HTTP 503', async () => {
  const calls = [];
  const result = await queryOverpass({ query: PROBE_QUERY, fetchImpl: async (url, options) => {
    calls.push(url);
    assert.equal(options.body.get('data'), PROBE_QUERY);
    if (calls.length === 1) return { ok: false, status: 503 };
    return { ok: true, status: 200, json: async () => ({ elements: snapshot.elements }) };
  } });
  assert.equal(calls.length, 2);
  assert.notEqual(new URL(calls[0]).hostname, new URL(calls[1]).hostname);
  assert.equal(result.attempts[0].kind, 'http');
  assert.equal(result.attempts[0].httpStatus, 503);
  assert.equal(result.payload.elements.length, 10);
});

test('network failures and timeouts are reported separately from upstream HTTP errors, then stop', async () => {
  let calls = 0;
  await assert.rejects(queryOverpass({ timeoutMs: 5, fetchImpl: async (_url, { signal }) => {
    calls += 1;
    if (calls === 1) throw new Error('Connection unavailable');
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  } }), (error) => {
    assert.deepEqual(error.attempts.map(({ kind }) => kind), ['network', 'timeout']);
    assert.ok(error.attempts.every((attempt) => !attempt.httpStatus));
    return true;
  });
  assert.equal(calls, 2);
});

test('partial, empty and invalid responses cannot replace the persistent snapshot', async () => {
  for (const payload of [{ elements: [] }, { elements: snapshot.elements, remark: 'runtime error: Query timed out' }, { elements: [{ type: 'node', id: 1, tags: { name: 'Invalid' } }] }]) {
    await assert.rejects(queryOverpass({ endpoints: ['https://example.test/interpreter'], fetchImpl: async () => ({ ok: true, status: 200, json: async () => payload }) }), (error) => {
      assert.equal(error.attempts[0].kind, 'invalid_payload');
      return true;
    });
  }
});
