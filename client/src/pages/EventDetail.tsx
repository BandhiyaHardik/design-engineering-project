import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getEventById, getClubName, getClubById, getCommentsByEvent, getAnnouncementsByEvent,
  getSubEvents, hasConflict, getRegistrationsByUser, getRegistrationsByEvent, addRegistration,
  addComment, deleteComment as deleteCommentHelper,
  addAnnouncement as addAnnouncementHelper, updateAnnouncement as updateAnnouncementHelper, deleteAnnouncement as deleteAnnouncementHelper,
  addResource as addResourceHelper, updateResource as updateResourceHelper, deleteResource as deleteResourceHelper,
  updateEvent as updateEventHelper, deleteEvent as deleteEventHelper,
} from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { addNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Calendar, MapPin, Users, Clock, ArrowLeft, Share2, ExternalLink,
  MessageCircle, Megaphone, FileText, Github, Video, Link2,
  CheckCircle, AlertTriangle, QrCode, Ticket, ListChecks, Info,
  Trash2, Plus, Pencil, Upload, Download, Image, UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import EventCard from '@/components/EventCard';
import type { Resource, Announcement, ResourceType, EventCategory, EventStatus } from '@/types';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [eventSnapshot, setEventSnapshot] = useState(() => getEventById(id ?? ''));

  const userRegs = getRegistrationsByUser(currentUser.id);
  const existingReg = userRegs.find(r => r.eventId === id);
  const [isRegistered, setIsRegistered] = useState(!!existingReg);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(getCommentsByEvent(id ?? ''));
  const [showRegModal, setShowRegModal] = useState(false);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [conflictEvent, setConflictEvent] = useState<ReturnType<typeof getEventById>>(null);

  // ── Announcement state ──
  const [announcements, setAnnouncements] = useState(getAnnouncementsByEvent(id ?? ''));
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementMsg, setAnnouncementMsg] = useState('');

  // ── Resource state ──
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({ title: '', link: '', type: 'other' as ResourceType });
  const [resourceFileName, setResourceFileName] = useState('');

  // ── Gallery state ──
  const [galleryImages, setGalleryImages] = useState<string[]>(eventSnapshot?.gallery ?? []);

  // ── Event edit / delete state ──
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    title: '', description: '', location: '', startTime: '', endTime: '',
    capacity: 0, registrationDeadline: '', category: 'other' as EventCategory,
    status: 'published' as EventStatus, teamSize: 0, allowExternalParticipants: false,
  });

  const [form, setForm] = useState({
    name: currentUser.name,
    rollNumber: currentUser.rollNumber ?? '',
    year: String(currentUser.year ?? ''),
    phone: currentUser.phone ?? '',
    teamName: '',
  });

  // ── Granular permission check ──
  // super_admin  → can manage ALL events
  // org_admin    → can manage events within their organization
  // club_admin   → can manage events of their club(s) only
  // organizer    → can manage events of their club(s) only
  // student     → view-only (no manage rights)
  const canManageEvent = (() => {
    switch (currentUser.role) {
      case 'super_admin':
        return true;
      case 'org_admin':
        return currentUser.organizationId === eventSnapshot?.organizationId;
      case 'club_admin':
      case 'organizer':
        return currentUser.clubIds.includes(eventSnapshot?.clubId ?? '');
      default:
        return false;
    }
  })();
  const isAdmin = canManageEvent;

  if (!eventSnapshot) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-display mb-4">Event not found</h2>
        <Link to="/events"><Button variant="outline">Back to Events</Button></Link>
      </div>
    );
  }

  const event = eventSnapshot;
  const club = getClubById(event.clubId);
  const subEvents = getSubEvents(event.id);
  const isFull = event.registeredCount >= event.capacity;
  const now = new Date();
  const isPast = event.status === 'completed' || new Date(event.endTime) < now;
  const isOngoing = !isPast && new Date(event.startTime) <= now && new Date(event.endTime) >= now;
  const isDeadlinePassed = new Date(event.registrationDeadline) < now;
  const canRegister = !isPast && !isDeadlinePassed;
  const fillPercent = Math.min((event.registeredCount / event.capacity) * 100, 100);
  const isFest = event.category === 'fest';

  const handleOpenRegModal = () => {
    if (isRegistered) {
      // Only non-participant roles can cancel registrations
      if (currentUser.role === 'student') {
        toast.error('Students cannot cancel their registration. Please contact the event organizer.');
        return;
      }
      toast.info('Registration cancelled.');
      setIsRegistered(false);
      return;
    }
    const conflict = hasConflict(currentUser.id, event);
    setConflictEvent(conflict ?? null);
    if (conflict) {
      setShowConflictConfirm(true);
    } else {
      setShowRegModal(true);
    }
  };

  const handleConflictYes = () => {
    setShowConflictConfirm(false);
    setShowRegModal(true);
  };

  const handleConflictNo = () => {
    setShowConflictConfirm(false);
    setConflictEvent(null);
    toast.info('Registration cancelled due to schedule conflict.');
  };

  const handleRegisterSubmit = async () => {
    const newReg = {
      id: `reg-${Date.now()}`,
      userId: currentUser.id,
      eventId: event.id,
      status: isFull ? 'waitlisted' as const : 'registered' as const,
      ticketQR: `QR-${currentUser.id.toUpperCase()}-${event.id.toUpperCase()}-${Date.now()}`,
      participantName: form.name,
      rollNumber: form.rollNumber,
      year: Number(form.year),
      phone: form.phone,
      teamName: form.teamName || undefined,
      registeredAt: new Date().toISOString(),
    };
    try {
      await addRegistration(newReg);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
      setShowRegModal(false);
      return;
    }
    // Re-read event so registeredCount updates live in the sidebar
    setEventSnapshot(getEventById(event.id) ?? event);
    setIsRegistered(true);
    setShowRegModal(false);
    setShowTicketModal(true);

    // Dynamic notification
    addNotification({ icon: CheckCircle, text: `You registered for ${event.title}` });
    if (conflictEvent) {
      addNotification({ icon: AlertTriangle, text: `Schedule conflict: ${event.title} overlaps with ${conflictEvent.title}` });
    }
  };

  // ── Comment handlers ──
  const handleComment = async () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c-${Date.now()}`,
      eventId: event.id,
      userId: currentUser.id,
      userName: currentUser.name,
      message: newComment,
      createdAt: new Date().toISOString(),
    };
    await addComment(comment);
    setComments(prev => [...prev, comment]);
    setNewComment('');
    toast.success('Comment posted!');
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteCommentHelper(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comment deleted.');
  };

  // ── Announcement handlers ──
  const openNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementMsg('');
    setShowAnnouncementForm(true);
  };

  const openEditAnnouncement = (a: Announcement) => {
    setEditingAnnouncement(a);
    setAnnouncementMsg(a.message);
    setShowAnnouncementForm(true);
  };

  const handleAnnouncementSubmit = async () => {
    if (!announcementMsg.trim()) return;
    if (editingAnnouncement) {
      await updateAnnouncementHelper(editingAnnouncement.id, { message: announcementMsg });
      setAnnouncements(prev =>
        prev.map(a => a.id === editingAnnouncement.id ? { ...a, message: announcementMsg } : a)
      );
      toast.success('Announcement updated.');
    } else {
      const newA: Announcement = {
        id: `a-${Date.now()}`,
        eventId: event.id,
        message: announcementMsg,
        postedBy: currentUser.id,
        postedByName: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      await addAnnouncementHelper(newA);
      setAnnouncements(prev => [...prev, newA]);
      toast.success('Announcement posted!');
    }
    setShowAnnouncementForm(false);
    setAnnouncementMsg('');
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = async (aId: string) => {
    await deleteAnnouncementHelper(aId);
    setAnnouncements(prev => prev.filter(a => a.id !== aId));
    toast.success('Announcement deleted.');
  };

  // ── Resource handlers ──
  const openNewResource = () => {
    setEditingResource(null);
    setResourceForm({ title: '', link: '', type: 'other' });
    setResourceFileName('');
    setShowResourceForm(true);
  };

  const openEditResource = (r: Resource) => {
    setEditingResource(r);
    setResourceForm({ title: r.title, link: r.link, type: r.type });
    setResourceFileName('');
    setShowResourceForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Cap at ~5 MB for localStorage safety
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setResourceForm(p => ({
        ...p,
        link: dataUrl,
        title: p.title || file.name.replace(/\.[^.]+$/, ''),
      }));
      setResourceFileName(file.name);
      // Auto-detect type from extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setResourceForm(p => ({ ...p, type: 'report' }));
      else if (ext === 'pptx' || ext === 'ppt') setResourceForm(p => ({ ...p, type: 'slides' }));
    };
    reader.readAsDataURL(file);
  };

  const handleResourceSubmit = async () => {
    if (!resourceForm.title.trim() || !resourceForm.link.trim()) return;
    if (editingResource) {
      await updateResourceHelper(event.id, editingResource.id, {
        title: resourceForm.title,
        link: resourceForm.link,
        type: resourceForm.type,
      });
      setEventSnapshot(getEventById(event.id) ?? event);
      toast.success('Resource updated.');
    } else {
      const newR: Resource = {
        id: `r-${Date.now()}`,
        eventId: event.id,
        type: resourceForm.type,
        title: resourceForm.title,
        link: resourceForm.link,
        uploadedBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      await addResourceHelper(event.id, newR);
      setEventSnapshot(getEventById(event.id) ?? event);
      toast.success('Resource added!');
    }
    setShowResourceForm(false);
    setEditingResource(null);
    setResourceForm({ title: '', link: '', type: 'other' });
  };

  const handleDeleteResource = async (rId: string) => {
    await deleteResourceHelper(event.id, rId);
    setEventSnapshot(getEventById(event.id) ?? event);
    toast.success('Resource deleted.');
  };

  // ── Event edit / delete handlers ──
  const openEditEvent = () => {
    setEditEventForm({
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.slice(0, 16),   // for datetime-local input
      endTime: event.endTime.slice(0, 16),
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline.slice(0, 16),
      category: event.category,
      status: event.status,
      teamSize: event.teamSize ?? 0,
      allowExternalParticipants: event.allowExternalParticipants ?? false,
    });
    setShowEditEventModal(true);
  };

  const handleEditEventSubmit = async () => {
    if (!editEventForm.title.trim()) return;
    const updates: Record<string, unknown> = {
      title: editEventForm.title,
      description: editEventForm.description,
      location: editEventForm.location,
      startTime: new Date(editEventForm.startTime).toISOString(),
      endTime: new Date(editEventForm.endTime).toISOString(),
      capacity: editEventForm.capacity,
      registrationDeadline: new Date(editEventForm.registrationDeadline).toISOString(),
      category: editEventForm.category,
      status: editEventForm.status,
      allowExternalParticipants: editEventForm.allowExternalParticipants,
    };
    if (editEventForm.teamSize > 0) updates.teamSize = editEventForm.teamSize;
    await updateEventHelper(event.id, updates);
    setEventSnapshot(getEventById(event.id) ?? event);
    setShowEditEventModal(false);
    toast.success('Event updated successfully!');
  };

  const handleDeleteEvent = async () => {
    await deleteEventHelper(event.id);
    toast.success('Event deleted.');
    navigate('/events');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied to clipboard!');
  };

  const resourceIcons: Record<string, typeof FileText> = {
    report: FileText, slides: FileText, drive: Link2, recording: Video, github: Github, other: Link2,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-hero py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/events" className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-none">
                    {event.category.replace('_', ' ')}
                  </Badge>
                  {isPast && <Badge className="bg-red-500/20 text-primary-foreground border-none">Closed</Badge>}
                  {isOngoing && <Badge className="bg-destructive/80 text-primary-foreground border-none animate-pulse">Live Now</Badge>}
                  {!isPast && !isOngoing && isDeadlinePassed && <Badge className="bg-amber-500/20 text-primary-foreground border-none">Registration Closed</Badge>}
                  {event.coOrganizers.length > 0 && <Badge className="bg-accent/80 text-accent-foreground border-none">Collaboration</Badge>}
                  {isFest && <Badge className="bg-yellow-500/80 text-white border-none">🎪 Fest</Badge>}
                  {event.allowExternalParticipants && <Badge className="bg-blue-500/20 text-primary-foreground border border-blue-400/40">Open to All Colleges</Badge>}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-2">{event.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.startTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(event.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                  {event.teamSize && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Team size: up to {event.teamSize}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={openEditEvent} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="bg-destructive/20 border-destructive/30 text-primary-foreground hover:bg-destructive/30">
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={handleShare} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                {isRegistered && !isPast && (
                  <Button variant="outline" size="sm" onClick={() => setShowTicketModal(true)} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                    <Ticket className="h-4 w-4 mr-1" /> My Ticket
                  </Button>
                )}
                {!isPast && canRegister && (
                  <Button
                    variant={isRegistered ? 'outline' : 'accent'}
                    size="sm"
                    onClick={handleOpenRegModal}
                    className={isRegistered ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20' : ''}
                  >
                    {isRegistered ? (
                      <><CheckCircle className="h-4 w-4 mr-1" /> Registered</>
                    ) : isFull ? (
                      <><AlertTriangle className="h-4 w-4 mr-1" /> Join Waitlist</>
                    ) : (
                      'Register Now'
                    )}
                  </Button>
                )}
                {isPast && (
                  <Badge className="bg-red-500/20 text-primary-foreground border-none px-4 py-1.5 text-sm">Event Closed</Badge>
                )}
                {!isPast && isDeadlinePassed && !isRegistered && (
                  <Badge className="bg-amber-500/20 text-primary-foreground border-none px-4 py-1.5 text-sm">Registration Closed</Badge>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold font-display mb-3">About this Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* Sub-events for Fests */}
            {isFest && subEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold font-display">Sub-Events ({subEvents.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subEvents.map((sub, i) => (
                    <EventCard key={sub.id} event={sub} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="comments">
              <TabsList className={`w-full grid ${isPast ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="comments" className="gap-1">
                  <MessageCircle className="h-4 w-4" /> Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="announcements" className="gap-1">
                  <Megaphone className="h-4 w-4" /> Announcements ({announcements.length})
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-1">
                  <FileText className="h-4 w-4" /> Resources ({event.resources.length})
                </TabsTrigger>
                {isPast && (
                  <TabsTrigger value="gallery" className="gap-1">
                    <Image className="h-4 w-4" /> Gallery ({galleryImages.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── Comments Tab ── */}
              <TabsContent value="comments" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ask a question or leave a comment..." className="min-h-[80px]" />
                      <Button size="sm" variant="hero" onClick={handleComment}>Post Comment</Button>
                    </div>
                  </div>
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-border">
                      {comments.map(c => (
                        <div key={c.id} className="flex gap-3 group">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                            {c.userName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{c.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              {c.userId === currentUser.id && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{c.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Announcements Tab ── */}
              <TabsContent value="announcements" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  {isAdmin && (
                    <Button size="sm" variant="hero" onClick={openNewAnnouncement} className="gap-1">
                      <Plus className="h-4 w-4" /> Post Announcement
                    </Button>
                  )}
                  {announcements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No announcements yet.</p>
                  ) : (
                    announcements.map(a => (
                      <div key={a.id} className="border-l-2 border-accent pl-4 py-1 group">
                        <p className="text-sm">{a.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {a.postedByName} · {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          {isAdmin && (
                            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditAnnouncement(a)} className="text-muted-foreground hover:text-primary" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* ── Resources Tab ── */}
              <TabsContent value="resources" className="mt-4">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  {isAdmin && (
                    <Button size="sm" variant="hero" onClick={openNewResource} className="gap-1">
                      <Plus className="h-4 w-4" /> Add Resource
                    </Button>
                  )}
                  {event.resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No resources uploaded yet.</p>
                  ) : (
                    event.resources.map(r => {
                      const Icon = resourceIcons[r.type] ?? Link2;
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                          <a href={r.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{r.title}</p>
                              <p className="text-xs text-muted-foreground">{r.type}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          </a>
                          {isAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => openEditResource(r)} className="text-muted-foreground hover:text-primary" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteResource(r.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* ── Gallery Tab (post-event) ── */}
              {isPast && (
                <TabsContent value="gallery" className="mt-4">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    {isAdmin && (
                      <div>
                        <label className="flex items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files) return;
                              const maxSize = 5 * 1024 * 1024;
                              const newImages: string[] = [];
                              for (const file of Array.from(files)) {
                                if (file.size > maxSize) {
                                  toast.error(`${file.name} exceeds 5 MB limit.`);
                                  continue;
                                }
                                const dataUrl = await new Promise<string>((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = () => resolve(reader.result as string);
                                  reader.readAsDataURL(file);
                                });
                                newImages.push(dataUrl);
                              }
                              if (newImages.length === 0) return;
                              const updated = [...galleryImages, ...newImages];
                              setGalleryImages(updated);
                              await updateEventHelper(event.id, { gallery: updated });
                              setEventSnapshot(getEventById(event.id) ?? event);
                              toast.success(`${newImages.length} photo(s) uploaded!`);
                            }}
                          />
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">Upload event photos (max 5 MB each)</span>
                          </div>
                        </label>
                      </div>
                    )}
                    {galleryImages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No photos uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-video">
                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  const updated = galleryImages.filter((_, i) => i !== idx);
                                  setGalleryImages(updated);
                                  await updateEventHelper(event.id, { gallery: updated });
                                  setEventSnapshot(getEventById(event.id) ?? event);
                                  toast.success('Photo removed.');
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                title="Remove photo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold font-display mb-3">Registration</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium">{event.registeredCount} / {event.capacity}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${isFull ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${fillPercent}%` }} />
                </div>
                {isPast && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attended</span>
                    <span className="font-medium">{event.attendedCount} / {event.registeredCount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  {isDeadlinePassed ? (
                    <span className="font-medium text-destructive">Closed</span>
                  ) : (
                    <span className="font-medium">{new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
                {event.teamSize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Team size</span>
                    <span className="font-medium">Up to {event.teamSize}</span>
                  </div>
                )}
                {event.allowExternalParticipants && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-600 text-xs">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>Open to all colleges</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance button for admins (ongoing or past events) */}
            {isAdmin && (isOngoing || isPast) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold font-display mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Attendance
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {isPast ? 'Review attendance records for this event.' : 'Mark attendance for students at the venue.'}
                </p>
                <Link to={`/events/${event.id}/scan`}>
                  <Button variant="hero" size="sm" className="w-full gap-2">
                    <UserCheck className="h-4 w-4" />
                    {isPast ? 'View Attendance' : 'Take Attendance'}
                  </Button>
                </Link>
              </div>
            )}

            {/* CSV Export for admins after event ends */}
            {isAdmin && isPast && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold font-display mb-3">Export Data</h3>
                <p className="text-xs text-muted-foreground mb-3">Download registration data for this event as a CSV file.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={async () => {
                    try {
                      const regs = await getRegistrationsByEvent(event.id);
                      if (regs.length === 0) {
                        toast.info('No registrations to export.');
                        return;
                      }
                      const headers = ['Name', 'Roll Number', 'Year', 'Phone', 'Team', 'Status', 'Ticket QR', 'Registered At'];
                      const rows = regs.map(r => [
                        r.participantName ?? '',
                        r.rollNumber ?? '',
                        r.year?.toString() ?? '',
                        r.phone ?? '',
                        r.teamName ?? '',
                        r.status,
                        r.ticketQR ?? '',
                        r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : '',
                      ]);
                      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('CSV exported successfully!');
                    } catch {
                      toast.error('Failed to export data.');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export Registrations CSV
                </Button>
              </div>
            )}            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold font-display mb-3">Organizer</h3>
              {club && (
                <Link to={`/clubs/${club.id}`} className="flex items-center gap-3 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground font-bold text-sm">
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{club.name}</p>
                    <p className="text-xs text-muted-foreground">{club.members.length} members</p>
                  </div>
                </Link>
              )}
              {event.coOrganizers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Co-organizers</p>
                  {event.coOrganizers.map(coId => (
                    <Link key={coId} to={`/clubs/${coId}`} className="text-sm text-primary hover:underline block">
                      {getClubName(coId)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isRegistered && !isPast && (
              <div
                className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setShowTicketModal(true)}
              >
                <QrCode className="h-16 w-16 mx-auto text-primary mb-3" />
                <p className="text-sm font-medium">Your Event Ticket</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view your QR code for check-in</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Confirmation Modal */}
      <Dialog open={showConflictConfirm} onOpenChange={setShowConflictConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Schedule Conflict Detected</DialogTitle>
            <DialogDescription>You have a time conflict with another event.</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Overlapping Event</p>
              <p className="text-xs opacity-80 mt-0.5">
                You're already registered for <span className="font-medium">"{conflictEvent?.title}"</span> which overlaps with this event's timing.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Do you still want to proceed with registration?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleConflictNo}>No, Cancel</Button>
            <Button variant="hero" onClick={handleConflictYes}>Yes, Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Modal */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{isFull ? 'Join Waitlist' : 'Register for Event'}</DialogTitle>
            <DialogDescription>{isFull ? "Event is full. You'll be waitlisted." : `Registering for: ${event.title}`}</DialogDescription>
          </DialogHeader>

          {conflictEvent && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">⚠️ Proceeding despite schedule conflict</p>
                <p className="text-xs opacity-80 mt-0.5">
                  Overlaps with <span className="font-medium">"{conflictEvent.title}"</span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="20BECE001" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" min={1} max={4} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            {event.teamSize && event.teamSize > 1 && (
              <div className="space-y-2">
                <Label>Team Name (optional)</Label>
                <Input value={form.teamName} onChange={e => setForm(p => ({ ...p, teamName: e.target.value }))} placeholder="e.g. CloudNinjas" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleRegisterSubmit}>{isFull ? 'Join Waitlist' : 'Confirm Registration'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Modal with real scannable QR */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-display">Your Event Ticket</DialogTitle>
            <DialogDescription>{event.title}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white p-4 mb-4 shadow-sm border border-border">
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'bvm_ticket',
                  eventId: event.id,
                  userId: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                  ticketQR: existingReg?.ticketQR ?? `QR-${currentUser.id}-${event.id}`,
                })}
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm font-medium mb-1">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground mb-2">{currentUser.email}</p>
            <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground">
              {existingReg?.ticketQR ?? `QR-${currentUser.id.toUpperCase()}-${event.id.toUpperCase()}`}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Show this QR code at the venue for check-in</p>
          </div>
          <DialogFooter>
            <Button variant="hero" className="w-full" onClick={() => setShowTicketModal(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Add/Edit Modal */}
      <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingAnnouncement ? 'Edit Announcement' : 'Post Announcement'}</DialogTitle>
            <DialogDescription>This will be visible to all event participants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} placeholder="Write your announcement..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementForm(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleAnnouncementSubmit} disabled={!announcementMsg.trim()}>
              {editingAnnouncement ? 'Update' : 'Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Add/Edit Modal */}
      <Dialog open={showResourceForm} onOpenChange={setShowResourceForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
            <DialogDescription>Upload a file from your device or paste a link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={resourceForm.title} onChange={e => setResourceForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Workshop Slides" />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              <label className="flex items-center justify-center gap-2 w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <input type="file" className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,.jpg,.jpeg,.png,.gif,.mp4,.webm" onChange={handleFileUpload} />
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">{resourceFileName || 'Click to upload (max 5 MB)'}</span>
                </div>
              </label>
              {resourceFileName && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {resourceFileName} attached
                </p>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR paste a link</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <Label>Link / URL</Label>
              <Input
                value={resourceForm.link.startsWith('data:') ? '' : resourceForm.link}
                onChange={e => { setResourceForm(p => ({ ...p, link: e.target.value })); setResourceFileName(''); }}
                placeholder="https://..."
                disabled={!!resourceFileName}
              />
              {resourceFileName && <p className="text-xs text-muted-foreground">Clear uploaded file to enter a URL instead.</p>}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={resourceForm.type}
                onChange={e => setResourceForm(p => ({ ...p, type: e.target.value as ResourceType }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="report">Report / PDF</option>
                <option value="slides">Slides</option>
                <option value="drive">Drive Link</option>
                <option value="recording">Recording</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResourceForm(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleResourceSubmit} disabled={!resourceForm.title.trim() || !resourceForm.link.trim()}>
              {editingResource ? 'Update' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={showEditEventModal} onOpenChange={setShowEditEventModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Event</DialogTitle>
            <DialogDescription>Update event details. Changes apply immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={editEventForm.title} onChange={e => setEditEventForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editEventForm.description} onChange={e => setEditEventForm(p => ({ ...p, description: e.target.value }))} className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={editEventForm.location} onChange={e => setEditEventForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="datetime-local" value={editEventForm.startTime} onChange={e => setEditEventForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="datetime-local" value={editEventForm.endTime} onChange={e => setEditEventForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={editEventForm.capacity} onChange={e => setEditEventForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <Input type="datetime-local" value={editEventForm.registrationDeadline} onChange={e => setEditEventForm(p => ({ ...p, registrationDeadline: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={editEventForm.category} onChange={e => setEditEventForm(p => ({ ...p, category: e.target.value as EventCategory }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="hackathon">Hackathon</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="tech_talk">Tech Talk</option>
                  <option value="cultural">Cultural</option>
                  <option value="competition">Competition</option>
                  <option value="fest">Fest</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={editEventForm.status} onChange={e => setEditEventForm(p => ({ ...p, status: e.target.value as EventStatus }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="published">Published</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Team Size (0 = solo)</Label>
                <Input type="number" min={0} value={editEventForm.teamSize} onChange={e => setEditEventForm(p => ({ ...p, teamSize: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" id="allowExternal" checked={editEventForm.allowExternalParticipants} onChange={e => setEditEventForm(p => ({ ...p, allowExternalParticipants: e.target.checked }))} className="h-4 w-4 rounded border-input" />
                <Label htmlFor="allowExternal" className="text-sm cursor-pointer">Open to all colleges</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEventModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleEditEventSubmit} disabled={!editEventForm.title.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Event</DialogTitle>
            <DialogDescription>This action cannot be undone. All registrations, comments, and announcements will be permanently removed.</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm">Are you sure you want to delete <span className="font-semibold">"{event.title}"</span>?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>Yes, Delete Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
