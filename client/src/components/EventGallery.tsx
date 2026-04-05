import { useState } from 'react';
import { getGalleryByEvent, addGalleryImage, deleteGalleryImage } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ImagePlus, Trash2, ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { EventGalleryImage } from '@/types';

interface EventGalleryProps {
    eventId: string;
    canManage: boolean;
}

export default function EventGallery({ eventId, canManage }: EventGalleryProps) {
    const { currentUser } = useAuth();
    const [images, setImages] = useState<EventGalleryImage[]>(() => getGalleryByEvent(eventId));
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [caption, setCaption] = useState('');

    // ── Upload handler ──
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        const maxSize = 2 * 1024 * 1024; // 2 MB

        for (const file of files) {
            if (!allowed.includes(file.type)) {
                toast.error(`"${file.name}" is not a supported image format. Use JPG, PNG, GIF, or WebP.`);
                continue;
            }
            if (file.size > maxSize) {
                toast.error(`"${file.name}" exceeds the 2 MB limit.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const img: EventGalleryImage = {
                    id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    eventId,
                    dataUrl: reader.result as string,
                    caption: caption.trim() || undefined,
                    uploadedBy: currentUser.id,
                    createdAt: new Date().toISOString(),
                };
                addGalleryImage(img);
                setImages(prev => [...prev, img]);
                toast.success(`Image uploaded!`);
            };
            reader.readAsDataURL(file);
        }

        setCaption('');
        // Reset file input
        e.target.value = '';
    };

    const handleDelete = (id: string) => {
        deleteGalleryImage(id);
        setImages(prev => prev.filter(g => g.id !== id));
        if (lightboxIdx !== null) setLightboxIdx(null);
        toast.success('Image removed.');
    };

    const openLightbox = (idx: number) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const prevImage = () => setLightboxIdx(i => (i !== null && i > 0 ? i - 1 : images.length - 1));
    const nextImage = () => setLightboxIdx(i => (i !== null && i < images.length - 1 ? i + 1 : 0));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold font-display">Event Gallery</h2>
                    <span className="text-sm text-muted-foreground">({images.length})</span>
                </div>
            </div>

            {/* Upload area — admin only */}
            {canManage && (
                <div className="mb-5 space-y-3">
                    <div className="flex gap-2">
                        <Input
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            placeholder="Optional caption for the image(s)..."
                            className="flex-1"
                        />
                    </div>
                    <label className="flex items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.gif,.webp"
                            multiple
                            onChange={handleImageUpload}
                        />
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImagePlus className="h-7 w-7" />
                            <span className="text-xs">Click to upload images (JPG, PNG, GIF, WebP — max 2 MB each)</span>
                        </div>
                    </label>
                </div>
            )}

            {/* Image grid */}
            {images.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No gallery images yet.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                        <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/40 transition-colors">
                            <img
                                src={img.dataUrl}
                                alt={img.caption || 'Event photo'}
                                className="w-full h-full object-cover"
                                onClick={() => openLightbox(idx)}
                            />
                            {canManage && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                                    title="Delete image"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-xs text-white truncate">{img.caption}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <Dialog open={lightboxIdx !== null} onOpenChange={() => closeLightbox()}>
                <DialogContent className="max-w-3xl p-0 bg-black/95 border-none overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Gallery Image</DialogTitle>
                        <DialogDescription>Full size event gallery image</DialogDescription>
                    </DialogHeader>
                    {lightboxIdx !== null && images[lightboxIdx] && (
                        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[85vh]">
                            <img
                                src={images[lightboxIdx].dataUrl}
                                alt={images[lightboxIdx].caption || 'Event photo'}
                                className="max-w-full max-h-[80vh] object-contain"
                            />

                            {/* Nav arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}

                            {/* Close */}
                            <button
                                onClick={closeLightbox}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Caption + counter */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                {images[lightboxIdx].caption && (
                                    <p className="text-sm text-white mb-1">{images[lightboxIdx].caption}</p>
                                )}
                                <p className="text-xs text-white/60">
                                    {lightboxIdx + 1} / {images.length}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
