import type * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import {
  identityLogToken,
} from './authUserActivation';
import {
  AUTH_ACCESS_READ_MODEL_COLLECTION,
  refreshAuthAccessReadModel,
  type AuthAccessReadModelRecord,
} from './authAccessReadModel';

export const AUTH_ACCESS_MAINTENANCE_EVENT =
  'wave1_auth_access_read_model_maintenance' as const;

export type AuthAccessMaintenanceContext =
  | 'adminCreateUser'
  | 'adminUpdateUser'
  | 'adminSetUserRole'
  | 'adminArchiveUser'
  | 'legacyUserSync'
  | 'legacySchoolUserSync';

export interface AuthAccessMaintenanceResult {
  ok: boolean;
  action: 'refresh' | 'delete';
  context: AuthAccessMaintenanceContext;
  firebaseUidToken: string | null;
  personIdToken?: string | null;
  accessActive?: boolean;
  globalRoleCount?: number;
  schoolAdminOrganisationCount?: number;
  errorName?: string;
}

function errorName(
  error: unknown,
): string {
  return error instanceof Error
    ? error.name || 'Error'
    : 'UnknownError';
}

function successResult(params: {
  action: 'refresh' | 'delete';
  context: AuthAccessMaintenanceContext;
  firebaseUid: string;
  record?: AuthAccessReadModelRecord;
}): AuthAccessMaintenanceResult {
  return {
    ok: true,
    action: params.action,
    context: params.context,
    firebaseUidToken:
      identityLogToken(
        'uid',
        params.firebaseUid,
      ),
    ...(params.record
      ? {
          personIdToken:
            identityLogToken(
              'person',
              params.record.personId,
            ),
          accessActive:
            params.record.accessActive,
          globalRoleCount:
            params.record.globalRoles.length,
          schoolAdminOrganisationCount:
            params.record
              .schoolAdminOrganisationIds
              .length,
        }
      : {}),
  };
}

export async function refreshAuthAccessReadModelBestEffort(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
    context: AuthAccessMaintenanceContext;
  },
): Promise<AuthAccessMaintenanceResult> {
  try {
    const record =
      await refreshAuthAccessReadModel({
        db: params.db,
        firebaseUid:
          params.firebaseUid,
      });

    return successResult({
      action: 'refresh',
      context: params.context,
      firebaseUid:
        params.firebaseUid,
      record,
    });
  } catch (error) {
    const result:
      AuthAccessMaintenanceResult = {
        ok: false,
        action: 'refresh',
        context: params.context,
        firebaseUidToken:
          identityLogToken(
            'uid',
            params.firebaseUid,
          ),
        errorName:
          errorName(error),
      };

    logger.warn(
      AUTH_ACCESS_MAINTENANCE_EVENT,
      {
        event:
          AUTH_ACCESS_MAINTENANCE_EVENT,
        ...result,
      },
    );

    return result;
  }
}

export async function refreshAuthAccessReadModelStrict(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
    context: AuthAccessMaintenanceContext;
  },
): Promise<AuthAccessMaintenanceResult> {
  const record =
    await refreshAuthAccessReadModel({
      db: params.db,
      firebaseUid:
        params.firebaseUid,
    });

  return successResult({
    action: 'refresh',
    context: params.context,
    firebaseUid:
      params.firebaseUid,
    record,
  });
}

export async function deleteAuthAccessReadModelStrict(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
    context: AuthAccessMaintenanceContext;
  },
): Promise<AuthAccessMaintenanceResult> {
  await params.db
    .collection(
      AUTH_ACCESS_READ_MODEL_COLLECTION,
    )
    .doc(params.firebaseUid)
    .delete();

  return successResult({
    action: 'delete',
    context: params.context,
    firebaseUid:
      params.firebaseUid,
  });
}
