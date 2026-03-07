import { useState } from 'react';
import { mockClubs, mockOrganizations, addClubRequest } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { addNotification } from '@/hooks/useNotifications';
import ClubCard from '@/components/ClubCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Search, Users, Sparkles, Plus, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ClubsPage() {
    const [search, setSearch] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [clubName, setClubName] = useState('');
    const [clubDesc, setClubDesc] = useState('');
    const [orgId, setOrgId] = useState('');
    const { currentUser, isLoggedIn } = useAuth();

    const filteredClubs = mockClubs.filter(club => {
        if (!search) return true;
        const q = search.toLowerCase();
        return club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q);
    });

    const handleSubmitRequest = async () => {
        if (!clubName.trim() || !clubDesc.trim() || !orgId) {
            toast.error('Please fill in all fields.');
            return;
        }
        const orgName = mockOrganizations.find(o => o.id === orgId)?.name ?? 'organization';
        await addClubRequest({
            id: `cr-${Date.now()}`,
            clubName: clubName.trim(),
            description: clubDesc.trim(),
            organizationId: orgId,
            requestedBy: currentUser.id,
            requestedByName: currentUser.name,
            requestedByEmail: currentUser.email,
            status: 'pending',
            submittedAt: new Date().toISOString(),
        });
        addNotification({ icon: Building, text: `Club request "${clubName.trim()}" submitted to ${orgName} — pending approval` });
        toast.success('Club registration request submitted! It will be reviewed by the organization admin.');
        setClubName('');
        setClubDesc('');
        setOrgId('');
        setShowRegister(false);
    };

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="gradient-hero py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
                            <Sparkles className="h-4 w-4" />
                            <span>Student-run communities</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display text-primary-foreground mb-4">
                            Campus Clubs
                        </h1>
                        <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8">
                            Explore all the clubs at your college. Follow your favorites and never miss an event.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search clubs..."
                                className="pl-12 h-14 rounded-xl text-base bg-card border-none shadow-card"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Clubs Grid */}
            <section className="container mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold font-display">{filteredClubs.length} Club{filteredClubs.length !== 1 ? 's' : ''}</h2>
                    </div>
                    {isLoggedIn && (
                        <Button variant="hero" size="sm" className="gap-1" onClick={() => setShowRegister(true)}>
                            <Plus className="h-4 w-4" /> Register Club
                        </Button>
                    )}
                </div>

                {filteredClubs.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold font-display mb-2">No clubs found</h3>
                        <p className="text-muted-foreground">Try adjusting your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredClubs.map((club, i) => (
                            <ClubCard key={club.id} club={club} index={i} />
                        ))}
                    </div>
                )}
            </section>

            {/* Register Club Modal */}
            <Dialog open={showRegister} onOpenChange={setShowRegister}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display">Register a New Club</DialogTitle>
                        <DialogDescription>
                            Submit a request to create a club under an organization. It will be reviewed by the Org Admin before approval.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Club Name *</Label>
                            <Input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="e.g., AI & ML Club" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea value={clubDesc} onChange={e => setClubDesc(e.target.value)} placeholder="What will this club do? Weekly activities, goals..." className="min-h-[80px]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Organization *</Label>
                            <Select value={orgId} onValueChange={setOrgId}>
                                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                                <SelectContent>
                                    {mockOrganizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
                        <Button variant="hero" onClick={handleSubmitRequest}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
