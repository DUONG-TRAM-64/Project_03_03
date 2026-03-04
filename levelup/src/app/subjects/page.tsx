'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subjectsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProgressBar from '@/components/ProgressBar';
import Modal from '@/components/Modal';
import { PageLoader } from '@/components/LoadingSpinner';

interface SubjectData {
  _id: string;
  name: string;
  icon: string;
  color: string;
  targetHours: number;
  totalHours: number;
  progress: number;
  archived: boolean;
}

const SUBJECT_ICONS = ['📚', '💻', '🧮', '🎨', '🔬', '🌍', '📝', '🎵', '🏋️', '🧠', '📖', '🗣️', '🎯', '⚡', '🔥'];
const SUBJECT_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#14b8a6', '#ef4444', '#6366f1', '#06b6d4'];

export default function SubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📚');
  const [formColor, setFormColor] = useState('#22c55e');
  const [formTarget, setFormTarget] = useState(50);
  const [saving, setSaving] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await subjectsAPI.getAll(showArchived);
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchSubjects();
    }
  }, [user, authLoading, router, fetchSubjects]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormName('');
    setFormIcon('📚');
    setFormColor('#22c55e');
    setFormTarget(50);
    setModalOpen(true);
  };

  const openEditModal = (subject: SubjectData) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormIcon(subject.icon);
    setFormColor(subject.color);
    setFormTarget(subject.targetHours);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      if (editingSubject) {
        await subjectsAPI.update({
          id: editingSubject._id,
          name: formName,
          icon: formIcon,
          color: formColor,
          targetHours: formTarget,
        });
      } else {
        await subjectsAPI.create({
          name: formName,
          icon: formIcon,
          color: formColor,
          targetHours: formTarget,
        });
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error('Failed to save subject:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (subject: SubjectData) => {
    try {
      await subjectsAPI.update({ id: subject._id, archived: !subject.archived });
      fetchSubjects();
    } catch (error) {
      console.error('Failed to archive subject:', error);
    }
  };

  const handleDelete = async (subject: SubjectData) => {
    if (!confirm(`Delete "${subject.name}" and all its sessions? This cannot be undone.`)) return;
    try {
      await subjectsAPI.delete(subject._id);
      fetchSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-white">📚 Subjects</h1>
            <p className="text-dark-400 text-sm mt-1">{subjects.length} subjects</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary text-sm">
            + Add Subject
          </button>
        </div>

        {/* Archive toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !showArchived ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-dark-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showArchived ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-dark-400 hover:text-white'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Subjects Grid */}
        {subjects.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-dark-400">
              {showArchived ? 'No archived subjects' : 'No subjects yet. Create your first one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject, index) => (
              <div
                key={subject._id}
                className="card-hover animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      {subject.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{subject.name}</h3>
                      <p className="text-xs text-dark-400">
                        {subject.totalHours}h / {subject.targetHours}h
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-white hover:bg-dark-700 transition-colors text-sm"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleArchive(subject)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-yellow-400 hover:bg-dark-700 transition-colors text-sm"
                      title={subject.archived ? 'Unarchive' : 'Archive'}
                    >
                      {subject.archived ? '📤' : '📥'}
                    </button>
                    <button
                      onClick={() => handleDelete(subject)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-red-400 hover:bg-dark-700 transition-colors text-sm"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <ProgressBar value={subject.progress} color={subject.color} size="md" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input-field"
              placeholder="e.g. Machine Learning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    formIcon === icon
                      ? 'bg-primary-500/20 border-2 border-primary-500 scale-110'
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    formColor === color ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Target Hours
            </label>
            <input
              type="number"
              value={formTarget}
              onChange={(e) => setFormTarget(Number(e.target.value))}
              className="input-field"
              min={1}
              max={10000}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
