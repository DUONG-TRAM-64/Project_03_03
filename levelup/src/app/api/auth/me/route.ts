import { NextRequest, NextResponse } from 'next/server';
import { findById, updateOne } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  dailyGoal: number;
  level: number;
  xp: number;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findById<UserDoc>('users', payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp,
        dailyGoal: user.dailyGoal,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};
    if (body.name) updates.name = body.name;
    if (body.dailyGoal) updates.dailyGoal = body.dailyGoal;

    const user = await updateOne<UserDoc>('users', payload.userId, updates as any);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
