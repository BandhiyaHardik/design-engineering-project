import { useState, useCallback } from 'react';
import { Calendar, Users, CheckCircle, Megaphone, AlertTriangle } from 'lucide-react';

export interface AppNotification {
    id: string;
    icon: typeof Calendar;
    text: string;
    time: string;
    read: boolean;
}

// ── Global notification store (survives component re-renders) ──
let globalNotifications: AppNotification[] = [];
let listeners: Array<() => void> = [];

const notify = () => listeners.forEach(fn => fn());

export function addNotification(n: Omit<AppNotification, 'id' | 'time' | 'read'>) {
    globalNotifications = [
        { ...n, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: 'Just now', read: false },
        ...globalNotifications,
    ];
    notify();
}

/** Seed initial notifications based on role (called once per login) */
export function seedNotifications(role: string) {
    if (globalNotifications.length > 0) return; // already seeded
    const base: AppNotification[] = [
        { id: 'n1', icon: Calendar, text: 'Cloud Native Hackathon starts tomorrow!', time: '2 hours ago', read: false },
        { id: 'n2', icon: CheckCircle, text: 'You registered for DSA Bootcamp', time: '1 day ago', read: false },
        { id: 'n3', icon: Megaphone, text: 'New announcement on TechFest 2026', time: '2 days ago', read: true },
    ];
    if (['super_admin', 'org_admin', 'club_admin', 'organizer'].includes(role)) {
        globalNotifications = [
            { id: 'n0', icon: Users, text: '3 new registrations for Cloud Native Hackathon', time: '30 min ago', read: false },
            ...base,
            { id: 'n4', icon: Users, text: 'Raj Patel joined AWS Cloud Club', time: '3 days ago', read: true },
        ];
    } else {
        globalNotifications = base;
    }
    notify();
}

export function clearNotifications() {
    globalNotifications = [];
    notify();
}

export function useNotifications() {
    const [, setTick] = useState(0);

    // Subscribe to changes
    useState(() => {
        const listener = () => setTick(t => t + 1);
        listeners.push(listener);
        return () => { listeners = listeners.filter(l => l !== listener); };
    });

    const markAllRead = useCallback(() => {
        globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
        notify();
    }, []);

    return {
        notifications: globalNotifications,
        unreadCount: globalNotifications.filter(n => !n.read).length,
        markAllRead,
        addNotification,
    };
}
