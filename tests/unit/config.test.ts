import { parseConfig, resetConfig } from '../../src/config';

describe('Configuration Loader & Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetConfig();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should throw an error if DATABASE_URLS is missing', () => {
    delete process.env.DATABASE_URLS;
    expect(() => parseConfig()).toThrow('DATABASE_URLS environment variable is required');
  });

  test('should throw an error if DATABASE_URLS is empty', () => {
    process.env.DATABASE_URLS = '  ,  ';
    expect(() => parseConfig()).toThrow('DATABASE_URLS must contain at least one valid connection string');
  });

  test('should parse database URLs correctly', () => {
    process.env.DATABASE_URLS = 'postgresql://localhost:5432/db1, postgresql://localhost:5432/db2 ';
    const config = parseConfig();
    expect(config.databaseUrls).toEqual([
      'postgresql://localhost:5432/db1',
      'postgresql://localhost:5432/db2',
    ]);
  });

  test('should apply correct default configurations', () => {
    process.env.DATABASE_URLS = 'postgresql://localhost:5432/db';
    
    // Explicitly delete optional env variables to force defaults
    delete process.env.CRON_SCHEDULE;
    delete process.env.PING_TIMEOUT_MS;
    delete process.env.MAX_RETRIES;

    const config = parseConfig();
    expect(config.cronSchedule).toBe('0 0 */3 * *');
    expect(config.pingTimeoutMs).toBe(10000);
    expect(config.maxRetries).toBe(3);
  });

  test('should parse custom overrides correctly', () => {
    process.env.DATABASE_URLS = 'postgresql://localhost:5432/db';
    process.env.CRON_SCHEDULE = '0 0 * * *';
    process.env.PING_TIMEOUT_MS = '5000';
    process.env.MAX_RETRIES = '5';

    const config = parseConfig();
    expect(config.cronSchedule).toBe('0 0 * * *');
    expect(config.pingTimeoutMs).toBe(5000);
    expect(config.maxRetries).toBe(5);
  });

  test('should throw an error on invalid PING_TIMEOUT_MS', () => {
    process.env.DATABASE_URLS = 'postgresql://localhost:5432/db';
    process.env.PING_TIMEOUT_MS = '-100';
    expect(() => parseConfig()).toThrow('PING_TIMEOUT_MS must be a positive integer');

    process.env.PING_TIMEOUT_MS = 'abc';
    expect(() => parseConfig()).toThrow('PING_TIMEOUT_MS must be a positive integer');
  });

  test('should throw an error on invalid MAX_RETRIES', () => {
    process.env.DATABASE_URLS = 'postgresql://localhost:5432/db';
    process.env.MAX_RETRIES = '-1';
    expect(() => parseConfig()).toThrow('MAX_RETRIES must be a non-negative integer');

    process.env.MAX_RETRIES = 'xyz';
    expect(() => parseConfig()).toThrow('MAX_RETRIES must be a non-negative integer');
  });
});
