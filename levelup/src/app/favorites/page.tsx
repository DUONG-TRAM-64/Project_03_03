'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { favoritesAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { PageLoader } from '@/components/LoadingSpinner';

interface Favorite {
  _id: string;
  name: string;
  url: string;
  icon: string;
  visitCount: number;
  lastVisited: string | null;
  createdAt: string;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await favoritesAPI.getAll();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, router, fetchFavorites]);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormUrl('');
    setFormIcon('');
    setModalOpen(true);
  };

  const openEditModal = (fav: Favorite) => {
    setEditingId(fav._id);
    setFormName(fav.name);
    setFormUrl(fav.url);
    setFormIcon(fav.icon.startsWith('http') ? '' : fav.icon);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await favoritesAPI.update({
          id: editingId,
          name: formName,
          url: formUrl,
          icon: formIcon || undefined,
        });
      } else {
        await favoritesAPI.create({
          name: formName,
          url: formUrl,
          icon: formIcon || undefined,
        });
      }
      setModalOpen(false);
      fetchFavorites();
    } catch (error) {
      console.error('Failed to save favorite:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await favoritesAPI.delete(id);
      setDeleteId(null);
      fetchFavorites();
    } catch (error) {
      console.error('Failed to delete favorite:', error);
    }
  };

  const handleVisit = async (fav: Favorite) => {
    // Track visit
    favoritesAPI.update({ id: fav._id, incrementVisit: true }).catch(() => {});
    window.open(fav.url, '_blank', 'noopener,noreferrer');
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (authLoading || loading) return <PageLoader />;

  const quickIcons = ['🌐', '📚', '💻', '🎬', '🎵', '📰', '🔬', '🎮', '📝', '🏫', '📖', '🧠'];

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-white">⭐ Favorite Websites</h1>
            <p className="text-dark-400 text-sm mt-1">
              {favorites.length} website{favorites.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1 bg-dark-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'card'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                ☰
              </button>
            </div>
            <button onClick={openAddModal} className="btn-primary text-sm">
              + Add Website
            </button>
          </div>
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-16 animate-fade-in">
            <span className="text-5xl mb-4">🌐</span>
            <h3 className="text-lg font-bold text-white mb-2">No favorites yet</h3>
            <p className="text-dark-400 text-sm mb-6">
              Save your favorite learning websites for quick access
            </p>
            <button onClick={openAddModal} className="btn-primary text-sm">
              + Add Your First Website
            </button>
          </div>
        )}

        {/* Card View */}
        {favorites.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <div
                key={fav._id}
                className="card-hover group cursor-pointer animate-fade-in relative"
                onClick={() => handleVisit(fav)}
              >
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(fav);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-600 transition-all text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(fav._id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-red-400 hover:bg-dark-600 transition-all text-sm"
                  >
                    🗑️
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-dark-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {fav.icon.startsWith('http') ? (
                      <img
                        src={fav.icon}
                        alt={fav.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '🌐';
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{fav.icon || '🌐'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                      {fav.name}
                    </h3>
                    <p className="text-sm text-dark-400 truncate mt-0.5">{getDomain(fav.url)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-dark-500">
                        {fav.visitCount} visit{fav.visitCount !== 1 ? 's' : ''}
                      </span>
                      {fav.lastVisited && (
                        <span className="text-xs text-dark-500">
                          Last: {new Date(fav.lastVisited).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* External link indicator */}
                <div className="absolute bottom-3 right-3 text-dark-600 group-hover:text-dark-400 transition-colors">
                  <span className="text-xs">↗</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {favorites.length > 0 && viewMode === 'table' && (
          <div className="card overflow-x-auto animate-fade-in">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider py-3 px-4">
                    Icon
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider py-3 px-4">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">
                    URL
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider py-3 px-4 hidden md:table-cell">
                    Visits
                  </th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider py-3 px-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {favorites.map((fav) => (
                  <tr
                    key={fav._id}
                    className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                    onClick={() => handleVisit(fav)}
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden">
                        {fav.icon.startsWith('http') ? (
                          <img
                            src={fav.icon}
                            alt={fav.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '🌐';
                            }}
                          />
                        ) : (
                          <span className="text-lg">{fav.icon || '🌐'}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-white">{fav.name}</span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-sm text-dark-400 truncate block max-w-[200px]">
                        {getDomain(fav.url)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-sm text-dark-400">{fav.visitCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(fav);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-600 transition-all text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(fav._id);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-red-400 hover:bg-dark-600 transition-all text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Website' : 'Add Website'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Website Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input-field"
              placeholder="e.g. YouTube, LeetCode, Coursera"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">URL</label>
            <input
              type="text"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="input-field"
              placeholder="e.g. https://youtube.com"
            />
            <p className="text-xs text-dark-500 mt-1">
              Favicon will be auto-fetched from the URL
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Custom Icon (optional)
            </label>
            <input
              type="text"
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              className="input-field mb-2"
              placeholder="Paste an emoji or leave blank for auto-favicon"
            />
            <div className="flex flex-wrap gap-2">
              {quickIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    formIcon === icon
                      ? 'bg-primary-500/20 border-2 border-primary-500 scale-110'
                      : 'bg-dark-700 border-2 border-transparent hover:bg-dark-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formName.trim() || !formUrl.trim() || saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Website'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Website"
      >
        <div className="space-y-4">
          <p className="text-dark-300">Are you sure you want to remove this website from your favorites?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="btn-danger flex-1">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
