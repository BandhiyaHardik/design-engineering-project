import { useState, useMemo } from 'react';
import { mockEvents, mockOrganizations } from '@/data/mockData';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Sparkles, Calendar, TrendingUp, Building, ArrowRight, Users, CheckCircle, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { EventCategory } from '@/types';
import { useNavigate } from 'react-router-dom';

const categories: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'tech_talk', label: 'Tech Talk' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'competition', label: 'Competition' },
  { value: 'fest', label: 'Fest' },
];

const sortOptions = [
  { value: 'date', label: 'By Date', icon: Calendar },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
];

const howItWorks = [
  { icon: Search, step: '01', title: 'Discover', desc: 'Browse events from all clubs at your college in one place' },
  { icon: Ticket, step: '02', title: 'Register', desc: 'One-click registration with your college email. Get a QR ticket instantly' },
  { icon: Users, step: '03', title: 'Attend', desc: 'Check in at the venue via QR scan or manual verification' },
  { icon: CheckCircle, step: '04', title: 'Archive', desc: 'Access slides, recordings, and resources after the event' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState('date');
  const [showPast, setShowPast] = useState(false);
  const navigate = useNavigate();

  const filteredEvents = useMemo(() => {
    let events = mockEvents.filter(e => e.status !== 'draft' && e.status !== 'cancelled' && e.eventType !== 'sub_event');

    if (!showPast) {
      events = events.filter(e => e.status !== 'completed');
    }

    if (selectedCategory !== 'all') {
      events = events.filter(e => e.category === selectedCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }

    if (sortBy === 'trending') {
      events = [...events].sort((a, b) => b.registeredCount - a.registeredCount);
    } else {
      events = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    return events;
  }, [search, selectedCategory, sortBy, showPast]);

  // Org announcement
  const orgAnnouncement = mockOrganizations[0]?.customAnnouncement;

  return (
    <div className="min-h-screen">
      {/* Org-level Announcement Banner */}
      {orgAnnouncement && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center text-sm text-primary font-medium">
          {orgAnnouncement}
        </div>
      )}

      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Open Source Campus Event Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display text-primary-foreground mb-4">
              Discover Campus Events
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8">
              One platform for every event at your college. Register, attend, and never miss an opportunity.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, hackathons, workshops..."
                className="pl-12 h-14 rounded-xl text-base bg-card border-none shadow-card"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Events */}
      <section className="container mx-auto px-4 -mt-6">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6 bg-card rounded-xl p-3 shadow-card border border-border">
          {categories.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'hero' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="rounded-full"
            >
              {cat.label}
            </Button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {sortOptions.map(opt => (
              <Button
                key={opt.value}
                variant={sortBy === opt.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy(opt.value)}
              >
                <opt.icon className="h-3.5 w-3.5 mr-1" />
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant={showPast ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowPast(!showPast)}
          >
            {showPast ? 'Hide Past' : 'Show Past'}
          </Button>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
