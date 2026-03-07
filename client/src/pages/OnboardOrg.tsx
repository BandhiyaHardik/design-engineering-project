import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building, Server, Cloud, HardDrive, Check, ArrowRight, ArrowLeft, Sparkles, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { loadCollection, saveCollection } from '@/data/storage';

const hostingOptions = [
    {
        value: 'mitra_cloud',
        icon: Cloud,
        title: 'Mitra Cloud',
        desc: 'We host your data on our secure servers. Easiest setup, zero maintenance.',
        badge: 'Recommended for new orgs',
    },
    {
        value: 'self_hosted',
        icon: Server,
        title: 'Self-Hosted',
        desc: 'Deploy Mitra on your college servers. Full data control and sovereignty.',
        badge: 'Best for data privacy',
    },
    {
        value: 'college_server',
        icon: HardDrive,
        title: 'College IT Server',
        desc: 'Use your existing college IT infrastructure. We help set it up.',
        badge: 'Needs IT coordination',
    },
];

const steps = ['College Info', 'Admin Contact', 'Data Hosting', 'Review'];

export default function OnboardOrg() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        collegeName: '',
        domain: '',
        website: '',
        description: '',
        studentCount: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        adminPassword: '',
        designation: '',
        dataHosting: 'mitra_cloud',
    });

    const handleNext = () => {
        if (step < steps.length - 1) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleSubmit = () => {
        // Persist the org request so the Super Admin can see it
        const newRequest = {
            id: `onb-${Date.now()}`,
            collegeName: form.collegeName,
            domain: form.domain,
            adminName: form.adminName,
            adminEmail: form.adminEmail,
            adminPassword: form.adminPassword,
            dataHosting: form.dataHosting,
            status: 'pending',
            submittedAt: new Date().toISOString(),
        };
        const existing = loadCollection('orgRequests', []);
        saveCollection('orgRequests', [...existing, newRequest]);
        setSubmitted(true);
        toast.success('Request submitted! The Super Admin will review and approve it.');
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mx-auto mb-6">
                        <Check className="h-10 w-10 text-success" />
                    </div>
                    <h1 className="text-3xl font-bold font-display mb-3">You're on the list!</h1>
                    <p className="text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{form.collegeName}</span> has been submitted for review.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">
                        Our team will contact <span className="font-medium">{form.adminEmail}</span> within 24 hours to complete onboarding.
                    </p>
                    <div className="rounded-xl border border-border bg-card p-5 text-left mb-6 space-y-2">
                        <p className="text-sm font-semibold">What happens next?</p>
                        {[
                            "Our team verifies your college and domain",
                            "Admin credentials are set up for " + form.adminEmail,
                            "You can invite staff and create clubs",
                            "Students sign up with @" + (form.domain || 'college.edu.in'),
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                                {s}
                            </div>
                        ))}
                    </div>
                    <Button variant="hero" onClick={() => navigate('/')}>Back to Mitra</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
                            <Sparkles className="h-4 w-4" />
                            Free for all colleges
                        </div>
                        <h1 className="text-4xl font-bold font-display mb-3">Add Your College to Mitra</h1>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Join the open-source campus event platform. Your data stays with you — we just provide the platform.
                        </p>
                    </div>

                    {/* Value Props */}
                    <div className="grid grid-cols-3 gap-3 mb-10">
                        {[
                            { icon: Shield, label: 'Data Sovereignty', desc: 'You own your data' },
                            { icon: Globe, label: 'Open Source', desc: 'Free forever' },
                            { icon: Building, label: 'Multi-Org', desc: 'Every college separate' },
                        ].map(item => (
                            <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-center">
                                <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                                <p className="text-sm font-semibold">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-8">
                        {steps.map((s, i) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${i < step ? 'bg-primary text-primary-foreground' :
                                    i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
                                {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        {step === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <h2 className="text-xl font-bold font-display mb-4">College Information</h2>
                                <div className="space-y-2">
                                    <Label>College / University Name *</Label>
                                    <Input value={form.collegeName} onChange={e => setForm(p => ({ ...p, collegeName: e.target.value }))} placeholder="e.g. BVM Engineering College" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Email Domain *</Label>
                                        <Input value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="college.edu.in" />
                                        <p className="text-xs text-muted-foreground">Students register with @{form.domain || 'your-domain'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Website</Label>
                                        <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://college.edu.in" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Approximate Student Count</Label>
                                    <Input type="number" value={form.studentCount} onChange={e => setForm(p => ({ ...p, studentCount: e.target.value }))} placeholder="e.g. 3000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brief Description</Label>
                                    <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell us about your college..." className="min-h-[80px]" />
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <h2 className="text-xl font-bold font-display mb-4">Admin Contact Details</h2>
                                <p className="text-sm text-muted-foreground -mt-2 mb-4">This person will be the Organization Admin and can add clubs, manage events, and onboard students.</p>
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input value={form.adminName} onChange={e => setForm(p => ({ ...p, adminName: e.target.value }))} placeholder="Prof. Rajan Shah" />
                                </div>
                                <div className="space-y-2">
                                    <Label>College Email *</Label>
                                    <Input type="email" value={form.adminEmail} onChange={e => setForm(p => ({ ...p, adminEmail: e.target.value }))} placeholder={`admin@${form.domain || 'college.edu.in'}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input value={form.adminPhone} onChange={e => setForm(p => ({ ...p, adminPhone: e.target.value }))} placeholder="+91 98765 43210" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Designation</Label>
                                        <Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Dean of Students" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Admin Password *</Label>
                                    <Input type="password" value={form.adminPassword} onChange={e => setForm(p => ({ ...p, adminPassword: e.target.value }))} placeholder="Set a login password for the admin" />
                                    <p className="text-xs text-muted-foreground">This password will be used to log into Mitra once approved.</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <h2 className="text-xl font-bold font-display mb-1">Data Hosting Preference</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Mitra is open-source. Your college data belongs to you — choose how it's stored.
                                </p>
                                <div className="space-y-3">
                                    {hostingOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, dataHosting: opt.value }))}
                                            className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${form.dataHosting === opt.value
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border hover:border-primary/40'
                                                }`}
                                        >
                                            <opt.icon className={`h-6 w-6 mt-0.5 shrink-0 ${form.dataHosting === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-sm">{opt.title}</p>
                                                    <Badge variant="outline" className="text-xs">{opt.badge}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                            </div>
                                            {form.dataHosting === opt.value && <Check className="h-5 w-5 text-primary shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                <h2 className="text-xl font-bold font-display mb-4">Review & Submit</h2>
                                <div className="space-y-3 text-sm">
                                    {[
                                        { label: 'College', value: form.collegeName },
                                        { label: 'Domain', value: form.domain },
                                        { label: 'Website', value: form.website || '—' },
                                        { label: 'Admin', value: form.adminName },
                                        { label: 'Admin Email', value: form.adminEmail },
                                        { label: 'Designation', value: form.designation || '—' },
                                        { label: 'Data Hosting', value: hostingOptions.find(h => h.value === form.dataHosting)?.title ?? '—' },
                                        { label: 'Admin Password', value: form.adminPassword ? '••••••••' : '(not set)' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium text-right max-w-[60%]">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground mt-4">
                                    By submitting, you confirm you are an authorized representative of the institution and agree to our terms of service.
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={step === 0 ? () => navigate('/') : handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> {step === 0 ? 'Cancel' : 'Back'}
                        </Button>
                        {step < steps.length - 1 ? (
                            <Button variant="hero" onClick={handleNext} disabled={step === 0 && !form.collegeName}>
                                Next <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button variant="hero" onClick={handleSubmit} disabled={!form.adminEmail || !form.adminPassword}>
                                Submit Request <Check className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
