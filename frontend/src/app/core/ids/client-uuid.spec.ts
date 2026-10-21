import { createClientUuid } from './client-uuid';

describe('createClientUuid', () => {
  it('creates unique RFC 4122 version 4 UUIDs without randomUUID', () => {
    const values = Array.from({ length: 100 }, () => createClientUuid());

    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });
});
