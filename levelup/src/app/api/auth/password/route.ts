import { NextRequest, NextResponse } from 'next/server';
import { findById, updateOne } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  dailyGoal: number;
  level: number;
  xp: number;
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const user = findById<UserDoc>('users', payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    updateOne<UserDoc>('users', payload.userId, { passwordHash: newHash } as any);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
