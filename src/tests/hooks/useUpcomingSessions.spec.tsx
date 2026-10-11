import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocs, getDoc, query, where, onSnapshot } = vi.hoisted(() => ({
  getDocs: vi.fn(), getDoc: vi.fn(),
  query: vi.fn((...args:unknown[])=>({kind:'query',args})),
  where: vi.fn((...args:unknown[])=>({kind:'where',args})),
  onSnapshot:vi.fn(),
}));
vi.mock('firebase/firestore',()=>({
  collection:(_db:unknown,name:string)=>({kind:'collection',name}),
  doc:(_db:unknown,name:string,id:string)=>({kind:'doc',name,id}),
  documentId:()=> '__name__',
  query,where,
  orderBy:(...args:unknown[])=>({kind:'orderBy',args}),
  getDocs,getDoc,onSnapshot,
}));
vi.mock('../../lib/firebaseConfig',()=>({db:{}}));
vi.mock('../../store/useAuthStore',()=>({useAuthStore:{subscribe:()=>()=>{}}}));
vi.mock('../../lib/sessionScheduleIntegrity',()=>({
  isSessionCanonicalForEnrollment:()=>true,
  isScheduleExceptionSession:()=>false,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment:()=>false,
}));
import { useUpcomingSessions } from '../../pages/teacher/hooks/useUpcomingSessions';
import { teacherCalendarSessionReadCache } from '../../pages/teacher/hooks/teacherCalendarSessionReadCache';

const date='2099-06-08';
const docSnap=(id:string,data:Record<string,unknown>)=>({id,data:()=>data});
const collectionName=(target:any):string=>target?.args?.find((v:any)=>v.kind==='collection')?.name||'';

function Fixture({teacherId='teacher-1',selectedDate=date}:{teacherId?:string;selectedDate?:string}){
  const {sessions,isLoading,error,refresh}=useUpcomingSessions(teacherId,selectedDate);
  return <div>
    <span>{isLoading?'loading':error?error.message:'ready'}</span>
    <span data-testid="count">{sessions.length}</span>
    {sessions.map(s=><span data-testid="row" key={s.id}>{s.id}:{s.date}</span>)}
    <button onClick={refresh}>Refresh</button>
  </div>;
}

describe('Upcoming teacher read-once date cache',()=>{
  beforeEach(()=>{
    teacherCalendarSessionReadCache.clear();
    getDocs.mockReset();getDoc.mockReset();onSnapshot.mockReset();
    getDocs.mockImplementation(async(target:any)=>{
      if(collectionName(target)==='enrollments')return {docs:[
        docSnap('enr-1',{teacherId:'teacher-1',kidId:'kid-1',courseId:'phonics',
          status:'active',studentName:'Child One'}),
      ]};
      if(collectionName(target)==='classSessions')return {docs:[
        docSnap('class-1',{teacherId:'teacher-1',enrollmentId:'enr-1',kidId:'kid-1',
          courseId:'phonics',date,startTime:'18:00',status:'scheduled'}),
      ]};
      return {docs:[]};
    });
  });

  it('reads only canonical teacher/date and does not attach a listener',async()=>{
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(onSnapshot).not.toHaveBeenCalled();
    const queries=getDocs.mock.calls.filter(([ref])=>collectionName(ref)==='classSessions');
    expect(queries).toHaveLength(1);
    expect(queries[0][0].args.some((x:any)=>x.kind==='where'&&x.args?.[0]==='teacherId'
      &&x.args?.[2]==='teacher-1')).toBe(true);
  });

  it('reuses same-date data across remounts and loads a newly viewed date once',async()=>{
    const first=render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    first.unmount();
    const second=render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    expect(getDocs.mock.calls.filter(([ref])=>collectionName(ref)==='classSessions')).toHaveLength(1);
    second.rerender(<Fixture selectedDate="2099-06-09" />);
    await waitFor(()=>expect(getDocs.mock.calls.filter(([ref])=>collectionName(ref)==='classSessions')).toHaveLength(2));
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('performs a new read only when the teacher explicitly clicks Refresh',async()=>{
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    await act(async()=>{screen.getByText('Refresh').click();});
    await waitFor(()=>expect(getDocs.mock.calls.filter(([ref])=>collectionName(ref)==='classSessions')).toHaveLength(2));
  });

  it('preserves strict canonical ownership even when legacy aliases disagree',async()=>{
    getDocs.mockImplementation(async(target:any)=>{
      if(collectionName(target)==='classSessions')return {docs:[
        docSnap('stale',{teacherId:'teacher-2',teacherIds:['teacher-1'],
          enrollmentId:'enr-1',date,startTime:'17:00',status:'scheduled'}),
      ]};
      return {docs:[]};
    });
    render(<Fixture />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('never retrieves historical classSessions from the browsing calendar',async()=>{
    render(<Fixture selectedDate="2020-01-01" />);
    await waitFor(()=>expect(screen.getByText('ready')).toBeTruthy());
    expect(getDocs.mock.calls.filter(([ref])=>collectionName(ref)==='classSessions')).toHaveLength(0);
  });
});
