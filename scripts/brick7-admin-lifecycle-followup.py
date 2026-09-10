from pathlib import Path

p = Path('src/pages/admin/StudentManagement/StudentList.tsx')
s = p.read_text()
old = """  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Discontinue this enrollment?')) return;
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const setEnrollmentStatus = httpsCallable(functions, 'setEnrollmentStatus');
      await setEnrollmentStatus({
        enrollmentId,
        status: 'discontinued',
        reason: 'admin_deleted',
      });
      toast({ title: 'Enrollment discontinued' });
      enrollmentsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: extractCallableErrorMessage(err, 'Failed to discontinue enrollment'),
        variant: 'destructive',
      });
    }
  };
"""
new = """  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Discontinue this enrollment?')) return;
    try {
      const regionalFunctions = getFunctions(undefined, 'asia-south1');
      const enrollmentSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
      const enrollmentData = enrollmentSnap.exists()
        ? ({ id: enrollmentSnap.id, ...(enrollmentSnap.data() as Record<string, unknown>) } as EnrollmentLite)
        : null;

      if (isCanonicalRollingEnrollmentForAdmin(enrollmentData)) {
        const setRollingEnrollmentLifecycle = httpsCallable(regionalFunctions, 'setRollingEnrollmentLifecycle');
        await setRollingEnrollmentLifecycle({
          enrollmentId,
          status: 'discontinued',
          reason: 'admin_deleted',
        });
      } else {
        // Legacy enrollments remain supported until their first rolling-schedule save.
        const setEnrollmentStatus = httpsCallable(regionalFunctions, 'setEnrollmentStatus');
        await setEnrollmentStatus({
          enrollmentId,
          status: 'discontinued',
          reason: 'admin_deleted',
        });
      }
      toast({ title: 'Enrollment discontinued' });
      await enrollmentsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: extractCallableErrorMessage(err, 'Failed to discontinue enrollment'),
        variant: 'destructive',
      });
    }
  };
"""
if old not in s:
    raise SystemExit('handleDeleteEnrollment anchor missing')
s = s.replace(old, new, 1)
p.write_text(s)
