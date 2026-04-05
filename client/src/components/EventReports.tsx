import { useState } from 'react';
import { getReportsByEvent, addEventReport, deleteEventReport } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Trash2, Download, FileWarning, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { EventReport } from '@/types';

interface EventReportsProps {
    eventId: string;
    canManage: boolean;
}

export default function EventReports({ eventId, canManage }: EventReportsProps) {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState<EventReport[]>(() => getReportsByEvent(eventId));
    const [uploadingName, setUploadingName] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
            toast.error('Only PDF and DOCX files are supported.');
            return;
        }

        // Validate size (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5 MB.');
            return;
        }

        setUploadingName(file.name);

        const reader = new FileReader();
        reader.onload = () => {
            const report: EventReport = {
                id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                eventId,
                fileName: file.name,
                fileType: ext as 'pdf' | 'docx',
                dataUrl: reader.result as string,
                uploadedBy: currentUser.id,
                createdAt: new Date().toISOString(),
            };
            addEventReport(report);
            setReports(prev => [...prev, report]);
            setUploadingName('');
            toast.success(`Report "${file.name}" uploaded!`);
        };
        reader.readAsDataURL(file);

        e.target.value = '';
    };

    const handleDelete = (id: string) => {
        deleteEventReport(id);
        setReports(prev => prev.filter(r => r.id !== id));
        toast.success('Report deleted.');
    };

    const handleDownload = (report: EventReport) => {
        const link = document.createElement('a');
        link.href = report.dataUrl;
        link.download = report.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (dataUrl: string) => {
        // Estimate size from base64
        const base64 = dataUrl.split(',')[1] || '';
        const sizeBytes = Math.round((base64.length * 3) / 4);
        if (sizeBytes < 1024) return `${sizeBytes} B`;
        if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
        return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-amber-500/30 bg-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold font-display">Event Reports</h2>
                    <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                        Admin Only
                    </span>
                </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                <FileWarning className="h-3.5 w-3.5 shrink-0" />
                Reports are confidential and not visible to event participants.
            </p>

            {/* Upload area — admin only */}
            {canManage && (
                <div className="mb-5">
                    <label className="flex items-center justify-center gap-2 w-full h-24 rounded-lg border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 transition-colors cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx"
                            onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">
                                {uploadingName ? `Uploading ${uploadingName}...` : 'Upload PDF or DOCX report (max 5 MB)'}
                            </span>
                        </div>
                    </label>
                </div>
            )}

            {/* Report list */}
            {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No reports uploaded yet.</p>
            ) : (
                <div className="space-y-2">
                    {reports.map(r => (
                        <div
                            key={r.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${r.fileType === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{r.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {r.fileType.toUpperCase()} · {formatFileSize(r.dataUrl)} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(r)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                {canManage && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(r.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete report"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
