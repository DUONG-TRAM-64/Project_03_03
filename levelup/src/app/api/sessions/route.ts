import { NextRequest, NextResponse } from 'next/server';
import { findAll, findById, insertOne, deleteOne, updateOne, generateId } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';
import { calculateXP, calculateLevel } from '@/lib/utils';

interface SessionDoc {
  _id: string;
  userId: string;
  subjectId: string;
  date: string;
  duration: number;
  note: string;
  mood: string;
  createdAt: string;
}

interface SubjectDoc {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface UserDoc {
  _id: string;
  xp: number;
  level: number;
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const subjectId = req.nextUrl.searchParams.get('subjectId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    let sessions = (await findAll<SessionDoc>('sessions')).filter((s) => s.userId === payload.userId);

    if (subjectId) sessions = sessions.filter((s) => s.subjectId === subjectId);
    if (startDate) sessions = sessions.filter((s) => new Date(s.date) >= new Date(startDate));
    if (endDate) sessions = sessions.filter((s) => new Date(s.date) <= new Date(endDate));

    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sessions = sessions.slice(0, limit);

    const allSubjects = await findAll<SubjectDoc>('subjects');
    const sessionsWithSubject = sessions.map((session) => {
      const subject = allSubjects.find((s) => s._id === session.subjectId);
      return {
        ...session,
        subjectId: subject ? { _id: subject._id, name: subject.name, icon: subject.icon, color: subject.color } : null,
      };
    });

    return NextResponse.json({ sessions: sessionsWithSubject });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subjectId, date, duration, note, mood } = await req.json();
    if (!subjectId || !duration) return NextResponse.json({ error: 'Subject and duration are required' }, { status: 400 });
    if (duration < 1) return NextResponse.json({ error: 'Duration must be at least 1 minute' }, { status: 400 });

    const session = await insertOne<SessionDoc>('sessions', {
      _id: generateId(),
      userId: payload.userId,
      subjectId,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      duration,
      note: note || '',
      mood: mood || 'good',
      createdAt: new Date().toISOString(),
    });

    // Update XP
    const allSessions = (await findAll<SessionDoc>('sessions')).filter((s) => s.userId === payload.userId);
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalXP = calculateXP(totalMinutes);
    const level = calculateLevel(totalXP);
    await updateOne<UserDoc>('users', payload.userId, { xp: totalXP, level } as any);

    const subject = await findById<SubjectDoc>('subjects', subjectId);
    const populated = {
      ...session,
      subjectId: subject ? { _id: subject._id, name: subject.name, icon: subject.icon, color: subject.color } : null,
    };

    return NextResponse.json({ session: populated, xp: totalXP, level }, { status: 201 });
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    const session = await findById<SessionDoc>('sessions', id);
    if (!session || session.userId !== payload.userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await deleteOne('sessions', id);

    const allSessions = (await findAll<SessionDoc>('sessions')).filter((s) => s.userId === payload.userId);
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalXP = calculateXP(totalMinutes);
    const level = calculateLevel(totalXP);
    await updateOne<UserDoc>('users', payload.userId, { xp: totalXP, level } as any);

    return NextResponse.json({ message: 'Session deleted', xp: totalXP, level });
  } catch (error: any) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
