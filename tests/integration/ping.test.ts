import { pingInstance } from '../../src/ping-worker';
import { Client } from 'pg';

describe('Database Ping worker', () => {
  let connectSpy: jest.SpyInstance;
  let querySpy: jest.SpyInstance;
  let endSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up spies on Client prototype
    connectSpy = jest.spyOn(Client.prototype, 'connect');
    querySpy = jest.spyOn(Client.prototype, 'query');
    endSpy = jest.spyOn(Client.prototype, 'end');
    
    // Default mocks
    connectSpy.mockResolvedValue(undefined);
    querySpy.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    endSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    connectSpy.mockRestore();
    querySpy.mockRestore();
    endSpy.mockRestore();
  });

  test('should successfully ping and return success status', async () => {
    const result = await pingInstance('postgresql://user:pass@localhost:5432/postgres', {
      timeoutMs: 1000,
      maxRetries: 1,
    });

    expect(result.success).toBe(true);
    expect(result.instanceHost).toBe('localhost:5432');
    expect(result.attempt).toBe(1);
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith('SELECT 1;');
  });

  test('should retry on connection failure and succeed on next attempt', async () => {
    // First attempt fails, second succeeds
    connectSpy
      .mockRejectedValueOnce(new Error('Connection timed out'))
      .mockResolvedValueOnce(undefined);

    const result = await pingInstance('postgresql://user:pass@localhost:5432/postgres', {
      timeoutMs: 50,
      maxRetries: 2,
    });

    expect(result.success).toBe(true);
    expect(result.attempt).toBe(2);
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  test('should fail and log failure after reaching max retry threshold', async () => {
    connectSpy.mockRejectedValue(new Error('FATAL: password authentication failed'));

    const result = await pingInstance('postgresql://user:pass@localhost:5432/postgres', {
      timeoutMs: 50,
      maxRetries: 3,
    });

    expect(result.success).toBe(false);
    expect(result.attempt).toBe(3);
    expect(result.error?.message).toContain('password authentication failed');
    expect(connectSpy).toHaveBeenCalledTimes(3);
  });
});
