import { NextRequest, NextResponse } from 'next/server';
import { findAll, findById, insertOne, updateOne, deleteOne, generateId } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

interface FavoriteDoc {
  _id: string;
  userId: string;
  name: string;
  url: string;
  icon: string;
  visitCount: number;
  lastVisited: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const favorites = findAll<FavoriteDoc>('favorites')
      .filter((f) => f.userId === payload.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ favorites });
  } catch (error: any) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, url, icon } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    // Validate URL format
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Auto-generate favicon URL if no icon provided
    let faviconIcon = icon || '';
    if (!faviconIcon) {
      try {
        const urlObj = new URL(normalizedUrl);
        faviconIcon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      } catch {
        faviconIcon = '🌐';
      }
    }

    const favorite = insertOne<FavoriteDoc>('favorites', {
      _id: generateId(),
      userId: payload.userId,
      name: name.trim(),
      url: normalizedUrl,
      icon: faviconIcon,
      visitCount: 0,
      lastVisited: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: any) {
    console.error('Create favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, url, icon, incrementVisit } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = findById<FavoriteDoc>('favorites', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    const updates: Partial<FavoriteDoc> = {};

    if (name !== undefined) updates.name = name.trim();
    if (url !== undefined) {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      updates.url = normalizedUrl;

      // Update favicon if URL changed and no custom icon
      if (!icon && !existing.icon.startsWith('http')) {
        try {
          const urlObj = new URL(normalizedUrl);
          updates.icon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
          // keep existing icon
        }
      }
    }
    if (icon !== undefined) updates.icon = icon;

    if (incrementVisit) {
      updates.visitCount = (existing.visitCount || 0) + 1;
      updates.lastVisited = new Date().toISOString();
    }

    const updated = updateOne<FavoriteDoc>('favorites', id, updates);

    return NextResponse.json({ favorite: updated });
  } catch (error: any) {
    console.error('Update favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = findById<FavoriteDoc>('favorites', id);
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    deleteOne('favorites', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
