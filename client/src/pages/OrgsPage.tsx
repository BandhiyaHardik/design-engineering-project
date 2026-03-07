import { useState } from 'react';
import { mockOrganizations, mockClubs, mockEvents } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building, Globe, Server, Users, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrgsPage() {
    const [search, setSearch] = useState('');

    const filteredOrgs = mockOrganizations.filter(org => {
        if (!search) return true;
        const q = search.toLowerCase();
        return org.name.toLowerCase().includes(q) || org.description.toLowerCase().includes(q) || org.domain.toLowerCase().includes(q);
    });

    const getOrgStats = (orgId: string) => {
        const clubs = mockClubs.filter(c => c.organizationId === orgId);
        const events = mockEvents.filter(e => e.organizationId === orgId);
        const students = new Set(clubs.flatMap(c => c.members)).size;
        return { clubs: clubs.length, events: events.length, students };
    };

    const hostingLabels: Record<string, string> = {
        self_hosted: 'Self-Hosted',
        mitra_cloud: 'Mitra Cloud',
        college_server: 'College Server',
    };

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="gradient-hero py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
                            <Sparkles className="h-4 w-4" />
                            <span>Verified institutions on Mitra</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display text-primary-foreground mb-4">
                            Organizations
                        </h1>
                        <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8">
                            Colleges and institutions using Mitra to power their campus events.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search organizations..."
                                className="pl-12 h-14 rounded-xl text-base bg-card border-none shadow-card"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Orgs List */}
            <section className="container mx-auto px-4 py-10">
                <div className="flex items-center gap-2 mb-6">
                    <Building className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold font-display">{filteredOrgs.length} Organization{filteredOrgs.length !== 1 ? 's' : ''}</h2>
                </div>

                {filteredOrgs.length === 0 ? (
                    <div className="text-center py-16">
                        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold font-display mb-2">No organizations found</h3>
                        <p className="text-muted-foreground">Try adjusting your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredOrgs.map((org, i) => {
                            const stats = getOrgStats(org.id);
                            return (
                                <motion.div
                                    key={org.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                    <Link to={`/org/${org.id}`} className="block group">
                                        <div className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-card-hover hover:border-primary/20">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shrink-0">
                                                    <Building className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                                                            {org.name}
                                                        </h3>
                                                        {org.isVerified && (
                                                            <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1">
                                                                <CheckCircle className="h-3 w-3" /> Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                        <span>{org.domain}</span>
                                                        {org.website && (
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3" /> Website
                                                            </span>
                                                        )}
                                                        {org.dataHosting && (
                                                            <span className="flex items-center gap-1">
                                                                <Server className="h-3 w-3" /> {hostingLabels[org.dataHosting] ?? org.dataHosting}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{org.description}</p>

                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { icon: Users, label: 'Clubs', value: stats.clubs },
                                                    { icon: Calendar, label: 'Events', value: stats.events },
                                                    { icon: Users, label: 'Students', value: stats.students },
                                                ].map(stat => (
                                                    <div key={stat.label} className="text-center rounded-lg bg-muted/50 py-2">
                                                        <p className="text-lg font-bold font-display">{stat.value}</p>
                                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
