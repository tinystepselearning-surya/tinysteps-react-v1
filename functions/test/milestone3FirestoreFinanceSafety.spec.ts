import {afterEach, describe, expect, it, vi} from 'vitest';
import {assertEmulator, HOST, openEmulator, PROJECT} from './firestoreFinance/emulatorGuard';
const valid = {M3_FINANCE_EMULATOR_ONLY: '1', FIRESTORE_EMULATOR_HOST: HOST, GCLOUD_PROJECT: PROJECT};
afterEach(() => vi.unstubAllEnvs());
describe('emulator connection pre-initialization gate', () => {
  it.each([{}, {...valid, FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443'},
    {...valid, FIRESTORE_EMULATOR_HOST: 'localhost:8787'}, {...valid, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8085'},
    {...valid, GCLOUD_PROJECT: 'tinysteps-react-v1'}, {...valid, M3_FINANCE_EMULATOR_ONLY: '0'}])('rejects unsafe environment %j', env => {
    expect(() => assertEmulator(env)).toThrow('FINANCE_EMULATOR_REQUIRED');
  });
  it('rejects before loading an SDK or constructing any client', async () => {
    vi.stubEnv('M3_FINANCE_EMULATOR_ONLY', '0'); const load = vi.fn();
    await expect(openEmulator(load)).rejects.toThrow('FINANCE_EMULATOR_REQUIRED');
    expect(load).not.toHaveBeenCalled();
  });
  it('accepts only the exact declared synthetic endpoint', () => expect(() => assertEmulator(valid)).not.toThrow());
});
