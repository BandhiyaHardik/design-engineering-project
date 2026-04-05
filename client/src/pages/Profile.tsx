import { useState } from 'react';
import { mockEvents, mockClubs, mockOrganizations, getRegistrationsByUser, getEventById, updateUserRole, updateUser } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import EventCard from '@/components/EventCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Calendar, Award, Users, Mail, Phone, Hash, GraduationCap,
  Building, Pencil, MapPin, Sparkles, BookOpen, Trophy, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  super_admin: 'bg-gradient-to-r from-red-500/15 to-orange-500/15 text-red-600 border border-red-200/50',
  org_admin: 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-600 border border-violet-200/50',
  club_admin: 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-600 border border-blue-200/50',
  organizer: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 border border-emerald-200/50',
  student: 'bg-gradient-to-r from-slate-500/15 to-gray-500/15 text-slate-600 border border-slate-200/50',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organization Admin',
  club_admin: 'Club Admin',
  organizer: 'Organizer',
  student: 'Student',
};

export default function Profile() {
  const { currentUser, login } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: currentUser.name,
    phone: currentUser.phone ?? '',
    rollNumber: currentUser.rollNumber ?? '',
    year: currentUser.year?.toString() ?? '',
  });

  const userClubs = mockClubs.filter(c => currentUser.clubIds.includes(c.id));
  const userOrg = mockOrganizations.find(o => o.id === currentUser.organizationId);
  const myRegistrations = getRegistrationsByUser(currentUser.id);
  const registeredEvents = myRegistrations.map(r => getEventById(r.eventId)).filter(Boolean);
  const upcomingRegistered = registeredEvents.filter(e => e && (e.status === 'published' || e.status === 'ongoing'));
  const attendedEvents = mockEvents.filter(e => e.status === 'completed' && (e.organizerId === currentUser.id || currentUser.clubIds.some(cid => e.clubId === cid)));
  const organizedEvents = mockEvents.filter(e => e.organizerId === currentUser.id);
  const memberSince = new Date(currentUser.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const stats = [
    { icon: Calendar, label: 'Registered', value: myRegistrations.length, color: 'from-blue-500 to-cyan-600' },
    { icon: Award, label: 'Clubs', value: userClubs.length, color: 'from-violet-500 to-purple-600' },
    { icon: Trophy, label: 'Organized', value: organizedEvents.length, color: 'from-orange-500 to-amber-600' },
    { icon: BookOpen, label: 'Attended', value: attendedEvents.length, color: 'from-emerald-500 to-teal-600' },
  ];

  const handleSaveProfile = async () => {
    try {
      const updates: any = {};
      if (editForm.name) updates.name = editForm.name;
      if (editForm.phone !== undefined) updates.phone = editForm.phone;
      if (editForm.rollNumber !== undefined) updates.rollNumber = editForm.rollNumber;
      if (editForm.year) updates.year = Number(editForm.year);
      const updatedUser = await updateUser(currentUser.id, updates);
      if (updatedUser) {
        login({ ...currentUser, ...updatedUser });
      }
      setShowEditModal(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="gradient-hero py-12 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground font-bold text-4xl font-display shadow-lg ring-4 ring-primary-foreground/10 shrink-0">
              {currentUser.profilePhoto ? (
                <img src={currentUser.profilePhoto} alt={currentUser.name} className="h-full w-full rounded-3xl object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold font-display text-primary-foreground">{currentUser.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[currentUser.role] ?? roleColors.student}`}>
                  {roleLabels[currentUser.role] ?? 'Student'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{currentUser.email}</span>
                {currentUser.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{currentUser.phone}</span>}
                {currentUser.rollNumber && <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{currentUser.rollNumber}</span>}
                {currentUser.year && <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Year {currentUser.year}</span>}
              </div>
              {userOrg && (
                <Link to={`/org/${userOrg.id}`} className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  <Building className="h-3.5 w-3.5" />{userOrg.name}
                </Link>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-primary-foreground/50">
                <Clock className="h-3 w-3" /> Member since {memberSince}
              </div>
            </div>

            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit Profile
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold font-display">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details + Interests */}
          <div className="space-y-6">
            {/* Interests */}
            {currentUser.interests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="font-semibold font-display flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map(interest => (
                    <span key={interest} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {interest}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* My Clubs */}
            {userClubs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="font-semibold font-display flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-primary" />
                  My Clubs
                </h3>
                <div className="space-y-2">
                  {userClubs.map(club => (
                    <Link
                      key={club.id}
                      to={`/clubs/${club.id}`}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-sm shrink-0">
                        {club.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{club.name}</p>
                        <p className="text-xs text-muted-foreground">{club.members.length} members</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Organization */}
            {userOrg && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="font-semibold font-display flex items-center gap-2 mb-3">
                  <Building className="h-4 w-4 text-primary" />
                  Organization
                </h3>
                <Link to={`/org/${userOrg.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{userOrg.name}</p>
                    <p className="text-xs text-muted-foreground">{userOrg.domain}</p>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right Column: Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Registrations */}
            {upcomingRegistered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Upcoming Registrations
                    <Badge variant="outline" className="ml-auto text-xs">{upcomingRegistered.length}</Badge>
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingRegistered.map((e, i) => e && <EventCard key={e.id} event={e} index={i} />)}
                </div>
              </motion.div>
            )}

            {/* Events Organized */}
            {organizedEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-orange-500" />
                    Events Organized
                    <Badge variant="outline" className="ml-auto text-xs">{organizedEvents.length}</Badge>
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizedEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
                </div>
              </motion.div>
            )}

            {/* Events Attended */}
            {attendedEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-500" />
                    Events Attended
                    <Badge variant="outline" className="ml-auto text-xs">{attendedEvents.length}</Badge>
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendedEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {upcomingRegistered.length === 0 && organizedEvents.length === 0 && attendedEvents.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm"
              >
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold font-display mb-1">No events yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start by browsing and registering for events!</p>
                <Link to="/events">
                  <Button variant="hero" size="sm">Browse Events</Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91..." />
              </div>
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input value={editForm.rollNumber} onChange={e => setEditForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="e.g. 21CE001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" min="1" max="6" value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
