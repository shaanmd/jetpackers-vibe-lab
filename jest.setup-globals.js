// jest.setup-globals.js
// This runs BEFORE test files are loaded, establishing globals that tests might try to mock

// First, polyfill TextEncoder/TextDecoder since undici needs them
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill ReadableStream for undici
if (typeof global.ReadableStream === 'undefined') {
  class FetchReadableStream {
    constructor(underlyingSource) {
      this.controller = { enqueue: null, close: null };
      this.chunks = [];
      this.index = 0;
      this.closed = false;

      this.controller.enqueue = (chunk) => {
        this.chunks.push(chunk);
      };

      this.controller.close = () => {
        this.closed = true;
      };

      Object.defineProperty(this, 'getReader', {
        value: () => {
          const self = this;
          return {
            // Return sync immediately when chunks are available to avoid promise overhead
            read() {
              if (self.index < self.chunks.length) {
                return Promise.resolve({ done: false, value: self.chunks[self.index++] });
              }
              if (self.closed) {
                return Promise.resolve({ done: true });
              }
              // Should not reach here in test scenario
              return Promise.resolve({ done: true });
            }
          };
        }
      });

      underlyingSource?.start?.(this.controller);
    }
  }

  global.ReadableStream = FetchReadableStream;
}

// Now try to get fetch from undici
let fetchImpl;
try {
  const undici = require('undici');
  fetchImpl = undici.fetch;
} catch (e) {
  // undici failed, fetch won't be available
  fetchImpl = undefined;
}

if (typeof fetchImpl === 'function') {
  Object.defineProperty(global, 'fetch', {
    value: fetchImpl,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
