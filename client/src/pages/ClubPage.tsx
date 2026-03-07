import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClubById, getEventsByClub, mockUsers, updateClub, deleteClub } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Users, Calendar, ArrowLeft, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clubSnapshot, setClubSnapshot] = useState(() => getClubById(id ?? ''));
  const [isFollowing, setIsFollowing] = useState(false);

  // ── Edit / Delete state ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  // Permission: everyone except participant/student can manage clubs
  const canManageClub = (() => {
    if (!clubSnapshot) return false;
    switch (currentUser.role) {
      case 'super_admin':
        return true;
      case 'org_admin':
        return currentUser.organizationId === clubSnapshot.organizationId;
      case 'club_admin':
        return clubSnapshot.admins.includes(currentUser.id);
      case 'organizer':
        return currentUser.clubIds?.includes(clubSnapshot.id) ?? false;
      default:
        return false;
    }
  })();

  if (!clubSnapshot) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-display mb-4">Club not found</h2>
        <Link to="/clubs"><Button variant="outline">Back to Clubs</Button></Link>
      </div>
    );
  }

  const club = clubSnapshot;
  const events = getEventsByClub(club.id);
  const upcomingEvents = events.filter(e => e.status === 'published' || e.status === 'ongoing');
  const pastEvents = events.filter(e => e.status === 'completed');
  const admins = club.admins.map(aId => mockUsers.find(u => u.id === aId)).filter(Boolean);

  const openEditClub = () => {
    setEditForm({ name: club.name, description: club.description });
    setShowEditModal(true);
  };

  const handleEditClub = async () => {
    if (!editForm.name.trim()) return;
    await updateClub(club.id, { name: editForm.name, description: editForm.description });
    setClubSnapshot(getClubById(club.id) ?? club);
    setShowEditModal(false);
    toast.success('Club details updated!');
  };

  const handleDeleteClub = async () => {
    await deleteClub(club.id);
    toast.success('Club deleted.');
    navigate('/clubs');
  };

  return (
    <div className="min-h-screen">
      <div className="gradient-hero py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Clubs
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 text-primary-foreground font-bold text-2xl font-display">
                {club.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold font-display text-primary-foreground">{club.name}</h1>
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{club.members.length} members</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{events.length} events</span>
                </div>
              </div>
              {canManageClub && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={openEditClub} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="bg-destructive/20 border-destructive/30 text-primary-foreground hover:bg-destructive/30">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>
            <p className="text-primary-foreground/80 max-w-2xl mb-4">{club.description}</p>
            <Button
              variant={isFollowing ? 'outline' : 'accent'}
              size="sm"
              className={isFollowing ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20' : ''}
              onClick={() => { setIsFollowing(!isFollowing); toast.success(isFollowing ? 'Unfollowed club' : 'Following club!'); }}
            >
              {isFollowing ? 'Following' : 'Follow Club'}
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Admins */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold font-display mb-3">Club Admins</h2>
          <div className="flex flex-wrap gap-3">
            {admins.map(admin => admin && (
              <div key={admin.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {admin.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{admin.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold font-display mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold font-display mb-4">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No events from this club yet.</p>
        )}
      </div>

      {/* Edit Club Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Club</DialogTitle>
            <DialogDescription>Update club name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Club Name *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleEditClub} disabled={!editForm.name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Club Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Delete Club</DialogTitle>
            <DialogDescription>This will permanently delete the club and all its events, registrations, and comments.</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm">Are you sure you want to delete <span className="font-semibold">"{club.name}"</span>?</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteClub}>Yes, Delete Club</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
