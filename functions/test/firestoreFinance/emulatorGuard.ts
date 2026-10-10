// No Firebase/Firestore runtime import is permitted above the environment gate.
import {createRequire} from 'node:module';
import type {Firestore} from '@google-cloud/firestore';
import type {FirestoreClient} from '@google-cloud/firestore/types/v1/firestore_client';
export const PROJECT = 'demo-tinysteps-finance-consistency';
export const HOST = '127.0.0.1:8787';
export function assertEmulator(env: NodeJS.ProcessEnv = process.env): void {
  if (env.M3_FINANCE_EMULATOR_ONLY !== '1' || env.FIRESTORE_EMULATOR_HOST !== HOST ||
      env.GCLOUD_PROJECT !== PROJECT) throw new Error('FINANCE_EMULATOR_REQUIRED');
}
const approved = new WeakSet<object>();
export interface Connection {db: Firestore; rpc: FirestoreClient; close(): Promise<void>}
export function assertConnection(connection: Connection): void {
  assertEmulator();
  if (!approved.has(connection)) throw new Error('UNTRUSTED_CONNECTION');
}
export async function openEmulator(load = async () => {
  const require = createRequire(import.meta.url);
  const sdk = require('@google-cloud/firestore') as typeof import('@google-cloud/firestore');
  const grpc = require('@grpc/grpc-js') as typeof import('@grpc/grpc-js');
  return {db: new sdk.Firestore({projectId: PROJECT, host: HOST, ssl: false}),
    rpc: new sdk.v1.FirestoreClient({projectId: PROJECT, servicePath: '127.0.0.1', port: 8787,
      sslCreds: grpc.credentials.createInsecure()})};
}): Promise<Connection> {
  assertEmulator(); // Must precede SDK loading, constructors, ADC discovery and networking.
  const clients = await load();
  const connection = {...clients, close: async () => { await clients.db.terminate(); await clients.rpc.close(); }};
  approved.add(connection); return connection;
}
