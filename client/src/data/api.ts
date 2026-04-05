// ─── API client for BVM Campus Management backend ───
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : '/api').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        if (contentType.includes('application/json')) {
            try {
                const err = JSON.parse(bodyText);
                throw new Error(err.message || 'API request failed');
            } catch {
                throw new Error(`API error ${res.status}: ${res.statusText}`);
            }
        }

        if (bodyText.trim().startsWith('<!doctype') || bodyText.trim().startsWith('<html')) {
            throw new Error(`API endpoint misconfigured (${res.status}). Check backend deployment and VITE_API_BASE_URL.`);
        }

        throw new Error(bodyText || `API error ${res.status}: ${res.statusText}`);
    }

    if (!contentType.includes('application/json')) {
        const bodyText = await res.text().catch(() => '');
        if (bodyText.trim().startsWith('<!doctype') || bodyText.trim().startsWith('<html')) {
            throw new Error('API returned HTML instead of JSON. Check backend route/rewrite config.');
        }
        throw new Error('API returned non-JSON response.');
    }

    return res.json();
}

export const api = {
    // ── Users / Auth ──
    login: (email: string, password: string) =>
        request('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: { name: string; email: string; password: string; role?: string; rollNumber?: string; year?: string }) =>
        request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
    getUsers: () => request('/users'),
    getUser: (id: string) => request(`/users/${id}`),
    updateUserRole: (id: string, role: string) =>
        request(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    updateUser: (id: string, data: any) =>
        request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // ── Events ──
    getEvents: () => request('/events'),
    getEvent: (id: string) => request(`/events/${id}`),
    createEvent: (data: any) =>
        request('/events', { method: 'POST', body: JSON.stringify(data) }),
    updateEvent: (id: string, data: any) =>
        request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEvent: (id: string) =>
        request(`/events/${id}`, { method: 'DELETE' }),

    // ── Clubs ──
    getClubs: () => request('/clubs'),
    getClub: (id: string) => request(`/clubs/${id}`),
    createClub: (data: any) =>
        request('/clubs', { method: 'POST', body: JSON.stringify(data) }),
    updateClub: (id: string, data: any) =>
        request(`/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteClub: (id: string) =>
        request(`/clubs/${id}`, { method: 'DELETE' }),

    // ── Organizations ──
    getOrganizations: () => request('/organizations'),
    getOrganization: (id: string) => request(`/organizations/${id}`),
    createOrganization: (data: any) =>
        request('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    updateOrganization: (id: string, data: any) =>
        request(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // ── Registrations ──
    registerForEvent: (data: any) =>
        request('/registrations', { method: 'POST', body: JSON.stringify(data) }),
    getUserRegistrations: (userId: string) =>
        request(`/registrations/user/${userId}`),
    getEventRegistrations: (eventId: string) =>
        request(`/registrations/event/${eventId}`),

    // ── Comments ──
    getCommentsByEvent: (eventId: string) =>
        request(`/comments/event/${eventId}`),
    createComment: (data: any) =>
        request('/comments', { method: 'POST', body: JSON.stringify(data) }),
    deleteComment: (id: string) =>
        request(`/comments/${id}`, { method: 'DELETE' }),

    // ── Announcements ──
    getAnnouncementsByEvent: (eventId: string) =>
        request(`/announcements/event/${eventId}`),
    createAnnouncement: (data: any) =>
        request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    updateAnnouncement: (id: string, data: any) =>
        request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAnnouncement: (id: string) =>
        request(`/announcements/${id}`, { method: 'DELETE' }),

    // ── Club Requests ──
    getClubRequests: () => request('/club-requests'),
    createClubRequest: (data: any) =>
        request('/club-requests', { method: 'POST', body: JSON.stringify(data) }),
    approveClubRequest: (id: string) =>
        request(`/club-requests/${id}/approve`, { method: 'PUT' }),
    rejectClubRequest: (id: string) =>
        request(`/club-requests/${id}/reject`, { method: 'PUT' }),

    // ── Org Onboard Requests ──
    getOrgRequests: () => request('/org-requests'),
    createOrgRequest: (data: any) =>
        request('/org-requests', { method: 'POST', body: JSON.stringify(data) }),
    approveOrgRequest: (id: string) =>
        request(`/org-requests/${id}/approve`, { method: 'PUT' }),
    rejectOrgRequest: (id: string) =>
        request(`/org-requests/${id}/reject`, { method: 'PUT' }),

    // ── Health ──
    health: () => request('/health'),
};
