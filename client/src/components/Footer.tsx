import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>
            <span className="font-bold font-display text-foreground">BVM</span>
            <span className="text-xs text-muted-foreground">— The Operating System for College Communities</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Events</Link>
            <Link to="/org/org1" className="hover:text-foreground transition-colors">Organization</Link>
            <Link to="/onboard" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              Add Your College
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Open Source · Team Duo Ignited · BVM Engineering College · 2026
        </p>
      </div>
    </footer>
  );
}
