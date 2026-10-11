/**
 * Read-once, manual-refresh-only cache for one mounted Admin reminder workspace.
 *
 * Data is deliberately in memory rather than Firestore, sessionStorage or a
 * background listener. Navigating between previously visited dates performs
 * no network reads. Authentication changes and explicit refresh invalidate it.
 */
export class ManualReminderReadCache<Enrollment, Session> {
  private actorUid: string | null = null;
  private revision = 0;
  private enrollmentLoad: Promise<Enrollment[]> | null = null;
  private readonly sessionLoads = new Map<string, Promise<Session[]>>();

  enrollments: Enrollment[] | null = null;
  readonly realSessionsByDate = new Map<string, Session[]>();
  readonly visibleSessionsByDate = new Map<string, Session[]>();

  useActor(uid: string | null): void {
    if (this.actorUid === uid) return;
    this.actorUid = uid;
    this.invalidate();
  }

  invalidate(): void {
    this.revision += 1;
    this.enrollments = null;
    this.enrollmentLoad = null;
    this.sessionLoads.clear();
    this.realSessionsByDate.clear();
    this.visibleSessionsByDate.clear();
  }

  async loadEnrollments(loader: () => Promise<Enrollment[]>): Promise<Enrollment[]> {
    if (this.enrollments !== null) return this.enrollments;
    if (this.enrollmentLoad) return this.enrollmentLoad;
    const revision = this.revision;
    const promise = loader().then(rows => {
      if (this.revision !== revision) throw new Error('Admin reminder cache changed during load');
      this.enrollments = rows;
      return rows;
    });
    this.enrollmentLoad = promise;
    try {
      return await promise;
    } finally {
      if (this.enrollmentLoad === promise) this.enrollmentLoad = null;
    }
  }

  async loadRealSessions(dateKey: string, loader: (key: string) => Promise<Session[]>): Promise<Session[]> {
    const cached = this.realSessionsByDate.get(dateKey);
    if (cached) return cached;
    const pending = this.sessionLoads.get(dateKey);
    if (pending) return pending;
    const revision = this.revision;
    const promise = loader(dateKey).then(rows => {
      if (this.revision !== revision) throw new Error('Admin reminder cache changed during load');
      this.realSessionsByDate.set(dateKey, rows);
      return rows;
    });
    this.sessionLoads.set(dateKey, promise);
    try {
      return await promise;
    } finally {
      if (this.sessionLoads.get(dateKey) === promise) this.sessionLoads.delete(dateKey);
    }
  }

  setVisibleSessions(dateKey: string, rows: Session[]): void {
    this.visibleSessionsByDate.set(dateKey, rows);
  }

  updateVisibleSession(id: string, update: (session: Session) => Session): void {
    this.visibleSessionsByDate.forEach((rows, date) => {
      this.visibleSessionsByDate.set(date, rows.map(session => {
        const candidate = session as Record<string, unknown>;
        return candidate.id === id ? update(session) : session;
      }));
    });
  }

  removeVisibleSession(id: string): void {
    this.visibleSessionsByDate.forEach((rows, date) => {
      this.visibleSessionsByDate.set(date, rows.filter(session =>
        (session as Record<string, unknown>).id !== id));
    });
  }
}
