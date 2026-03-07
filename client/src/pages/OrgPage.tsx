import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrgById, mockClubs, mockEvents, addClub, updateOrganization } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import ClubCard from '@/components/ClubCard';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Building, Users, Calendar, Award, ArrowLeft, Edit, Globe, Server, Megaphone, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function OrgPage() {
  const { id } = useParams<{ id: string }>();
  const org = getOrgById(id ?? '');
  const { currentUser } = useAuth();

  const isOrgAdmin = currentUser.role === 'super_admin' || (currentUser.role === 'org_admin' && (org?.admins.includes(currentUser.id) || currentUser.organizationId === org?.id));

  const [showEditModal, setShowEditModal] = useState(false);
  const [orgData, setOrgData] = useState({
    name: org?.name ?? '',
    description: org?.description ?? '',
    website: org?.website ?? '',
    domain: org?.domain ?? '',
    customAnnouncement: org?.customAnnouncement ?? '',
  });

  // ── Register Club state ──
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [newClubForm, setNewClubForm] = useState({ name: '', description: '' });
  const [clubsVersion, setClubsVersion] = useState(0); // force re-render after add

  if (!org) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-display mb-4">Organization not found</h2>
        <Link to="/org"><Button variant="outline">Back to Organizations</Button></Link>
      </div>
    );
  }

  const clubs = mockClubs.filter(c => c.organizationId === org.id);
  const upcomingEvents = mockEvents.filter(e => e.organizationId === org.id && (e.status === 'published' || e.status === 'ongoing'));
  const totalStudents = new Set(clubs.flatMap(c => c.members)).size;

  const handleSaveOrg = async () => {
    await updateOrganization(org.id, {
      name: orgData.name,
      description: orgData.description,
      website: orgData.website,
      domain: orgData.domain,
      customAnnouncement: orgData.customAnnouncement,
    });
    setShowEditModal(false);
    toast.success('Organization details updated!');
  };

  const handleCreateClub = async () => {
    if (!newClubForm.name.trim()) return;
    const newClub = {
      id: `club-${Date.now()}`,
      name: newClubForm.name,
      description: newClubForm.description,
      organizationId: org.id,
      admins: [currentUser.id],
      members: [currentUser.id],
      createdAt: new Date().toISOString(),
    };
    await addClub(newClub);
    setShowCreateClubModal(false);
    setNewClubForm({ name: '', description: '' });
    setClubsVersion(v => v + 1); // trigger re-render
    toast.success(`Club "${newClub.name}" created!`);
  };

  return (
    <div className="min-h-screen">
      {/* Announcement Banner */}
      {org.customAnnouncement && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center text-sm text-primary font-medium flex items-center justify-center gap-2">
          <Megaphone className="h-4 w-4 shrink-0" />
          {orgData.customAnnouncement || org.customAnnouncement}
        </div>
      )}

      <div className="gradient-hero py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/org" className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Organizations
            </Link>
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 text-primary-foreground font-bold text-xl">
                <Building className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold font-display text-primary-foreground">{org.name}</h1>
                  {org.isVerified && (
                    <Badge className="bg-success/20 text-primary-foreground border-success/40 text-xs">✓ Verified</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70 mt-1">
                  <span>{org.domain}</span>
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary-foreground transition-colors">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {org.dataHosting && (
                    <span className="flex items-center gap-1">
                      <Server className="h-3.5 w-3.5" />
                      {org.dataHosting === 'self_hosted' ? 'Self-hosted data' : org.dataHosting === 'mitra_cloud' ? 'Mitra Cloud' : 'College Server'}
                    </span>
                  )}
                </div>
              </div>
              {isOrgAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit Organization
                </Button>
              )}
            </div>
            <p className="text-primary-foreground/80 max-w-2xl">{org.description}</p>

            {/* Data Sovereignty Badge */}
            {org.dataHosting === 'self_hosted' && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs text-primary-foreground/80">
                <Server className="h-3.5 w-3.5" />
                Data hosted on college servers — full data sovereignty
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Award, label: 'Clubs', value: clubs.length },
            { icon: Calendar, label: 'Events', value: mockEvents.filter(e => e.organizationId === org.id).length },
            { icon: Users, label: 'Students', value: totalStudents },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 text-center">
              <stat.icon className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Clubs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display">Clubs</h2>
          {isOrgAdmin && (
            <Button size="sm" variant="hero" onClick={() => setShowCreateClubModal(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Register Club
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {clubs.map((club, i) => <ClubCard key={club.id} club={club} index={i} />)}
        </div>

        {/* Upcoming */}
        {upcomingEvents.length > 0 && (
          <>
            <h2 className="text-lg font-semibold font-display mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
            </div>
          </>
        )}
      </div>

      {/* Edit Organization Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Organization</DialogTitle>
            <DialogDescription>Update your college's details and announcements.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>College Name</Label>
              <Input value={orgData.name} onChange={e => setOrgData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={orgData.description} onChange={e => setOrgData(p => ({ ...p, description: e.target.value }))} className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={orgData.website} onChange={e => setOrgData(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Email Domain</Label>
                <Input value={orgData.domain} onChange={e => setOrgData(p => ({ ...p, domain: e.target.value }))} placeholder="college.edu.in" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Announcement Banner (shown to all students)</Label>
              <Input
                value={orgData.customAnnouncement}
                onChange={e => setOrgData(p => ({ ...p, customAnnouncement: e.target.value }))}
                placeholder="e.g. 🎉 TechFest 2026 registrations are now open!"
              />
              <p className="text-xs text-muted-foreground">Leave blank to hide the banner</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSaveOrg}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Club Modal */}
      <Dialog open={showCreateClubModal} onOpenChange={setShowCreateClubModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Register New Club</DialogTitle>
            <DialogDescription>Create a new club under {org.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Club Name *</Label>
              <Input value={newClubForm.name} onChange={e => setNewClubForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AI & Machine Learning Club" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newClubForm.description} onChange={e => setNewClubForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this club about?" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateClubModal(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleCreateClub} disabled={!newClubForm.name.trim()}>Create Club</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
