import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findOne } from '@/lib/store';
import { signToken } from '@/lib/auth';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  dailyGoal: number;
  level: number;
  xp: number;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findOne<UserDoc>('users', { email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user._id, email: user.email });

    const response = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, level: user.level, xp: user.xp, dailyGoal: user.dailyGoal },
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
