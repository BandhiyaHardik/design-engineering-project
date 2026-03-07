import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, QrCode, ScanLine, UserCheck, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  attended: boolean;
}

export default function AttendanceScanner() {
  const { id } = useParams<{ id: string }>();
  const event = getEventById(id ?? '');

  const [participants, setParticipants] = useState<ParticipantRow[]>(
    mockUsers.filter(u => u.role === 'student').map(u => ({
      id: u.id, name: u.name, email: u.email, attended: false,
    }))
  );
  const [scanResult, setScanResult] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-display mb-4">Event not found</h2>
        <Link to="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const handleManualCheckIn = (userId: string) => {
    setParticipants(prev => prev.map(p => p.id === userId ? { ...p, attended: !p.attended } : p));
    toast.success('Attendance updated!');
  };

  const handleQRScan = () => {
    setScanResult('Simulated QR scan — Student checked in successfully!');
    toast.success('QR scan successful! Student marked as present.');
  };

  const attendedCount = participants.filter(p => p.attended).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold font-display mb-1">Attendance — {event.title}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {attendedCount} / {participants.length} checked in
        </p>

        <Tabs defaultValue="manual">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="manual"><UserCheck className="h-4 w-4 mr-1" /> Manual</TabsTrigger>
            <TabsTrigger value="eventqr"><QrCode className="h-4 w-4 mr-1" /> Event QR</TabsTrigger>
            <TabsTrigger value="ticketscan"><ScanLine className="h-4 w-4 mr-1" /> Ticket Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {participants.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <Button
                    variant={p.attended ? 'success' : 'outline'}
                    size="sm"
                    onClick={() => handleManualCheckIn(p.id)}
                  >
                    {p.attended ? <><Check className="h-4 w-4 mr-1" /> Present</> : <><X className="h-4 w-4 mr-1" /> Absent</>}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="eventqr" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <QrCode className="h-32 w-32 mx-auto text-primary mb-4" />
              <p className="font-semibold font-display mb-2">Event Check-in QR Code</p>
              <p className="text-sm text-muted-foreground mb-4">Display this QR code at the venue. Students scan it to check in.</p>
              <Button variant="hero">Generate New QR Code</Button>
            </div>
          </TabsContent>

          <TabsContent value="ticketscan" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <ScanLine className="h-16 w-16 mx-auto text-primary mb-4" />
              <p className="font-semibold font-display mb-2">Scan Student Tickets</p>
              <p className="text-sm text-muted-foreground mb-4">Scan each student's unique ticket QR code to verify registration and mark attendance.</p>
              <Button variant="hero" onClick={handleQRScan}>Simulate Scan</Button>
              {scanResult && (
                <p className="text-sm text-success mt-4">{scanResult}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
