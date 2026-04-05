import { User, Organization, Club, Event, Comment, Announcement, Resource, Registration, ClubRequest } from '@/types';
import { api } from './api';

// ─── In-memory cache — populated on first load from backend ───
let _users: User[] = [];
let _organizations: Organization[] = [];
let _clubs: Club[] = [];
let _events: Event[] = [];
let _registrations: Registration[] = [];
let _comments: Comment[] = [];
let _announcements: Announcement[] = [];
let _clubRequests: ClubRequest[] = [];
let _credentials: Record<string, { userId: string; password: string }> = {};

let _dataLoaded = false;
let _loadPromise: Promise<void> | null = null;

// ─── Normalize MongoDB docs → frontend shape ───
function normalizeId(doc: any): any {
  if (!doc) return doc;
  const obj = { ...doc };
  if (obj._id && !obj.id) {
    obj.id = obj._id;
  }
  delete obj._id;
  delete obj.__v;
  // Map timestamps
  if (obj.createdAt) obj.createdAt = obj.createdAt;
  if (obj.updatedAt) obj.registeredAt = obj.registeredAt || obj.updatedAt;
  return obj;
}

function normalizeArray(docs: any[]): any[] {
  return docs.map(normalizeId);
}

/** Load all data from the backend API */
export async function loadAllData(): Promise<void> {
  if (_dataLoaded) return;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const [users, orgs, clubs, events, registrations, comments, announcements, clubRequests] = await Promise.all([
        api.getUsers() as Promise<any[]>,
        api.getOrganizations() as Promise<any[]>,
        api.getClubs() as Promise<any[]>,
        api.getEvents() as Promise<any[]>,
        Promise.resolve([]), // registrations loaded per-user
        Promise.resolve([]), // comments loaded per-event
        Promise.resolve([]), // announcements loaded per-event
        api.getClubRequests() as Promise<any[]>,
      ]);
      _users = normalizeArray(users);
      _organizations = normalizeArray(orgs);
      _clubs = normalizeArray(clubs);
      _events = normalizeArray(events);
      _clubRequests = normalizeArray(clubRequests);
      _dataLoaded = true;
      console.log('✅ Data loaded from backend API');
    } catch (err) {
      console.error('❌ Failed to load data from API, data may be empty:', err);
      _dataLoaded = true; // Set true anyway so we don't loop
    }
  })();

  return _loadPromise;
}

// ─── Exported reactive references (same interface as before) ───
export let mockCredentials: Record<string, { userId: string; password: string }> = _credentials;
export { _users as mockUsers };
export { _organizations as mockOrganizations };
export { _clubs as mockClubs };
export { _events as mockEvents };
export { _registrations as mockRegistrations };
export { _comments as mockComments };
export { _announcements as mockAnnouncements };
export { _clubRequests as mockClubRequests };

// Default user (will be overridden after login)
export const mockCurrentUser: User = {
  id: '', name: 'Guest', email: '', role: 'student',
  clubIds: [], interests: [], createdAt: new Date().toISOString()
};

// ─── Lookup helpers ───
export const getClubName = (id: string) => _clubs.find(c => c.id === id)?.name ?? 'Unknown Club';
export const getClubById = (id: string) => _clubs.find(c => c.id === id);
export const getUserById = (id: string) => _users.find(u => u.id === id);
export const getOrgById = (id: string) => _organizations.find(o => o.id === id);
export const getEventById = (id: string) => _events.find(e => e.id === id);
export const getEventsByClub = (clubId: string) => _events.filter(e => e.clubId === clubId || e.coOrganizers.includes(clubId));
export const getSubEvents = (parentEventId: string) => _events.filter(e => e.parentEventId === parentEventId);
export const getRegistrationsByUser = (userId: string) => _registrations.filter(r => r.userId === userId && r.status !== 'cancelled');
export const getRegistrationsByEvent = async (eventId: string): Promise<Registration[]> => {
  try {
    const result = await api.getEventRegistrations(eventId) as any[];
    const normalized = normalizeArray(result) as Registration[];
    // Merge into cache
    for (const reg of normalized) {
      if (!_registrations.find(r => r.id === reg.id)) {
        _registrations.push(reg);
      }
    }
    return normalized;
  } catch { return _registrations.filter(r => r.eventId === eventId); }
};

// ─── Comment / Announcement helpers (async — fetch per event) ───
export const getCommentsByEvent = (eventId: string) => _comments.filter(c => c.eventId === eventId);
export const getAnnouncementsByEvent = (eventId: string) => _announcements.filter(a => a.eventId === eventId);

// Async loaders for comments/announcements per event
export const fetchCommentsByEvent = async (eventId: string): Promise<Comment[]> => {
  try {
    const raw = await api.getCommentsByEvent(eventId) as any[];
    const comments = normalizeArray(raw) as Comment[];
    // Merge into local cache
    _comments = [..._comments.filter(c => c.eventId !== eventId), ...comments];
    return comments;
  } catch { return []; }
};

export const fetchAnnouncementsByEvent = async (eventId: string): Promise<Announcement[]> => {
  try {
    const raw = await api.getAnnouncementsByEvent(eventId) as any[];
    const announcements = normalizeArray(raw) as Announcement[];
    _announcements = [..._announcements.filter(a => a.eventId !== eventId), ...announcements];
    return announcements;
  } catch { return []; }
};

export const fetchRegistrationsByUser = async (userId: string): Promise<Registration[]> => {
  try {
    const raw = await api.getUserRegistrations(userId) as any[];
    const regs = normalizeArray(raw) as Registration[];
    _registrations = [..._registrations.filter(r => r.userId !== userId), ...regs];
    return regs;
  } catch { return []; }
};

/** Check if registering for newEvent conflicts with any existing registered event */
export const hasConflict = (userId: string, newEvent: { startTime: string; endTime: string; id: string }) => {
  const userRegs = getRegistrationsByUser(userId);
  const newStart = new Date(newEvent.startTime).getTime();
  const newEnd = new Date(newEvent.endTime).getTime();
  for (const reg of userRegs) {
    if (reg.eventId === newEvent.id) continue;
    const existing = getEventById(reg.eventId);
    if (!existing) continue;
    const existStart = new Date(existing.startTime).getTime();
    const existEnd = new Date(existing.endTime).getTime();
    if (newStart < existEnd && newEnd > existStart) return existing;
  }
  return null;
};

// ─── Mutation helpers (call API + update local cache) ───

/** Register user for event */
export const addRegistration = async (reg: Registration) => {
  try {
    const result = await api.registerForEvent({
      userId: reg.userId,
      eventId: reg.eventId,
      participantName: reg.participantName,
      rollNumber: reg.rollNumber,
      year: reg.year,
      phone: reg.phone,
      teamName: reg.teamName
    }) as any;
    const normalized = normalizeId(result) as Registration;
    _registrations = [..._registrations, normalized];
    // Update local event count
    _events = _events.map(e =>
      e.id === reg.eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
    );
    return normalized;
  } catch (err: any) {
    throw err;
  }
};

/** Add a new event */
export const addEvent = async (event: Event) => {
  try {
    const result = await api.createEvent(event) as any;
    const normalized = normalizeId(result) as Event;
    _events = [..._events, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

/** Update an existing event */
export const updateEvent = async (id: string, updates: Partial<Omit<Event, 'id'>>) => {
  try {
    const result = await api.updateEvent(id, updates) as any;
    const normalized = normalizeId(result) as Event;
    _events = _events.map(e => e.id === id ? normalized : e);
    return normalized;
  } catch (err: any) { throw err; }
};

/** Delete an event */
export const deleteEvent = async (id: string) => {
  try {
    await api.deleteEvent(id);
    _events = _events.filter(e => e.id !== id);
    _registrations = _registrations.filter(r => r.eventId !== id);
    _comments = _comments.filter(c => c.eventId !== id);
    _announcements = _announcements.filter(a => a.eventId !== id);
  } catch (err: any) { throw err; }
};

/** Add a new comment */
export const addComment = async (comment: Comment) => {
  try {
    const result = await api.createComment(comment) as any;
    const normalized = normalizeId(result) as Comment;
    _comments = [..._comments, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

/** Delete a comment */
export const deleteComment = async (commentId: string) => {
  try {
    await api.deleteComment(commentId);
    _comments = _comments.filter(c => c.id !== commentId);
  } catch (err: any) { throw err; }
};

/** Add a new announcement */
export const addAnnouncement = async (announcement: Announcement) => {
  try {
    const result = await api.createAnnouncement(announcement) as any;
    const normalized = normalizeId(result) as Announcement;
    _announcements = [..._announcements, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

/** Update announcement */
export const updateAnnouncement = async (id: string, updates: Partial<Omit<Announcement, 'id'>>) => {
  try {
    const result = await api.updateAnnouncement(id, updates) as any;
    const normalized = normalizeId(result) as Announcement;
    _announcements = _announcements.map(a => a.id === id ? normalized : a);
    return normalized;
  } catch (err: any) { throw err; }
};

/** Delete announcement */
export const deleteAnnouncement = async (announcementId: string) => {
  try {
    await api.deleteAnnouncement(announcementId);
    _announcements = _announcements.filter(a => a.id !== announcementId);
  } catch (err: any) { throw err; }
};

/** Add resource to event */
export const addResource = async (eventId: string, resource: Resource) => {
  const event = _events.find(e => e.id === eventId);
  if (!event) return;
  const updatedResources = [...event.resources, resource];
  await updateEvent(eventId, { resources: updatedResources });
};

/** Update resource within event */
export const updateResource = async (eventId: string, resourceId: string, updates: Partial<Omit<Resource, 'id'>>) => {
  const event = _events.find(e => e.id === eventId);
  if (!event) return;
  const updatedResources = event.resources.map(r => r.id === resourceId ? { ...r, ...updates } : r);
  await updateEvent(eventId, { resources: updatedResources });
};

/** Delete resource from event */
export const deleteResource = async (eventId: string, resourceId: string) => {
  const event = _events.find(e => e.id === eventId);
  if (!event) return;
  const updatedResources = event.resources.filter(r => r.id !== resourceId);
  await updateEvent(eventId, { resources: updatedResources });
};

/** Add a new organization */
export const addOrganization = async (org: Organization) => {
  try {
    const result = await api.createOrganization(org) as any;
    const normalized = normalizeId(result) as Organization;
    _organizations = [..._organizations, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

/** Update organization */
export const updateOrganization = async (id: string, updates: Partial<Omit<Organization, 'id'>>) => {
  try {
    const result = await api.updateOrganization(id, updates) as any;
    const normalized = normalizeId(result) as Organization;
    _organizations = _organizations.map(o => o.id === id ? normalized : o);
    return normalized;
  } catch (err: any) { throw err; }
};

/** Add a new user + credentials */
export const addUser = async (user: User, email: string, password: string) => {
  try {
    const result = await api.register({ name: user.name, email, password, role: user.role, rollNumber: user.rollNumber, year: user.year?.toString() }) as any;
    const normalized = normalizeId(result) as User;
    _users = [..._users, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

/** Update a user's role */
export const updateUserRole = async (userId: string, newRole: string) => {
  try {
    const result = await api.updateUserRole(userId, newRole) as any;
    const normalized = normalizeId(result) as User;
    _users = _users.map(u => u.id === userId ? normalized : u);
    return normalized;
  } catch (err: any) { throw err; }
};

/** Update user profile */
export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'role'>>) => {
  try {
    const result = await api.updateUser(userId, updates) as any;
    const normalized = normalizeId(result) as User;
    _users = _users.map(u => u.id === userId ? normalized : u);
    return normalized;
  } catch (err: any) { throw err; }
};

/** Validate login credentials */
export const validateCredentials = async (email: string, password: string): Promise<User | null> => {
  try {
    const result = await api.login(email, password) as any;
    return normalizeId(result) as User;
  } catch {
    return null;
  }
};


/** Clear all data (for reset) */
export const clearAllBVMData = () => {
  localStorage.clear();
};

// ─── Club helpers ───
export const addClub = async (club: Club) => {
  try {
    const result = await api.createClub(club) as any;
    const normalized = normalizeId(result) as Club;
    _clubs = [..._clubs, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

export const updateClub = async (id: string, updates: Partial<Omit<Club, 'id'>>) => {
  try {
    const result = await api.updateClub(id, updates) as any;
    const normalized = normalizeId(result) as Club;
    _clubs = _clubs.map(c => c.id === id ? normalized : c);
    return normalized;
  } catch (err: any) { throw err; }
};

export const deleteClub = async (id: string) => {
  try {
    await api.deleteClub(id);
    _clubs = _clubs.filter(c => c.id !== id);
    // Also remove events from cache
    const clubEventIds = _events.filter(e => e.clubId === id).map(e => e.id);
    _events = _events.filter(e => e.clubId !== id);
    _registrations = _registrations.filter(r => !clubEventIds.includes(r.eventId));
    _comments = _comments.filter(c => !clubEventIds.includes(c.eventId));
    _announcements = _announcements.filter(a => !clubEventIds.includes(a.eventId));
  } catch (err: any) { throw err; }
};

// ─── Club Request helpers ───
export const addClubRequest = async (req: ClubRequest) => {
  try {
    const result = await api.createClubRequest(req) as any;
    const normalized = normalizeId(result) as ClubRequest;
    _clubRequests = [..._clubRequests, normalized];
    return normalized;
  } catch (err: any) { throw err; }
};

export const approveClubRequest = async (requestId: string) => {
  try {
    const result = await api.approveClubRequest(requestId) as any;
    _clubRequests = _clubRequests.map(r => r.id === requestId ? { ...r, status: 'approved' as const } : r);
    if (result.club) {
      const newClub = normalizeId(result.club) as Club;
      _clubs = [..._clubs, newClub];
      return newClub;
    }
  } catch (err: any) { throw err; }
};

export const rejectClubRequest = async (requestId: string) => {
  try {
    await api.rejectClubRequest(requestId);
    _clubRequests = _clubRequests.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r);
  } catch (err: any) { throw err; }
};
