import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocs, getDoc, query, where, onSnapshot } = vi.hoisted(() => ({
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  where: vi.fn((...args: unknown[]) => ({kind:'where',args})),
  onSnapshot: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({kind:'collection',name}),
  doc: (_db: unknown, name: string, id: string) => ({kind:'doc',name,id}),
  documentId: () => '__name__',
  query,
  where,
  orderBy: (...args: unknown[]) => ({kind:'orderBy',args}),
  getDocs,
  getDoc,
  onSnapshot,
}));
vi.mock('../../lib/firebaseConfig', () => ({db:{}}));
vi.mock('../../store/useAuthStore', () => ({useAuthStore:{subscribe:()=>()=>{}}}));
vi.mock('../../lib/sessionScheduleIntegrity', () => ({
  isSessionCanonicalForEnrollment: () => true,
  isScheduleExceptionSession: () => false,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: () => false,
}));

import { useTeacherSessions } from '../../pages/teacher/hooks/useTeacherSessions';
import { teacherCalendarSessionReadCache } from '../../pages/teacher/hooks/teacherCalendarSessionReadCache';

const date = '2099-06-08';
const makeDoc = (id: string, data: Record<string, unknown>) => ({ id, data:()=>data });
const getCollectionName = (target: any): string =>
  target?.args?.find((entry:any) => entry.kind === 'collection')?.name || '';
const constraints = (target:any): unknown[][] =>
  target?.args?.filter((entry:any)=>entry.kind==='where').map((entry:any)=>entry.args) || [];

function Fixture({teacherId='teacher-1'}:{teacherId?:string}) {
  const {sessions,isLoading,error,refresh}=useTeacherSessions(teacherId,date,date);
  return <div>
    <span>{isLoading?'loading':error?error.message:'ready'}</span>
    <span data-testid="count">{sessions.length}</span>
    {sessions.map(session=><span key={session.id} data-testid="row">{session.id}:{session.status}</span>)}
    <button onClick={refresh}>Refresh</button>
  </div>;
}

describe('Teacher Today read-once canonical class exceptions', () => {
  beforeEach(()=>{
    teacherCalendarSessionReadCache.clear();
    getDocs.mockReset();getDoc.mockReset();onSnapshot.mockReset();
    query.mockClear();where.mockClear();
    getDocs.mockImplementation(async (target:any) => {
      const collection = getCollectionName(target);
      if (collection === 'enrollments') return {docs:[makeDoc('enr-1',{
        teacherId:'teacher-1',kidId:'kid-1',childName:'Correct Child',courseId:'phonics',
      })]};
      if (collection === 'classSessions') return {docs:[makeDoc('class-1',{
        teacherId:'teacher-1',enrollmentId:'enr-1',date,
        startTime:'17:00',kidId:'kid-1',courseId:'phonics',status:'completed',
      })]};
      return {docs:[]};
    });
  });

  it('reads canonical teacherId date scope once without any listener or alias query',async()=>{
    const view=render(<Fixture />);
    await waitFor(()=>expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId('row').textContent).toBe('class-1:completed');
    const sessionQueries=getDocs.mock.calls.filter(([ref])=>getCollectionName(ref)==='classSessions');
    expect(sessionQueries).toHaveLength(1);
    const cappedStart = new Date(Date.parse(date + 'T00:00:00.000Z') -
      60 * 86_400_000).toISOString().slice(0, 10);
    expect(constraints(sessionQueries[0][0])).toEqual(expect.arrayContaining([
      ['teacherId','==','teacher-1'],['date','>=',cappedStart],['date','<=',date],
    ]));
    expect(onSnapshot).not.toHaveBeenCalled();
    view.unmount();
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(getDocs.mock.calls.filter(([ref])=>getCollectionName(ref)==='classSessions')).toHaveLength(1);
  });

  it('refreshes only after explicit user action',async()=>{
    getDocs.mockImplementation(async (target:any)=>{
      if(getCollectionName(target)==='enrollments')
        return {docs:[makeDoc('enr-1',{teacherId:'teacher-1',kidId:'kid-1',courseId:'phonics'})]};
      if(getCollectionName(target)==='classSessions')
        return {docs:[makeDoc('class-1',{teacherId:'teacher-1',enrollmentId:'enr-1',
          kidId:'kid-1',courseId:'phonics',date,startTime:'17:00',status:'completed'})]};
      return {docs:[]};
    });
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByTestId('count').textContent).toBe('1'));
    await act(async()=>{screen.getByText('Refresh').click();});
    await waitFor(()=>expect(getDocs.mock.calls.filter(([ref])=>getCollectionName(ref)==='classSessions')).toHaveLength(2));
  });

  it('fails closed when the canonical Firestore query is denied',async()=>{
    getDocs.mockImplementation(async(target:any)=>{
      if(getCollectionName(target)==='classSessions')
        throw Object.assign(new Error('Missing permissions'),{code:'permission-denied'});
      return {docs:[]};
    });
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('Unable to load teacher class exceptions. Use Refresh to try again.')).toBeTruthy());
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('does not display canonical rows owned by another teacher',async()=>{
    getDocs.mockImplementation(async(target:any)=>{
      if(getCollectionName(target)==='classSessions')
        return {docs:[makeDoc('cross-owned',{teacherId:'teacher-2',teacherIds:['teacher-1'],
          enrollmentId:'enr-1',date,startTime:'17:00',status:'completed'})]};
      return {docs:[]};
    });
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('does not query historical attendance merely to open My Schedule',async()=>{
    function Past(){
      const {sessions,isLoading}=useTeacherSessions('teacher-1','2020-01-01','2020-01-31');
      return <div>{isLoading?'loading':sessions.length}</div>;
    }
    render(<Past />);
    await waitFor(()=>expect(screen.getByText('0')).toBeTruthy());
    expect(getDocs).not.toHaveBeenCalled();
  });
});
