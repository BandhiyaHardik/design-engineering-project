import { Link } from 'react-router-dom';
import { Club } from '@/types';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClubCardProps {
  club: Club;
  index?: number;
}

export default function ClubCard({ club, index = 0 }: ClubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/clubs/${club.id}`} className="block group">
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-card-hover hover:border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-bold text-lg">
              {club.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                {club.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{club.members.length} members</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
