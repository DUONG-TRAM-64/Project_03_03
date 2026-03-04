import { NextRequest, NextResponse } from 'next/server';
import { findAll, insertOne, updateOne, deleteOne, deleteMany, generateId, findById } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

interface SubjectDoc {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  targetHours: number;
  archived: boolean;
  createdAt: string;
}

interface SessionDoc {
  _id: string;
  userId: string;
  subjectId: string;
  duration: number;
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const showArchived = req.nextUrl.searchParams.get('archived') === 'true';

    let subjects = findAll<SubjectDoc>('subjects').filter(
      (s) => s.userId === payload.userId && (showArchived || !s.archived)
    );

    subjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const allSessions = findAll<SessionDoc>('sessions').filter((s) => s.userId === payload.userId);

    const subjectsWithHours = subjects.map((subject) => {
      const totalMinutes = allSessions
        .filter((s) => s.subjectId === subject._id)
        .reduce((sum, s) => sum + s.duration, 0);
      const totalHours = Number((totalMinutes / 60).toFixed(2));
      return {
        ...subject,
        totalHours,
        progress: subject.targetHours > 0 ? Math.min((totalHours / subject.targetHours) * 100, 100) : 0,
      };
    });

    return NextResponse.json({ subjects: subjectsWithHours });
  } catch (error: any) {
    console.error('Get subjects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, icon, color, targetHours } = await req.json();
    if (!name) return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });

    const subject = insertOne<SubjectDoc>('subjects', {
      _id: generateId(),
      userId: payload.userId,
      name,
      icon: icon || '📚',
      color: color || '#22c55e',
      targetHours: targetHours || 50,
      archived: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: any) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, icon, color, targetHours, archived } = await req.json();
    if (!id) return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });

    const existing = findById<SubjectDoc>('subjects', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const updates: Partial<SubjectDoc> = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (targetHours !== undefined) updates.targetHours = targetHours;
    if (archived !== undefined) updates.archived = archived;

    const subject = updateOne<SubjectDoc>('subjects', id, updates);
    return NextResponse.json({ subject });
  } catch (error: any) {
    console.error('Update subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    const existing = findById<SubjectDoc>('subjects', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    deleteOne('subjects', id);
    deleteMany<SessionDoc>('sessions', { subjectId: id, userId: payload.userId } as any);

    return NextResponse.json({ message: 'Subject deleted' });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
