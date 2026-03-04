import { NextRequest, NextResponse } from 'next/server';
import { findById, deleteOne, deleteMany, findAll } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    const user = findById<UserDoc>('users', payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 });
    }

    // Delete all user data
    const collections = ['sessions', 'subjects', 'goals', 'favorites'];
    for (const collection of collections) {
      const items = findAll<{ _id: string; userId: string }>(collection)
        .filter((item) => item.userId === payload.userId);
      for (const item of items) {
        deleteOne(collection, item._id);
      }
    }

    // Delete user
    deleteOne('users', payload.userId);

    const response = NextResponse.json({ success: true, message: 'Account deleted' });
    response.cookies.set('token', '', { maxAge: 0 });
    return response;
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
