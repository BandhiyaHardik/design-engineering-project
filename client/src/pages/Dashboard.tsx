import { useMemo } from 'react';
import {
  mockEvents, mockClubs, mockOrganizations, mockUsers,
  getClubName, getRegistrationsByUser, getEventById,
} from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, CheckCircle, Clock, Eye, BarChart3, Ticket, MapPin,
  Building, Award, TrendingUp, UserCheck, AlertCircle, Activity, PieChart as PieIcon,
  Layers, Shield, GraduationCap, Sparkles, Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

/* ---------- colour palette ---------- */
const CHART_COLORS = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  published: '#3b82f6', ongoing: '#10b981', completed: '#6b7280',
  pending_approval: '#f59e0b', draft: '#94a3b8', cancelled: '#ef4444',
};
const CATEGORY_COLORS: Record<string, string> = {
  hackathon: '#7c3aed', workshop: '#3b82f6', seminar: '#06b6d4', tech_talk: '#10b981',
  cultural: '#ec4899', competition: '#f59e0b', fest: '#ef4444', other: '#6b7280',
};

/* ---------- tiny helper ---------- */
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

/* ================================================================== */
/* CARD wrapper                                                       */
/* ================================================================== */
function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold font-display">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold font-display text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* Custom tooltip */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card border border-border shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

/* ================================================================== */
/* SUPER ADMIN DASHBOARD                                              */
/* ================================================================== */
function SuperAdminDashboard() {
  const totalUsers = mockUsers.length;
  const totalOrgs = mockOrganizations.length;
  const totalClubs = mockClubs.length;
  const totalEvents = mockEvents.length;
  const totalRegs = mockEvents.reduce((s, e) => s + e.registeredCount, 0);
  const totalAttended = mockEvents.reduce((s, e) => s + e.attendedCount, 0);
  const verifiedOrgs = mockOrganizations.filter(o => o.isVerified).length;

  /* Role distribution */
  const roleDist = useMemo(() => {
    const counts: Record<string, number> = {};
    mockUsers.forEach(u => { counts[u.role] = (counts[u.role] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, []);

  /* Event status distribution */
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    mockEvents.forEach(e => { counts[e.status] = (counts[e.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: STATUS_COLORS[name] ?? '#6b7280' }));
  }, []);

  /* Events by category */
  const catDist = useMemo(() => {
    const counts: Record<string, number> = {};
    mockEvents.forEach(e => { counts[e.category] = (counts[e.category] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: CATEGORY_COLORS[name] ?? '#6b7280' }));
  }, []);

  /* Registrations per org */
  const orgRegs = useMemo(() => {
    return mockOrganizations.map(org => {
      const orgEvents = mockEvents.filter(e => e.organizationId === org.id);
      return {
        name: org.name.length > 18 ? org.name.slice(0, 18) + '…' : org.name,
        Registrations: orgEvents.reduce((s, e) => s + e.registeredCount, 0),
        Attended: orgEvents.reduce((s, e) => s + e.attendedCount, 0),
        Events: orgEvents.length,
      };
    });
  }, []);

  /* Monthly trend (group by month from startTime) */
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { events: number; regs: number }> = {};
    mockEvents.forEach(e => {
      const m = new Date(e.startTime).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { events: 0, regs: 0 };
      months[m].events++;
      months[m].regs += e.registeredCount;
    });
    return Object.entries(months).map(([month, d]) => ({ month, Events: d.events, Registrations: d.regs }));
  }, []);

  /* Top clubs by members */
  const topClubs = useMemo(() =>
    [...mockClubs].sort((a, b) => b.members.length - a.members.length).slice(0, 6).map(c => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name,
      Members: c.members.length,
      Events: mockEvents.filter(e => e.clubId === c.id).length,
    })),
    []);

  return (
    <>
      {/* Hero */}
      <div className="gradient-hero py-10 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-primary-foreground">Platform Dashboard</h1>
                <p className="text-sm text-primary-foreground/60">Global analytics across all organizations</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Building} label="Organizations" value={totalOrgs} color="from-violet-500 to-purple-600" sub={`${verifiedOrgs} verified`} />
          <StatCard icon={Users} label="Total Users" value={totalUsers} color="from-blue-500 to-cyan-600" />
          <StatCard icon={Layers} label="Total Clubs" value={totalClubs} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Calendar} label="Total Events" value={totalEvents} color="from-orange-500 to-amber-600" />
          <StatCard icon={Ticket} label="Registrations" value={totalRegs} color="from-pink-500 to-rose-600" />
          <StatCard icon={UserCheck} label="Attended" value={totalAttended} color="from-green-500 to-emerald-600" sub={`${pct(totalAttended, totalRegs)}% rate`} />
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Monthly Event Trend" icon={TrendingUp} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorEvts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Events" stroke="#7c3aed" fill="url(#colorEvts)" strokeWidth={2} />
                <Area type="monotone" dataKey="Registrations" stroke="#3b82f6" fill="url(#colorRegs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="User Roles" icon={Users}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roleDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {roleDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Events by Status" icon={Activity}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]}>
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Events by Category" icon={PieIcon}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catDist} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {catDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Top Clubs" icon={Award}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topClubs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Members" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Organization Performance" icon={Building}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orgRegs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Registrations" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Attended" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Events List */}
        <ChartCard title="Recent Events" icon={Calendar} className="mb-8">
          <div className="space-y-2">
            {[...mockEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8).map(event => (
              <Link key={event.id} to={`/events/${event.id}`}
                className="flex items-center justify-between gap-4 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{getClubName(event.clubId)} · {new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="text-xs" style={{ backgroundColor: `${STATUS_COLORS[event.status]}20`, color: STATUS_COLORS[event.status] }}>
                    {event.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{event.registeredCount}/{event.capacity}</span>
                </div>
              </Link>
            ))}
          </div>
        </ChartCard>
      </div>
    </>
  );
}

/* ================================================================== */
/* ORG ADMIN DASHBOARD                                                */
/* ================================================================== */
function OrgAdminDashboard() {
  const { currentUser } = useAuth();
  const org = mockOrganizations.find(o => o.id === currentUser.organizationId);
  const orgClubs = mockClubs.filter(c => c.organizationId === currentUser.organizationId);
  const orgEvents = mockEvents.filter(e => e.organizationId === currentUser.organizationId);
  const totalRegs = orgEvents.reduce((s, e) => s + e.registeredCount, 0);
  const totalAttended = orgEvents.reduce((s, e) => s + e.attendedCount, 0);
  const totalMembers = new Set(orgClubs.flatMap(c => c.members)).size;
  const publishedEvents = orgEvents.filter(e => e.status === 'published' || e.status === 'ongoing').length;
  const pendingEvents = orgEvents.filter(e => e.status === 'pending_approval').length;

  /* Club performance */
  const clubPerf = useMemo(() =>
    orgClubs.map(c => {
      const cEvents = orgEvents.filter(e => e.clubId === c.id);
      return {
        name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
        Members: c.members.length,
        Events: cEvents.length,
        Registrations: cEvents.reduce((s, e) => s + e.registeredCount, 0),
      };
    }),
    []);

  /* Event categories */
  const catDist = useMemo(() => {
    const counts: Record<string, number> = {};
    orgEvents.forEach(e => { counts[e.category] = (counts[e.category] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: CATEGORY_COLORS[name] ?? '#6b7280' }));
  }, []);

  /* Monthly trend */
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { events: number; regs: number }> = {};
    orgEvents.forEach(e => {
      const m = new Date(e.startTime).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { events: 0, regs: 0 };
      months[m].events++;
      months[m].regs += e.registeredCount;
    });
    return Object.entries(months).map(([month, d]) => ({ month, Events: d.events, Registrations: d.regs }));
  }, []);

  /* Registration fill-rate per event */
  const fillRate = useMemo(() =>
    orgEvents
      .filter(e => e.capacity > 0)
      .sort((a, b) => b.registeredCount / b.capacity - a.registeredCount / a.capacity)
      .slice(0, 8)
      .map(e => ({
        name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
        'Fill %': pct(e.registeredCount, e.capacity),
        Registered: e.registeredCount,
        Capacity: e.capacity,
      })),
    []);

  return (
    <>
      <div className="gradient-hero py-10 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-primary-foreground">{org?.name ?? 'Organization'} Dashboard</h1>
                <p className="text-sm text-primary-foreground/60">Clubs, events & analytics for your organization</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Layers} label="Clubs" value={orgClubs.length} color="from-violet-500 to-purple-600" />
          <StatCard icon={Calendar} label="Events" value={orgEvents.length} color="from-blue-500 to-cyan-600" sub={`${publishedEvents} active`} />
          <StatCard icon={GraduationCap} label="Students" value={totalMembers} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Ticket} label="Registrations" value={totalRegs} color="from-orange-500 to-amber-600" />
          <StatCard icon={UserCheck} label="Attended" value={totalAttended} color="from-pink-500 to-rose-600" sub={`${pct(totalAttended, totalRegs)}% rate`} />
          <StatCard icon={Clock} label="Pending" value={pendingEvents} color="from-yellow-500 to-amber-600" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Monthly Trend" icon={TrendingUp} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="oEvts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                  <linearGradient id="oRegs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Events" stroke="#7c3aed" fill="url(#oEvts)" strokeWidth={2} />
                <Area type="monotone" dataKey="Registrations" stroke="#3b82f6" fill="url(#oRegs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Categories" icon={PieIcon}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {catDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Club Performance" icon={Award}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clubPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Members" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Fill Rate" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fillRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Fill %" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Club list */}
        <ChartCard title="Your Clubs" icon={Layers} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orgClubs.map(club => {
              const cEvents = orgEvents.filter(e => e.clubId === club.id);
              return (
                <Link key={club.id} to={`/clubs/${club.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-sm shrink-0">
                    {club.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{club.name}</p>
                    <p className="text-xs text-muted-foreground">{club.members.length} members · {cEvents.length} events</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{cEvents.reduce((s, e) => s + e.registeredCount, 0)} regs</Badge>
                </Link>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </>
  );
}

/* ================================================================== */
/* CLUB ADMIN / ORGANIZER DASHBOARD                                   */
/* ================================================================== */
function ClubAdminDashboard() {
  const { currentUser } = useAuth();
  const myClubs = mockClubs.filter(c => currentUser.clubIds.includes(c.id));
  const clubIds = new Set(currentUser.clubIds);
  const clubEvents = mockEvents.filter(e => clubIds.has(e.clubId) || e.organizerId === currentUser.id);
  const totalRegs = clubEvents.reduce((s, e) => s + e.registeredCount, 0);
  const totalAttended = clubEvents.reduce((s, e) => s + e.attendedCount, 0);
  const publishedEvents = clubEvents.filter(e => e.status === 'published' || e.status === 'ongoing');
  const completedEvents = clubEvents.filter(e => e.status === 'completed');
  const pendingEvents = clubEvents.filter(e => e.status === 'pending_approval');
  const totalMembers = new Set(myClubs.flatMap(c => c.members)).size;

  /* Category distribution */
  const catDist = useMemo(() => {
    const counts: Record<string, number> = {};
    clubEvents.forEach(e => { counts[e.category] = (counts[e.category] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: CATEGORY_COLORS[name] ?? '#6b7280' }));
  }, []);

  /* Registration vs Attendance per event */
  const eventPerf = useMemo(() =>
    clubEvents.filter(e => e.registeredCount > 0).slice(0, 8).map(e => ({
      name: e.title.length > 16 ? e.title.slice(0, 16) + '…' : e.title,
      Registered: e.registeredCount,
      Attended: e.attendedCount,
      Capacity: e.capacity,
    })),
    []);

  /* Fill rate */
  const fillRate = useMemo(() =>
    clubEvents.filter(e => e.capacity > 0).map(e => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
      'Fill %': pct(e.registeredCount, e.capacity),
    })).sort((a, b) => b['Fill %'] - a['Fill %']).slice(0, 6),
    []);

  /* Monthly trend */
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { events: number; regs: number }> = {};
    clubEvents.forEach(e => {
      const m = new Date(e.startTime).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { events: 0, regs: 0 };
      months[m].events++;
      months[m].regs += e.registeredCount;
    });
    return Object.entries(months).map(([month, d]) => ({ month, Events: d.events, Registrations: d.regs }));
  }, []);

  return (
    <>
      <div className="gradient-hero py-10 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                <Award className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-primary-foreground">Club Dashboard</h1>
                <p className="text-sm text-primary-foreground/60">Events, participants & analytics for your clubs</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Layers} label="My Clubs" value={myClubs.length} color="from-violet-500 to-purple-600" />
          <StatCard icon={Calendar} label="Total Events" value={clubEvents.length} color="from-blue-500 to-cyan-600" />
          <StatCard icon={GraduationCap} label="Members" value={totalMembers} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Ticket} label="Registrations" value={totalRegs} color="from-orange-500 to-amber-600" />
          <StatCard icon={UserCheck} label="Attended" value={totalAttended} color="from-pink-500 to-rose-600" sub={`${pct(totalAttended, totalRegs)}% rate`} />
          <StatCard icon={Clock} label="Pending" value={pendingEvents.length} color="from-yellow-500 to-amber-600" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Monthly Trend" icon={TrendingUp} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="cEvts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                  <linearGradient id="cRegs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Events" stroke="#7c3aed" fill="url(#cEvts)" strokeWidth={2} />
                <Area type="monotone" dataKey="Registrations" stroke="#3b82f6" fill="url(#cRegs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Categories" icon={PieIcon}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {catDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Registration vs Attendance" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={eventPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Registered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Attended" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Fill Rate" icon={Activity}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fillRate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Fill %" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Event list by status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Active Events', events: publishedEvents, icon: CheckCircle, color: 'text-green-500' },
            { title: 'Pending Approval', events: pendingEvents, icon: Clock, color: 'text-amber-500' },
            { title: 'Completed', events: completedEvents, icon: Calendar, color: 'text-gray-400' },
          ].map(section => (
            <ChartCard key={section.title} title={section.title} icon={section.icon}>
              {section.events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events</p>
              ) : (
                <div className="space-y-2">
                  {section.events.map(event => (
                    <Link key={event.id} to={`/events/${event.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {event.registeredCount}/{event.capacity}</p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </ChartCard>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/* PARTICIPANT DASHBOARD (fallback)                                    */
/* ================================================================== */
function ParticipantDashboard() {
  const { currentUser } = useAuth();
  const myRegistrations = getRegistrationsByUser(currentUser.id);
  const registeredEvents = myRegistrations.map(r => ({ reg: r, event: getEventById(r.eventId) })).filter(x => x.event);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-display mb-2">My Dashboard</h1>
        <p className="text-muted-foreground mb-8">View your registered events and tickets.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Ticket} label="Registered" value={myRegistrations.length} color="from-blue-500 to-cyan-600" />
          <StatCard icon={Calendar} label="Upcoming" value={registeredEvents.filter(x => x.event && (x.event.status === 'published' || x.event.status === 'ongoing')).length} color="from-violet-500 to-purple-600" />
          <StatCard icon={CheckCircle} label="Attended" value={0} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Clock} label="Waitlisted" value={myRegistrations.filter(r => r.status === 'waitlisted').length} color="from-orange-500 to-amber-600" />
        </div>

        <ChartCard title="My Registered Events" icon={Calendar}>
          {registeredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No registrations yet. <Link to="/events" className="text-primary underline">Browse events →</Link></p>
            </div>
          ) : (
            <div className="space-y-2">
              {registeredEvents.map(({ reg, event }) => event && (
                <Link key={reg.id} to={`/events/${event.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{event.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reg.status === 'waitlisted' && <Badge variant="outline" className="text-warning border-warning text-xs">Waitlisted</Badge>}
                    {reg.status === 'registered' && <Badge className="bg-success/10 text-success text-xs">Registered</Badge>}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ChartCard>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/* MAIN EXPORT — routes to the right sub-dashboard                    */
/* ================================================================== */
export default function Dashboard() {
  const { currentUser } = useAuth();

  if (currentUser.role === 'super_admin') return <SuperAdminDashboard />;
  if (currentUser.role === 'org_admin') return <OrgAdminDashboard />;
  if (currentUser.role === 'club_admin' || currentUser.role === 'organizer') return <ClubAdminDashboard />;
  return <ParticipantDashboard />;
}
