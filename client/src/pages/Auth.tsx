import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { GraduationCap, Shield, Users, Building, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/data/api';


const KNOWN_DOMAINS = ['bvm.edu.in', 'iitb.ac.in', 'nirma.edu.in', 'ldrp.ac.in', 'ddu.ac.in', 'bvm.dev'];

const roleOptions = [
  { value: 'student', label: 'Student / Participant', icon: GraduationCap, desc: 'Discover and register for events' },
  { value: 'club_admin', label: 'Club Organizer', icon: Users, desc: 'Create and manage events for your club' },
  { value: 'org_admin', label: 'Organization Admin', icon: Building, desc: "Manage your college's clubs and events" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { loginWithCredentials, login } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regRollNo, setRegRollNo] = useState('');
  const [regYear, setRegYear] = useState('');

  const emailDomain = regEmail.includes('@') ? regEmail.split('@')[1] : '';
  const isKnownDomain = KNOWN_DOMAINS.includes(emailDomain);
  const domainRecognized = emailDomain.length > 3;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await loginWithCredentials(loginEmail, loginPassword);
    if (!user) {
      toast.error('Invalid email or password. Check the demo credentials below.');
      return;
    }
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/events');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKnownDomain && domainRecognized) {
      toast.info("Your college isn't registered yet. We'll send an invite once it's onboarded!");
      return;
    }
    try {
      const result = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        rollNumber: regRollNo || undefined,
        year: regYear || undefined,
      }) as any;
      if (result) {
        const normalized = { ...result, id: result._id || result.id };
        delete normalized._id;
        delete normalized.__v;
        login(normalized);
        toast.success(`Welcome, ${normalized.name}! Account created.`);
        navigate('/events');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Try again.');
    }
  };

  // Quick-login cards — fill credentials instantly
  const demoUsers = [
    { label: 'Super Admin', email: 'admin@bvm.dev', password: 'Admin@123', color: 'bg-destructive/10 border-destructive/20 text-destructive' },
    { label: 'Org Admin', email: 'mehta@bvm.edu.in', password: 'OrgAdmin@123', color: 'bg-primary/10 border-primary/20 text-primary' },
    { label: 'Club Admin', email: 'hardik@bvm.edu.in', password: 'Club@123', color: 'bg-accent/10 border-accent/20 text-accent' },
    { label: 'Organizer', email: 'rajorg@bvm.edu.in', password: 'Organizer@123', color: 'bg-secondary border-border text-secondary-foreground' },
    { label: 'Student', email: 'raj@bvm.edu.in', password: 'Student@123', color: 'bg-muted border-border text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-foreground">M</span>
          </div>
          <h1 className="text-2xl font-bold font-display">Welcome to BVM Campus Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Your campus event platform</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Tabs defaultValue="login">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            {/* ─── Login Tab ─── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="l-email">Email</Label>
                  <Input
                    id="l-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@college.edu"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-pass">Password</Label>
                  <div className="relative">
                    <Input
                      id="l-pass"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="hero" className="w-full">Sign In</Button>
              </form>

              {/* Demo Quick Login */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground text-center mb-3">⚡ Quick Demo Login — click to fill credentials</p>
                <div className="grid grid-cols-1 gap-2">
                  {demoUsers.map(u => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => { setLoginEmail(u.email); setLoginPassword(u.password); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all hover:opacity-80 ${u.color}`}
                    >
                      <span className="font-semibold">{u.label}</span>
                      <span className="font-mono opacity-70">{u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ─── Register Tab ─── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am joining as</Label>
                  <div className="grid gap-2">
                    {roleOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegRole(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${regRole === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 hover:border-primary/40'
                          }`}
                      >
                        <opt.icon className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium leading-none">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                        {regRole === opt.value && <Shield className="h-4 w-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-name">Full Name</Label>
                  <Input id="r-name" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">College Email</Label>
                  <Input id="r-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" required />
                  {domainRecognized && (
                    <p className={`text-xs flex items-center gap-1 ${isKnownDomain ? 'text-green-600' : 'text-orange-500'}`}>
                      {isKnownDomain
                        ? <><Shield className="h-3 w-3" /> {emailDomain} is a registered institution on BVM Campus Management</>
                        : <><AlertCircle className="h-3 w-3" /> {emailDomain} is not on BVM Campus Management — <button type="button" onClick={() => navigate('/onboard')} className="underline">Add your college</button></>
                      }
                    </p>
                  )}
                </div>
                {regRole === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="r-roll">Roll Number</Label>
                      <Input id="r-roll" value={regRollNo} onChange={e => setRegRollNo(e.target.value)} placeholder="e.g. 20BECE001" autoComplete="off" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-year">Year</Label>
                      <Select value={regYear} onValueChange={setRegYear}>
                        <SelectTrigger id="r-year"><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="r-pass">Password</Label>
                  <Input id="r-pass" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
                </div>
                <Button type="submit" variant="hero" className="w-full">Create Account</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Is your college not on BVM Campus Management?{' '}
          <button onClick={() => navigate('/onboard')} className="text-primary underline">Add it for free →</button>
        </p>
      </motion.div>
    </div>
  );
}
