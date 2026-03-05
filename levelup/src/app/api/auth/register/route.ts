import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findOne, insertOne, generateId } from '@/lib/store';
import { signToken } from '@/lib/auth';

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

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await findOne<UserDoc>('users', { email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await insertOne<UserDoc>('users', {
      _id: generateId(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      dailyGoal: 60,
      level: 0,
      xp: 0,
      createdAt: new Date().toISOString(),
    });

    const token = signToken({ userId: user._id, email: user.email });

    const response = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, level: user.level, xp: user.xp },
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
