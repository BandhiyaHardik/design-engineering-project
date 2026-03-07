import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { mockClubs, mockEvents, addEvent } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { addNotification } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSubEvent, setIsSubEvent] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [deadline, setDeadline] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Org-level conflict detection
  const orgConflicts = useMemo(() => {
    if (!selectedClubId || !startTime || !endTime) return [];
    const club = mockClubs.find(c => c.id === selectedClubId);
    if (!club) return [];
    const orgId = club.organizationId;

    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();
    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) return [];

    return mockEvents.filter(e => {
      if (e.organizationId !== orgId) return false;
      if (e.clubId === selectedClubId) return false; // same club is OK (they know)
      const eStart = new Date(e.startTime).getTime();
      const eEnd = new Date(e.endTime).getTime();
      return newStart < eEnd && newEnd > eStart;
    });
  }, [selectedClubId, startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventTitle = title || 'New Event';
    const club = mockClubs.find(c => c.id === selectedClubId);
    const newEvent = {
      id: `e-${Date.now()}`,
      title: eventTitle,
      description: description || '',
      clubId: selectedClubId,
      organizationId: club?.organizationId ?? '',
      organizerId: currentUser.id,
      eventType: (isSubEvent ? 'sub_event' : 'main_event') as 'main_event' | 'sub_event',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      location: location || '',
      category: (category || 'other') as any,
      capacity: parseInt(capacity) || 100,
      registrationDeadline: deadline ? new Date(deadline).toISOString() : new Date(startTime).toISOString(),
      status: 'pending_approval' as const,
      gallery: [],
      resources: [],
      coOrganizers: [],
      registeredCount: 0,
      attendedCount: 0,
      coverImage: coverImage || undefined,
      createdAt: new Date().toISOString(),
    };
    await addEvent(newEvent);
    toast.success('Event created successfully! It will be reviewed by the organization admin.');

    addNotification({ icon: Calendar, text: `Event "${eventTitle}" created — pending approval` });

    if (orgConflicts.length > 0) {
      addNotification({
        icon: AlertTriangle,
        text: `⚠️ "${eventTitle}" conflicts with ${orgConflicts.map(c => `"${c.title}"`).join(', ')} from another club`,
      });
    }

    navigate('/events');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-3xl font-bold font-display mb-2">Create Event</h1>
        <p className="text-muted-foreground mb-8">Fill in the details below. Your event will be reviewed before publishing.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" placeholder="e.g., Cloud Native Hackathon 2026" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe your event..." className="min-h-[120px]" required value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select required value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="tech_talk">Tech Talk</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="fest">Fest</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hosting Club</Label>
              <Select required value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                <SelectContent>
                  {mockClubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Date & Time</Label>
              <Input id="startTime" type="datetime-local" required value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Date & Time</Label>
              <Input id="endTime" type="datetime-local" required value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Org-level conflict alert */}
          {orgConflicts.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Schedule Conflict in Your Organization</p>
                <p className="text-xs opacity-80 mt-1">
                  The following event{orgConflicts.length > 1 ? 's' : ''} from another club in your organization overlap{orgConflicts.length === 1 ? 's' : ''} with this time slot:
                </p>
                <ul className="mt-1.5 space-y-1">
                  {orgConflicts.map(c => (
                    <li key={c.id} className="text-xs font-medium">
                      • {c.title} ({new Date(c.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {new Date(c.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(c.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
                    </li>
                  ))}
                </ul>
                <p className="text-xs opacity-70 mt-2">You can still create this event, but it will be flagged for the organization admin.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Venue / Location</Label>
            <Input id="location" placeholder="e.g., Seminar Hall 1, BVM Campus" required value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Maximum Capacity</Label>
              <Input id="capacity" type="number" placeholder="e.g., 100" min={1} required value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Registration Deadline</Label>
              <Input id="deadline" type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Co-organizer Clubs (optional)</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select co-organizer club" /></SelectTrigger>
              <SelectContent>
                {mockClubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Switch id="subEvent" checked={isSubEvent} onCheckedChange={setIsSubEvent} />
            <Label htmlFor="subEvent" className="cursor-pointer">This is a sub-event of a larger fest/event</Label>
          </div>

          {isSubEvent && (
            <div className="space-y-2">
              <Label>Parent Event</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select parent event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="e3">TechFest 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image URL (optional)</Label>
            <Input id="cover" placeholder="https://..." value={coverImage} onChange={e => setCoverImage(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="hero">Create Event</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

