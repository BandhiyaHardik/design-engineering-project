import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { mockEvents, mockOrganizations, mockClubs, mockUsers } from '@/data/mockData';
import {
    Sparkles, ArrowRight, Calendar, MapPin, Users, Shield, Server,
    Cloud, CheckCircle, Star, Zap, Globe, Lock, TrendingUp,
    QrCode, Bell, Search, Building, ChevronDown, Github,
    ListChecks, AlertTriangle, Ticket, BarChart3
} from 'lucide-react';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, label, suffix = '' }: { target: number; label: string; suffix?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(target / 50);
        const timer = setInterval(() => {
            start = Math.min(start + step, target);
            setCount(start);
            if (start >= target) clearInterval(timer);
        }, 30);
        return () => clearInterval(timer);
    }, [inView, target]);

    return (
        <div ref={ref} className="text-center">
            <p className="text-4xl md:text-5xl font-bold font-display text-primary-foreground">
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-sm text-primary-foreground/60 mt-1">{label}</p>
        </div>
    );
}

// ── Floating badge component ─────────────────────────────────────────────────
function FloatingCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [10, 0, 10] }}
            transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
            className={`absolute bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg p-3 ${className}`}
        >
            {children}
        </motion.div>
    );
}

const features = [
    {
        icon: Calendar,
        title: 'Smart Event Discovery',
        desc: 'Browse hackathons, workshops, tech talks, and fests from all clubs — filtered, sorted, and personalized for you.',
        color: 'bg-primary/10 text-primary',
    },
    {
        icon: Ticket,
        title: 'Instant QR Tickets',
        desc: 'Register in seconds. Get a QR ticket on the spot. Check in at the venue without any paper or delays.',
        color: 'bg-accent/10 text-accent',
    },
    {
        icon: AlertTriangle,
        title: 'Conflict Detection',
        desc: 'Mitra warns you if two events you register for overlap in time — before you commit.',
        color: 'bg-yellow-500/10 text-yellow-500',
    },
    {
        icon: ListChecks,
        title: 'Fest & Multi-Event Management',
        desc: 'One registration for a TechFest, separate registrations for its sub-events. Manage complex festivals effortlessly.',
        color: 'bg-purple-500/10 text-purple-500',
    },
    {
        icon: Shield,
        title: 'Role-Based Access',
        desc: 'Student → Organizer → Club Admin → Org Admin → Super Admin. Every person has exactly the right access.',
        color: 'bg-blue-500/10 text-blue-500',
    },
    {
        icon: Lock,
        title: 'Data Sovereignty',
        desc: "Your college data stays with you. Choose Mitra Cloud, self-hosted, or your own college servers.",
        color: 'bg-green-500/10 text-green-500',
    },
    {
        icon: BarChart3,
        title: 'Attendance Analytics',
        desc: 'QR-based check-in, attendance rates, registration trends — real-time data for every event.',
        color: 'bg-orange-500/10 text-orange-500',
    },
    {
        icon: Bell,
        title: 'Announcements & Updates',
        desc: 'Organizers post live updates. Students see them instantly on the event page.',
        color: 'bg-pink-500/10 text-pink-500',
    },
];

const steps = [
    { icon: Search, step: '01', title: 'Discover Events', desc: 'Browse your college\'s entire event calendar — hackathons, workshops, fests and more — all in one feed.' },
    { icon: Ticket, step: '02', title: 'Register in 1-Click', desc: 'Fill your details once. Get a personalized QR ticket instantly. Join waitlists if full.' },
    { icon: QrCode, step: '03', title: 'Check In at Venue', desc: 'Show your QR code at the door. Organizers scan it — or manually mark attendance.' },
    { icon: Star, step: '04', title: 'Access Resources', desc: 'Slides, recordings, GitHub links — all in one place after the event ends.' },
];

const colleges = [
    'BVM Engineering College', 'Nirma University', 'LDRP', 'DDU', 'Silver Oak', 'Parul University',
];

const testimonials = [
    {
        quote: "Mitra replaced 3 different tools we were using — Google Forms, WhatsApp groups, and Excel sheets. Now everything is in one place.",
        name: "Hardik Bandhiya",
        role: "Club Admin, AWS Cloud Club",
        college: "BVM Engineering College",
        avatar: "H",
        color: "bg-primary",
    },
    {
        quote: "The conflict detection feature saved us — students were accidentally registering for two events at the same time. Now they get warned instantly.",
        name: "Ananya Verma",
        role: "Club Admin, Design & UX Society",
        college: "BVM Engineering College",
        avatar: "A",
        color: "bg-accent",
    },
    {
        quote: "As Org Admin, I can now see every event from every club in real time. Approval takes 10 seconds, not 2 days of WhatsApp chains.",
        name: "Dr. Mehta",
        role: "Organization Admin",
        college: "BVM Engineering College",
        avatar: "M",
        color: "bg-purple-500",
    },
];

export default function Landing() {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);



    // Featured events (published, non-sub-events)
    const featuredEvents = mockEvents
        .filter(e => e.status === 'published' && e.eventType !== 'sub_event')
        .slice(0, 3);

    return (
        <div className="min-h-screen overflow-x-hidden">

            {/* ── HERO ────────────────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 gradient-hero" />
                {/* Radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,80,255,0.3),transparent)]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
                />

                {/* Floating cards */}
                <FloatingCard className="hidden md:block top-32 left-12 w-52" delay={0}>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">H</div>
                        <div>
                            <p className="text-xs font-semibold">Registered!</p>
                            <p className="text-[10px] text-muted-foreground">Cloud Native Hackathon</p>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                </FloatingCard>

                <FloatingCard className="hidden md:block top-40 right-10 w-56" delay={1}>
                    <div className="flex items-center gap-2">
                        <QrCode className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-xs font-semibold">Your QR Ticket</p>
                            <p className="text-[10px] text-muted-foreground font-mono">QR-U4-E1-2026</p>
                        </div>
                    </div>
                </FloatingCard>

                <FloatingCard className="hidden md:block bottom-48 left-16 w-60" delay={2}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        <div>
                            <p className="text-xs font-semibold text-yellow-600">Schedule Conflict!</p>
                            <p className="text-[10px] text-muted-foreground">Figma Workshop overlaps with Hackathon</p>
                        </div>
                    </div>
                </FloatingCard>

                <FloatingCard className="hidden md:block bottom-40 right-14 w-48" delay={1.5}>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">234</p>
                        <p className="text-[10px] text-muted-foreground">TechFest 2026 registrations</p>
                        <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: '47%' }} />
                        </div>
                    </div>
                </FloatingCard>

                {/* Hero content */}
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto -mt-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.05 }}
                        className="mb-2"
                    >
                        <span
                            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                            className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(120,80,255,0.3)] tracking-tight"
                        >
                            Mitra
                        </span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80 mb-3 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4" />
                            Open Source · Free for all colleges · Data stays with you
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                        className="text-2xl md:text-4xl font-bold font-display text-primary-foreground leading-tight mb-3"
                    >
                        The event platform
                        <br />
                        <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-accent bg-clip-text text-transparent">
                            built for campus.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-sm md:text-base text-primary-foreground/70 max-w-2xl mx-auto mb-6"
                    >
                        Mitra connects students with every hackathon, workshop, tech talk, and cultural event at their college.
                        One platform. Every event. Zero WhatsApp chaos.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Button
                            size="lg"
                            variant="accent"
                            className="text-base h-12 px-8 shadow-lg gap-2 group"
                            onClick={() => navigate('/auth')}
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-base h-12 px-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm gap-2"
                            onClick={() => navigate('/auth')}
                        >
                            Sign In
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/40"
                >
                    <ChevronDown className="h-6 w-6" />
                </motion.div>
            </section>

            {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
            <section className="gradient-hero border-b border-primary-foreground/10 py-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <Counter target={12} suffix="+" label="Colleges on Mitra" />
                        <Counter target={847} suffix="+" label="Events hosted" />
                        <Counter target={15200} suffix="+" label="Students registered" />
                        <Counter target={98} suffix="%" label="Organizer satisfaction" />
                    </div>
                </div>
            </section>

            {/* ── WHAT IS MITRA ───────────────────────────────────────────────────── */}
            <section className="py-20 container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <Badge variant="outline" className="mb-4 text-primary border-primary/30">What is Mitra?</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                        The Operating System for<br />College Communities
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Right now, your college's event ecosystem lives across 10 different places — Google Forms, WhatsApp groups, notice boards, Instagram stories, and Excel sheets. Mitra brings it all together. One link. Everything.
                    </p>
                </div>

                {/* Before / After */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-destructive mb-4">❌ Before Mitra</p>
                        <ul className="space-y-3">
                            {[
                                'Students miss events buried in 200-message group chats',
                                'Register on Google Forms, ticket emailed manually',
                                'No idea if registration is confirmed',
                                'Two events at same time? Find out day-of',
                                'Slides and recording? "DM me"',
                                'Organizers manually count attendance in Excel',
                            ].map(item => (
                                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                                    <span className="text-destructive mt-0.5">✕</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-success/20 bg-success/5 p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-4">✅ With Mitra</p>
                        <ul className="space-y-3">
                            {[
                                'All events in one feed. Filter by type, college, or date',
                                'Register with one click. QR ticket issued instantly',
                                'Real-time confirmation + waitlist if full',
                                'Conflict detected before you confirm registration',
                                'Slides, recording, GitHub — all in Resources tab',
                                'QR scan at venue. Attendance tracked automatically',
                            ].map(item => (
                                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
            <section className="py-20 bg-muted/30 border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-14">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">Simple by design</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold font-display">How it works</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        {steps.map((s, i) => (
                            <motion.div
                                key={s.step}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative text-center"
                            >
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border" />
                                )}
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4 ring-4 ring-primary/5">
                                    <s.icon className="h-7 w-7 text-primary" />
                                </div>
                                <p className="text-xs font-bold text-muted-foreground mb-1">{s.step}</p>
                                <h3 className="font-semibold font-display mb-2">{s.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── LIVE EVENTS PREVIEW ─────────────────────────────────────────────── */}
            <section className="py-20 container mx-auto px-4">
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4 text-primary border-primary/30">Live on Mitra</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">Events happening now</h2>
                    <p className="text-muted-foreground">A glimpse of what's live — join Mitra to see them all.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    {featuredEvents.map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all duration-300 overflow-hidden"
                        >
                            {/* Color strip */}
                            <div className={`h-2 w-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : 'bg-purple-500'}`} />
                            <div className="p-5">
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{event.category.replace('_', ' ')}</span>
                                    {event.allowExternalParticipants && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Open to all</span>}
                                    {event.category === 'fest' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">🎪 Fest</span>}
                                </div>
                                <h3 className="font-semibold font-display mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                                <div className="space-y-1.5 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(event.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {event.location}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />
                                        {event.registeredCount} / {event.capacity} registered
                                    </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${event.registeredCount >= event.capacity ? 'bg-destructive' : 'bg-primary'}`}
                                        style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center">
                    <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="gap-2">
                        <Zap className="h-4 w-4" />
                        Sign in to see all events & register
                    </Button>
                </div>
            </section>

            {/* ── FEATURES GRID ───────────────────────────────────────────────────── */}
            <section className="py-20 bg-muted/30 border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-14">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">Built for every role</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">Everything you need</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">From a first-year student discovering workshops to a college dean managing the entire annual fest.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-card transition-all duration-300"
                            >
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${f.color}`}>
                                    <f.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold font-display mb-1.5 text-sm">{f.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOR ORGANIZATIONS ───────────────────────────────────────────────── */}
            <section className="py-20 container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">For Organizations</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                            Your data.<br />Your servers.<br />Your rules.
                        </h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            Mitra is open source. We know colleges care about data privacy.
                            That's why we give you full control over where your data lives.
                        </p>
                        <div className="space-y-4">
                            {[
                                { icon: Cloud, title: 'Mitra Cloud', desc: 'We host it. Zero setup. Free forever. Best for getting started.', badge: 'Easiest' },
                                { icon: Server, title: 'Self-Hosted', desc: 'Run Mitra on your own college servers. Full data control. We help set it up.', badge: 'Most private' },
                                { icon: Building, title: 'College IT Server', desc: 'Integrate with your existing infrastructure. We coordinate with your IT team.', badge: 'Enterprise' },
                            ].map(item => (
                                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                                    <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold">{item.title}</p>
                                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground font-bold">M</div>
                                <div>
                                    <p className="font-semibold text-sm">BVM Engineering College</p>
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                        <CheckCircle className="h-3 w-3" /><span>Verified · Self-hosted</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[{ label: 'Clubs', value: '4' }, { label: 'Events', value: '8' }, { label: 'Students', value: '120+' }].map(s => (
                                    <div key={s.label} className="rounded-lg bg-muted p-3 text-center">
                                        <p className="font-bold font-display">{s.value}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                <Server className="h-3.5 w-3.5 text-green-600" />
                                Data hosted on college servers — full data sovereignty
                            </div>
                        </div>

                        {/* Announcement preview */}
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                                <Bell className="h-3.5 w-3.5" /> College Announcement
                            </p>
                            <p className="text-sm">🎉 TechFest 2026 registrations are now open! Register before April 8th.</p>
                        </div>

                        <Button variant="hero" size="lg" className="w-full gap-2" onClick={() => navigate('/onboard')}>
                            <Building className="h-5 w-5" />
                            Add Your College — Free Forever
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
            <section className="py-20 bg-muted/30 border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/30">Early adopters</Badge>
                        <h2 className="text-3xl font-bold font-display">Used by organizers who mean it</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex mb-4">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.quote}"</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.color} text-white font-bold text-sm shrink-0`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                        <p className="text-xs text-muted-foreground">{t.college}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ROLE BREAKDOWN ───────────────────────────────────────────────────── */}
            <section className="py-20 container mx-auto px-4">
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4 text-primary border-primary/30">For everyone</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold font-display">One platform, every role</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                    {[
                        { role: 'Student', icon: '🎓', color: 'border-muted-foreground/30', desc: 'Browse, register, get QR tickets, check for conflicts', bg: 'bg-muted/50' },
                        { role: 'Organizer', icon: '🎤', color: 'border-secondary', desc: 'Create events, post announcements, upload resources', bg: 'bg-secondary/50' },
                        { role: 'Club Admin', icon: '🏅', color: 'border-accent/50', desc: 'Manage your club, approve events, track registrations', bg: 'bg-accent/5' },
                        { role: 'Org Admin', icon: '🏛️', color: 'border-primary/50', desc: 'Oversee all clubs, customize org profile, set announcements', bg: 'bg-primary/5' },
                        { role: 'Super Admin', icon: '🔐', color: 'border-destructive/50', desc: 'Approve colleges, assign roles, manage the whole platform', bg: 'bg-destructive/5' },
                    ].map((r, i) => (
                        <motion.div
                            key={r.role}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className={`rounded-xl border p-5 ${r.color} ${r.bg}`}
                        >
                            <div className="text-3xl mb-3">{r.icon}</div>
                            <p className="font-semibold font-display text-sm mb-2">{r.role}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────────────────────── */}
            <section className="gradient-hero py-20">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Globe className="h-14 w-14 text-primary-foreground/40 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-5xl font-bold font-display text-primary-foreground mb-4">
                            Ready to transform<br />your campus events?
                        </h2>
                        <p className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto">
                            Join the colleges that have already moved from WhatsApp chaos to a clean, organized event platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="accent" className="h-12 px-10 text-base gap-2 group" onClick={() => navigate('/auth')}>
                                Get Started Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-10 text-base bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 gap-2" onClick={() => navigate('/onboard')}>
                                <Building className="h-4 w-4" />
                                Add Your College
                            </Button>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap text-primary-foreground/50 text-sm">
                            {['✓ Free forever', '✓ Open source on GitHub', '✓ Your data, your servers', '✓ 5 min setup'].map(item => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
            <footer className="border-t border-border bg-card py-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                                    <span className="text-sm font-bold text-primary-foreground">M</span>
                                </div>
                                <span className="font-bold font-display">Mitra</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">The OS for campus communities. Open source. Free forever.</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform</p>
                            <div className="space-y-2">
                                {[{ label: 'Browse Events', to: '/auth' }, { label: 'Sign In', to: '/auth' }, { label: 'Add College', to: '/onboard' }].map(l => (
                                    <Link key={l.to + l.label} to={l.to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">For Colleges</p>
                            <div className="space-y-2">
                                {['Onboard Your College', 'Self-Hosted Setup', 'Data Sovereignty'].map(l => (
                                    <Link key={l} to="/onboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Open Source</p>
                            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="h-4 w-4" /> GitHub →
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
                        Built with ❤️ by Team Duo Ignited · BVM Engineering College · 2026 · Open Source
                    </div>
                </div>
            </footer>
        </div>
    );
}
