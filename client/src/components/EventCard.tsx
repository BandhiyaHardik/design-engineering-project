import { Link } from 'react-router-dom';
import { Event } from '@/types';
import { getClubName } from '@/data/mockData';
import { Calendar, MapPin, Users, Code2, Wrench, BookOpen, Mic2, Music2, Trophy, PartyPopper, Shapes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const categoryColors: Record<string, string> = {
  hackathon: 'bg-primary/10 text-primary',
  workshop: 'bg-success/10 text-success',
  seminar: 'bg-accent/10 text-accent',
  tech_talk: 'bg-primary/10 text-primary',
  cultural: 'bg-destructive/10 text-destructive',
  competition: 'bg-warning/10 text-warning',
  fest: 'bg-accent/10 text-accent',
  other: 'bg-muted text-muted-foreground',
};

const categoryGradients: Record<string, string> = {
  hackathon: 'from-blue-600 via-indigo-600 to-violet-700',
  workshop: 'from-emerald-500 via-teal-500 to-cyan-600',
  seminar: 'from-amber-500 via-orange-500 to-red-500',
  tech_talk: 'from-cyan-500 via-blue-500 to-indigo-600',
  cultural: 'from-pink-500 via-rose-500 to-red-500',
  competition: 'from-yellow-500 via-amber-500 to-orange-600',
  fest: 'from-purple-500 via-fuchsia-500 to-pink-500',
  other: 'from-slate-500 via-gray-500 to-zinc-600',
};

const categoryIcons: Record<string, typeof Code2> = {
  hackathon: Code2,
  workshop: Wrench,
  seminar: BookOpen,
  tech_talk: Mic2,
  cultural: Music2,
  competition: Trophy,
  fest: PartyPopper,
  other: Shapes,
};

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: 'Open', className: 'bg-success/10 text-success' },
  ongoing: { label: 'Live', className: 'bg-destructive/10 text-destructive' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
};

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const isFull = event.registeredCount >= event.capacity;
  const fillPercent = Math.min((event.registeredCount / event.capacity) * 100, 100);

  // Time-based status
  const now = new Date();
  const isPast = event.status === 'completed' || new Date(event.endTime) < now;
  const isOngoing = !isPast && new Date(event.startTime) <= now && new Date(event.endTime) >= now;
  const isDeadlinePassed = new Date(event.registrationDeadline) < now;

  // Determine display status
  const displayStatus = isPast
    ? { label: 'Closed', className: 'bg-destructive/10 text-destructive' }
    : isOngoing
      ? { label: 'Live', className: 'bg-destructive/10 text-destructive animate-pulse' }
      : isDeadlinePassed
        ? { label: 'Reg. Closed', className: 'bg-amber-500/10 text-amber-600' }
        : statusLabels[event.status] ?? statusLabels.draft;

  const CategoryIcon = categoryIcons[event.category] ?? Shapes;
  const gradient = categoryGradients[event.category] ?? categoryGradients.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/events/${event.id}`} className="block group">
        <div className={`rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-card-hover hover:border-primary/20 gradient-card ${isPast ? 'opacity-75' : ''}`}>

          {/* Cover image / gradient fallback */}
          <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradient}`}>
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <CategoryIcon className="h-16 w-16 text-white/15" />
              </div>
            )}
            {/* Overlaid badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm capitalize">
                {event.category.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm ${displayStatus.label === 'Live'
                  ? 'bg-red-500/90 text-white animate-pulse'
                  : displayStatus.label === 'Closed'
                    ? 'bg-gray-800/70 text-white'
                    : displayStatus.label === 'Open'
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-black/40 text-white'
                }`}>
                {displayStatus.label}
              </span>
            </div>
            {event.coOrganizers.length > 0 && (
              <Badge variant="outline" className="absolute top-3 right-3 text-[10px] bg-black/40 text-white border-white/20 backdrop-blur-sm">Collab</Badge>
            )}
          </div>

          {/* Card body */}
          <div className="p-5">
            <h3 className="text-lg font-semibold font-display text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
              {event.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>·</span>
                <span>{new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{getClubName(event.clubId)}</span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{event.registeredCount} / {event.capacity} registered</span>
                {isFull && <span className="text-destructive font-medium">Full</span>}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
