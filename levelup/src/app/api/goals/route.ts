import { NextRequest, NextResponse } from 'next/server';
import { findAll, findById, insertOne, updateOne, deleteOne, generateId } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

interface GoalDoc {
  _id: string;
  userId: string;
  title: string;
  targetHours: number;
  reward: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goals = findAll<GoalDoc>('goals')
      .filter((g) => g.userId === payload.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ goals });
  } catch (error: any) {
    console.error('Get goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, targetHours, reward } = await req.json();
    if (!title || !targetHours) return NextResponse.json({ error: 'Title and target hours are required' }, { status: 400 });

    const goal = insertOne<GoalDoc>('goals', {
      _id: generateId(),
      userId: payload.userId,
      title,
      targetHours,
      reward: reward || '',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, completed, title, targetHours, reward } = await req.json();

    const existing = findById<GoalDoc>('goals', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updates: Partial<GoalDoc> = {};
    if (title !== undefined) updates.title = title;
    if (targetHours !== undefined) updates.targetHours = targetHours;
    if (reward !== undefined) updates.reward = reward;
    if (completed !== undefined) {
      updates.completed = completed;
      updates.completedAt = completed ? new Date().toISOString() : null;
    }

    const goal = updateOne<GoalDoc>('goals', id, updates);
    return NextResponse.json({ goal });
  } catch (error: any) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    const existing = findById<GoalDoc>('goals', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    deleteOne('goals', id);
    return NextResponse.json({ message: 'Goal deleted' });
  } catch (error: any) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
