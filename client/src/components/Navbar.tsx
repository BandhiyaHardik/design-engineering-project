import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, Plus, User, LogOut, LayoutDashboard, Shield, Calendar, Users, CheckCircle, Megaphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, seedNotifications } from '@/hooks/useNotifications';

const navLinks = [
  { label: 'Events', to: '/events' },
  { label: 'Clubs', to: '/clubs' },
  { label: 'Organizations', to: '/org' },
];

const roleLabelMap: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-destructive text-destructive-foreground' },
  org_admin: { label: 'Org Admin', color: 'bg-primary text-primary-foreground' },
  club_admin: { label: 'Club Admin', color: 'bg-accent text-accent-foreground' },
  organizer: { label: 'Organizer', color: 'bg-secondary text-secondary-foreground' },
  student: { label: 'Student', color: 'bg-muted text-muted-foreground' },
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout } = useAuth();

  // Seed initial notifications on first render when logged in
  if (isLoggedIn && currentUser) seedNotifications(currentUser.role);

  const { notifications, unreadCount, markAllRead } = useNotifications();

  const roleInfo = roleLabelMap[currentUser?.role ?? 'student'] ?? roleLabelMap.student;
  const isOrgAdmin = currentUser?.role === 'org_admin' || currentUser?.role === 'super_admin';
  const canOrganize = ['org_admin', 'super_admin', 'club_admin', 'organizer'].includes(currentUser?.role ?? '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-xl font-bold font-display text-foreground">Mitra</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold font-display">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!n.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <n.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">{n.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {canOrganize && (
                <Button variant="hero" size="sm" className="hidden md:flex gap-1" onClick={() => navigate('/events/create')}>
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {currentUser?.name?.charAt(0) ?? '?'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit ${roleInfo.color}`}>
                        <Shield className="h-3 w-3" />
                        {roleInfo.label}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {canOrganize && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                  )}
                  {isOrgAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4 text-primary" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          {isLoggedIn && (
            <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {currentUser?.name?.charAt(0) ?? '?'}
              </div>
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          )}
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {canOrganize && (
            <Button variant="hero" size="sm" className="w-full mt-2" onClick={() => { navigate('/events/create'); setMobileOpen(false); }}>
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Button>
          )}
          {isOrgAdmin && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => { navigate('/admin'); setMobileOpen(false); }}>
              <Shield className="h-4 w-4 mr-1" /> Admin Panel
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

