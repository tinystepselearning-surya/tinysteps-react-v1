import { HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

export function handleFunctionError(err: any, functionName: string) {
  if (err instanceof HttpsError) {
    logger.warn(`${functionName}: known error`, {
      code: err.code,
      message: err.message,
    });
    throw err;
  }

  logger.error(`${functionName}: unexpected error`, {
    error: String(err),
    stack: err?.stack,
  });

  throw new HttpsError(
    'internal',
    `An unexpected error occurred in ${functionName}`
  );
}
