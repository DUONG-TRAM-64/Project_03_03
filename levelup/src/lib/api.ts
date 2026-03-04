const API_BASE = '';

async function fetchAPI(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    fetchAPI('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/api/auth/me'),
  updateProfile: (data: { name?: string; dailyGoal?: number }) =>
    fetchAPI('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchAPI('/api/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (data: { password: string }) =>
    fetchAPI('/api/auth/delete', { method: 'POST', body: JSON.stringify(data) }),
};

// Subjects
export const subjectsAPI = {
  getAll: (archived = false) => fetchAPI(`/api/subjects?archived=${archived}`),
  create: (data: { name: string; icon?: string; color?: string; targetHours?: number }) =>
    fetchAPI('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: string; name?: string; icon?: string; color?: string; targetHours?: number; archived?: boolean }) =>
    fetchAPI('/api/subjects', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI('/api/subjects', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Sessions
export const sessionsAPI = {
  getAll: (params?: { limit?: number; subjectId?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.subjectId) query.set('subjectId', params.subjectId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return fetchAPI(`/api/sessions?${query.toString()}`);
  },
  create: (data: { subjectId: string; date?: string; duration: number; note?: string; mood?: string }) =>
    fetchAPI('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI('/api/sessions', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Goals
export const goalsAPI = {
  getAll: () => fetchAPI('/api/goals'),
  create: (data: { title: string; targetHours: number; reward?: string }) =>
    fetchAPI('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: string; completed?: boolean; title?: string; targetHours?: number; reward?: string }) =>
    fetchAPI('/api/goals', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Favorites
export const favoritesAPI = {
  getAll: () => fetchAPI('/api/favorites'),
  create: (data: { name: string; url: string; icon?: string }) =>
    fetchAPI('/api/favorites', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: { id: string; name?: string; url?: string; icon?: string; incrementVisit?: boolean }) =>
    fetchAPI('/api/favorites', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI('/api/favorites', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Stats
export const statsAPI = {
  getDashboard: () => fetchAPI('/api/stats/dashboard'),
};
