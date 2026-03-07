import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  mockEvents, mockClubs, mockOrganizations, mockUsers, mockClubRequests,
  approveClubRequest, rejectClubRequest,
  updateEvent, addOrganization, addUser, updateUserRole,
} from '@/data/mockData';
import { saveCollection, loadCollection } from '@/data/storage';
import { addNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Shield, Building, Users, Calendar, CheckCircle2, Clock, Globe, Search, Activity, TrendingUp, UserCog, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Org onboard requests — seed + persistence
interface OrgRequest {
  id: string; collegeName: string; domain: string; adminName: string; adminEmail: string;
  adminPassword?: string;
  dataHosting: 'self_hosted' | 'mitra_cloud'; status: 'pending' | 'approved' | 'rejected'; submittedAt: string;
}
const _seedOrgRequests: OrgRequest[] = [
  { id: 'onb1', collegeName: 'Nirma University', domain: 'nirma.edu.in', adminName: 'Prof. Rajan', adminEmail: 'rajan@nirma.edu.in', adminPassword: 'Nirma@123', dataHosting: 'self_hosted', status: 'pending', submittedAt: '2026-03-01T00:00:00Z' },
  { id: 'onb2', collegeName: 'DDU, Nadiad', domain: 'ddu.ac.in', adminName: 'Dr. Chauhan', adminEmail: 'chauhan@ddu.ac.in', adminPassword: 'DDU@123', dataHosting: 'mitra_cloud', status: 'pending', submittedAt: '2026-03-03T00:00:00Z' },
];
let persistedOrgRequests: OrgRequest[] = loadCollection('orgRequests', _seedOrgRequests);

const roleHierarchy = ['super_admin', 'org_admin', 'club_admin', 'organizer', 'student'];
const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  club_admin: 'Club Admin',
  organizer: 'Organizer',
  student: 'Student',
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-gradient-to-r from-red-500/15 to-orange-500/15 text-red-600 border border-red-200/50',
  org_admin: 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-600 border border-violet-200/50',
  club_admin: 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-600 border border-blue-200/50',
  organizer: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 border border-emerald-200/50',
  student: 'bg-muted text-muted-foreground border border-border',
};

export default function AdminPanel() {
  const { currentUser } = useAuth();

  // ── Role-based scoping ──
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const userOrgId = currentUser?.organizationId;

  // Scope data: super_admin sees all, org_admin sees only their org
  const scopedEvents = isSuperAdmin
    ? mockEvents
    : mockEvents.filter(e => e.organizationId === userOrgId);
  const scopedUsers = isSuperAdmin
    ? mockUsers
    : mockUsers.filter(u => u.organizationId === userOrgId && u.role !== 'super_admin');
  const scopedClubs = isSuperAdmin
    ? mockClubs
    : mockClubs.filter(c => c.organizationId === userOrgId);
  const scopedOrganizations = isSuperAdmin
    ? mockOrganizations
    : mockOrganizations.filter(o => o.id === userOrgId);

  const [pendingEvents, setPendingEvents] = useState(
    scopedEvents.filter(e => e.status === 'pending_approval')
  );
  const [orgRequests, setOrgRequests] = useState<OrgRequest[]>(() => {
    // Re-read from localStorage every mount so new submissions show up
    persistedOrgRequests = loadCollection('orgRequests', _seedOrgRequests);
    return persistedOrgRequests;
  });
  const [userSearch, setUserSearch] = useState('');
  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    Object.fromEntries(scopedUsers.map(u => [u.id, u.role]))
  );
  const scopedClubRequests = isSuperAdmin
    ? mockClubRequests
    : mockClubRequests.filter(r => r.organizationId === userOrgId);
  const [clubRequests, setClubRequests] = useState(scopedClubRequests);

  const handleApprove = async (eventId: string) => {
    await updateEvent(eventId, { status: 'published' });
    setPendingEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Event approved and published!');
  };

  const handleReject = async (eventId: string) => {
    await updateEvent(eventId, { status: 'draft' });
    setPendingEvents(prev => prev.filter(e => e.id !== eventId));
    toast.info('Event rejected and returned to organizer.');
  };

  const handleOrgApprove = async (id: string) => {
    const req = orgRequests.find(r => r.id === id);
    if (!req) return;
    // Create a new Organization
    const adminUserId = `user-${Date.now()}`;
    const newOrg = {
      id: `org-${Date.now()}`,
      name: req.collegeName,
      domain: req.domain,
      description: `${req.collegeName} — onboarded via Mitra.`,
      admins: [adminUserId],
      isVerified: true,
      dataHosting: req.dataHosting,
      createdAt: new Date().toISOString(),
    };
    await addOrganization(newOrg);
    // Create the admin user for this org
    const adminUser = {
      id: adminUserId,
      name: req.adminName,
      email: req.adminEmail,
      role: 'org_admin' as const,
      organizationId: newOrg.id,
      clubIds: [],
      interests: [],
      createdAt: new Date().toISOString(),
    };
    await addUser(adminUser, req.adminEmail, req.adminPassword || 'Welcome@123');
    // Persist status change
    persistedOrgRequests = persistedOrgRequests.map(r => r.id === id ? { ...r, status: 'approved' as const } : r);
    saveCollection('orgRequests', persistedOrgRequests);
    setOrgRequests([...persistedOrgRequests]);
    toast.success(`Organization "${req.collegeName}" approved! Admin account created.`);
  };

  const handleOrgReject = (id: string) => {
    persistedOrgRequests = persistedOrgRequests.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r);
    saveCollection('orgRequests', persistedOrgRequests);
    setOrgRequests([...persistedOrgRequests]);
    toast.info('Organization request rejected.');
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    setUserRoles(prev => ({ ...prev, [userId]: newRole }));
    toast.success(`Role updated to ${roleLabels[newRole]}`);
  };

  const handleClubApprove = async (requestId: string) => {
    const req = clubRequests.find(r => r.id === requestId);
    if (!req) return;
    const orgName = mockOrganizations.find(o => o.id === req.organizationId)?.name ?? 'organization';
    await approveClubRequest(requestId);
    setClubRequests([...mockClubRequests]); // refresh from global state
    addNotification({ icon: CheckCircle2, text: `Club "${req.clubName}" approved for ${orgName}` });
    toast.success(`Club "${req.clubName}" approved and created!`);
  };

  const handleClubReject = async (requestId: string) => {
    const req = clubRequests.find(r => r.id === requestId);
    if (!req) return;
    await rejectClubRequest(requestId);
    setClubRequests([...mockClubRequests]); // refresh from global state
    addNotification({ icon: X, text: `Club request "${req.clubName}" rejected` });
    toast.info(`Club request "${req.clubName}" rejected.`);
  };

  const filteredUsers = scopedUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingClubRequests = clubRequests.filter(r => r.status === 'pending');

  // Dashboard stats (scoped)
  const stats = [
    { icon: Building, label: 'Organizations', value: scopedOrganizations.length, color: 'from-violet-500 to-purple-600', bg: 'from-violet-500/10 to-purple-500/10' },
    { icon: Users, label: 'Total Users', value: scopedUsers.length, color: 'from-blue-500 to-cyan-600', bg: 'from-blue-500/10 to-cyan-500/10' },
    { icon: Calendar, label: 'Total Events', value: scopedEvents.length, color: 'from-orange-500 to-amber-600', bg: 'from-orange-500/10 to-amber-500/10' },
    { icon: Shield, label: 'Active Clubs', value: scopedClubs.length, color: 'from-emerald-500 to-teal-600', bg: 'from-emerald-500/10 to-teal-500/10' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="gradient-hero py-10">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-display text-primary-foreground">Admin Panel</h1>
                <p className="text-primary-foreground/70 text-sm">Platform management & administration</p>
              </div>
            </div>

            {/* Role Hierarchy Breadcrumb */}
            <div className="mt-6 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-primary-foreground/50 uppercase tracking-wider mr-2 font-medium">Role Hierarchy</span>
              {['Super Admin', 'Org Admin', 'Club Admin', 'Organizer', 'Student'].map((role, i, arr) => (
                <div key={role} className="flex items-center gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${i === 0 ? 'bg-red-500/20 text-red-200 ring-1 ring-red-400/30' :
                    i === 1 ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30' :
                      i === 2 ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30' :
                        i === 3 ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30' :
                          'bg-primary-foreground/10 text-primary-foreground/70 ring-1 ring-primary-foreground/20'
                    }`}>{role}</span>
                  {i < arr.length - 1 && <span className="text-primary-foreground/30 text-xs">→</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
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
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-50`} />
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

        {/* Main Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="approvals" className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-1.5 shadow-sm inline-flex">
              <TabsList className="bg-transparent gap-1">
                <TabsTrigger value="approvals" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 gap-1.5">
                  <Clock className="h-4 w-4" />
                  Approvals
                  {pendingEvents.length > 0 && (
                    <Badge className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">{pendingEvents.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="orgs" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 gap-1.5">
                  <Building className="h-4 w-4" />
                  {isSuperAdmin ? 'Organizations' : 'My Organization'}
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 gap-1.5">
                  <UserCog className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="clubs" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 gap-1.5">
                  <Shield className="h-4 w-4" />
                  Clubs
                  {pendingClubRequests.length > 0 && (
                    <Badge className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">{pendingClubRequests.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── Event Approvals ── */}
            <TabsContent value="approvals">
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Pending Event Approvals
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Review and approve or reject event submissions</p>
                </div>
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-3">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm mt-1">No events pending review</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold font-display truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px] capitalize">{event.category.replace('_', ' ')}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">Capacity: {event.capacity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleApprove(event.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm gap-1 rounded-lg">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReject(event.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 rounded-lg">
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Organizations Tab ── */}
            <TabsContent value="orgs" className="space-y-6">
              {/* Verified Organizations */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    Verified Organizations
                    <Badge variant="outline" className="ml-auto text-xs">{scopedOrganizations.length}</Badge>
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {scopedOrganizations.map(org => (
                    <div key={org.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm shadow-sm">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{org.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{org.domain}</span>
                            {org.dataHosting && (
                              <Badge variant="outline" className="text-[10px] gap-0.5">
                                <Globe className="h-2.5 w-2.5" />
                                {org.dataHosting === 'self_hosted' ? 'Self-hosted' : org.dataHosting === 'mitra_cloud' ? 'Mitra Cloud' : 'College Server'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Onboard Requests (Super Admin only) */}
              {isSuperAdmin && (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <h3 className="font-semibold font-display flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Pending Onboard Requests
                      <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-200/50 text-xs">{orgRequests.filter(r => r.status === 'pending').length} pending</Badge>
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {orgRequests.map(req => (
                      <div
                        key={req.id}
                        className={`px-6 py-4 transition-colors ${req.status === 'approved' ? 'bg-emerald-500/5' :
                          req.status === 'rejected' ? 'bg-destructive/5 opacity-60' :
                            'hover:bg-muted/20'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                              req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                              <Building className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{req.collegeName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{req.domain} · Admin: {req.adminName} ({req.adminEmail})</p>
                              {req.adminPassword && (
                                <p className="text-xs text-muted-foreground mt-0.5">🔑 Admin password set</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {req.dataHosting === 'self_hosted' ? '🖥️ Self-hosted' : '☁️ Mitra Cloud'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  Submitted {new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {req.status !== 'pending' && (
                                  <Badge className={`text-[10px] capitalize ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                    {req.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" onClick={() => handleOrgApprove(req.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm gap-1 rounded-lg">
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOrgReject(req.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 rounded-lg">
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Users Tab ── */}
            <TabsContent value="users">
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold font-display flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-primary" />
                      User Management
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Assign roles and manage user permissions</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="pl-9 w-64 h-9 rounded-lg"
                    />
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {filteredUsers.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-6 py-3.5 gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold shadow-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${roleColors[userRoles[user.id]] ?? roleColors.student}`}>
                          {roleLabels[userRoles[user.id]] ?? 'Student'}
                        </span>
                        <Select
                          value={userRoles[user.id]}
                          onValueChange={(val) => handleRoleChange(user.id, val)}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleHierarchy.filter(role => isSuperAdmin || role !== 'super_admin').map(role => (
                              <SelectItem key={role} value={role} className="text-xs">
                                {roleLabels[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No users matching "{userSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Clubs Tab ── */}
            <TabsContent value="clubs" className="space-y-6">
              {/* Pending Club Requests */}
              {pendingClubRequests.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-card shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-primary/10 bg-primary/5">
                    <h3 className="font-semibold font-display flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      Pending Club Requests
                      <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs">{pendingClubRequests.length} pending</Badge>
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {clubRequests.map(req => (
                      <div
                        key={req.id}
                        className={`px-6 py-4 transition-colors ${req.status === 'approved' ? 'bg-emerald-500/5' :
                          req.status === 'rejected' ? 'bg-destructive/5 opacity-60' :
                            'hover:bg-muted/20'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 font-bold text-sm ${req.status === 'pending' ? 'bg-primary/10 text-primary' :
                              req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                              {req.clubName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold font-display">{req.clubName}</p>
                                {req.status !== 'pending' && (
                                  <Badge className={`text-[10px] capitalize ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                    {req.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                <span>By: {req.requestedByName}</span>
                                <span>·</span>
                                <span>Org: {mockOrganizations.find(o => o.id === req.organizationId)?.name ?? 'Unknown'}</span>
                                <span>·</span>
                                <span>{new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" onClick={() => handleClubApprove(req.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm gap-1 rounded-lg">
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleClubReject(req.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 rounded-lg">
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Clubs */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold font-display flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Active Clubs
                    <Badge variant="outline" className="ml-auto text-xs">{scopedClubs.length}</Badge>
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {scopedClubs.map((club, i) => (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-sm">
                          {club.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{club.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {club.members.length} members</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {mockEvents.filter(e => e.clubId === club.id).length} events</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50">Active</Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
