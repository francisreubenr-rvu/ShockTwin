sap.ui.define([], function () {
  'use strict';
  let csrfToken = null;

  async function request(path, options) {
    const config = options || {};
    const method = config.method || 'GET';
    const headers = { Accept: 'application/json', ...(config.headers || {}) };
    if (method === 'GET') headers['x-csrf-token'] = 'Fetch';
    if (config.body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrfToken && method !== 'GET') headers['x-csrf-token'] = csrfToken;
    const response = await fetch(path, {
      credentials: 'same-origin',
      method: method,
      headers: headers,
      body: config.body === undefined ? undefined : JSON.stringify(config.body),
      signal: AbortSignal.timeout(45000),
    });
    const token = response.headers.get('x-csrf-token');
    if (token && token !== 'Required') csrfToken = token;
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      throw new Error('The service returned an unreadable response. Check its health and retry.');
    }
    if (!response.ok) {
      const details = data.error || {};
      const error = new Error(details.message || 'The request could not be completed.');
      error.correlationId = details.correlationId;
      error.status = response.status;
      throw error;
    }
    return data;
  }
  return {
    get: function (path) {
      return request(path);
    },
    post: function (path, body) {
      return request(path, { method: 'POST', body: body || {} });
    },
  };
});
