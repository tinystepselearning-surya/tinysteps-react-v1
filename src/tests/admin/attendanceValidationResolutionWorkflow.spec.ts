import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AV7 approved attendance validation correction workflow', () => {
  const dashboard = readRepoFile('src/pages/admin/AttendanceValidationDashboard.tsx');
  const businessView = readRepoFile(
    'src/pages/admin/components/AttendanceValidationBusinessView.tsx',
  );
  const correctionPanel = readRepoFile('src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx');
  const correctionClient = readRepoFile('src/pages/admin/attendanceCorrectionTeacherPay.ts');
  const correctionFunction = readRepoFile('functions/src/saveTeacherSessionProgress.ts');
  const functionsIndex = readRepoFile('functions/src/index.ts');

  it('keeps correction routing out of the simplified AVS business screen', () => {
    expect(dashboard).not.toContain("params.set('tab', 'attendance-corrections')");
    expect(dashboard).not.toContain("params.set('avsCaseId', item.id)");
    expect(dashboard).not.toContain("params.set('avsFingerprint', item.inputFingerprint)");
    expect(businessView).not.toContain('Review correction');
    expect(businessView).not.toContain('correct_to_absent');
    expect(businessView).not.toContain('correct_to_present');
  });

  it('prefills the exact AVS-linked session and locks the approval target', () => {
    expect(correctionPanel).toContain("getDoc(doc(db, 'classSessions', av7Context.sessionId))");
    expect(correctionPanel).toContain("setMode('existing')");
    expect(correctionPanel).toContain('setPendingSessionSelection');
    expect(correctionPanel).toContain('disabled={saving || Boolean(av7Context)}');
    expect(correctionPanel).toContain('AV7 approved-correction review');
    expect(correctionPanel).toContain('Existing teacher-pay and finance safeguards still apply.');
    expect(correctionPanel).toContain('Approve AVS Correction');
  });

  it('passes validation linkage through the existing adminAttendanceCorrection callable', () => {
    expect(correctionClient).toContain(">(functions, 'adminAttendanceCorrection')");
    expect(correctionClient).toContain('validationCaseId?: string');
    expect(correctionClient).toContain('validationCaseFingerprint?: string');
    expect(correctionClient).toContain('...validationLink');
    expect(functionsIndex).toContain(
      'export { saveTeacherSessionProgress, adminAttendanceCorrection } from "./saveTeacherSessionProgress";',
    );
    expect(functionsIndex).not.toContain('approveAttendanceValidationCorrection');
  });

  it('fails closed when the AVS case is stale or no longer matches operational attendance', () => {
    expect(correctionFunction).toContain(
      'Attendance validation case changed. Refresh AVS before approving a correction.',
    );
    expect(correctionFunction).toContain(
      'Attendance changed after this AVS case was produced. Refresh validation before correcting.',
    );
    expect(correctionFunction).toContain(
      'This attendance validation case does not recommend an approvable correction.',
    );
    expect(correctionFunction).toContain(
      'Requested attendance status does not match the AVS recommendation.',
    );
    expect(correctionFunction).toContain(
      'This exact attendance validation case revision was already resolved.',
    );
    expect(correctionFunction).toContain(
      'AVS-linked correction cannot be applied to a cancelled session.',
    );
    expect(correctionFunction).toContain(
      'AVS-linked correction cannot reinterpret a non-canonical attendance status.',
    );
    expect(correctionFunction).toContain('{ lastUpdateTime: sessionUpdateTime }');
    expect(correctionFunction).toContain('{ lastUpdateTime: av7ValidationLink.caseUpdateTime }');
  });

  it('writes resolution history and case linkage in the same existing correction batch', () => {
    expect(correctionFunction).toContain("db.collection('attendanceValidationResolutions').doc(resolutionId)");
    expect(correctionFunction).toContain("brick: 'AV7'");
    expect(correctionFunction).toContain("decision: 'approved_correction'");
    expect(correctionFunction).toContain("resolutionStatus: 'resolved'");
    expect(correctionFunction).toContain('attendanceCorrectionId: auditRef.id');
    expect(correctionFunction).toContain('batch.create(av7ValidationLink.resolutionRef');
    expect(correctionFunction).toContain('batch.update(\n        av7ValidationLink.caseRef');
  });

  it('keeps browser AVS mutation out of the correction UI', () => {
    expect(dashboard).not.toContain('setDoc(');
    expect(dashboard).not.toContain('updateDoc(');
    expect(dashboard).not.toContain('deleteDoc(');
    expect(correctionPanel).not.toContain("collection(db, 'attendanceValidationResolutions')");
    expect(correctionPanel).not.toContain("collection(db, 'attendanceValidationCases')");
  });
});
