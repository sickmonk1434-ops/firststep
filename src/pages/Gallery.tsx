
import { useState, useEffect } from "react";
import { db } from "@/db/client";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Image as ImageIcon, Calendar } from "lucide-react";

interface GalleryItem {
    id: number;
    type: 'photo' | 'video';
    url: string;
    title: string;
    event_name: string;
    event_date: string;
}

const Gallery = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            const res = await db.execute("SELECT * FROM gallery_items ORDER BY event_date DESC");
            setItems(res.rows as unknown as GalleryItem[]);
        } catch (err) {
            console.error(err);
            // Fallback dummy data
            setItems([
                { id: 1, type: 'photo', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', title: 'Annual Day 2024', event_name: 'Culture Night', event_date: '2024-05-15' },
                { id: 2, type: 'photo', url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9', title: 'Sports Meet', event_name: 'Summer Games', event_date: '2024-06-20' },
                { id: 3, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'School Tour', event_name: 'Open House', event_date: '2024-01-10' },
                { id: 4, type: 'photo', url: 'https://images.unsplash.com/photo-1588072432836-e10032774350', title: 'Art Workshop', event_name: 'Creative Kids', event_date: '2024-03-05' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => filter === "all" || item.type === filter);

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <section className="bg-muted py-20 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Gallery</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Capturing the joyful moments, creative discoveries, and proud milestones of our students.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-center items-center mb-12 gap-8">
                        <div className="bg-muted p-1 rounded-full flex gap-1">
                            {["all", "photo", "video"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-8 py-2 rounded-full text-sm font-bold capitalize transition-all ${filter === f ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/50"
                                        }`}
                                >
                                    {f === "all" ? "Everything" : f + "s"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid md:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            {filteredItems.map((item) => (
                                <Card key={item.id} className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-2xl">
                                    <div className="relative aspect-video overflow-hidden bg-black flex items-center justify-center">
                                        {item.type === 'photo' ? (
                                            <img
                                                src={item.url}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                            />
                                        ) : (
                                            <div className="w-full h-full relative">
                                                <img
                                                    src={`https://img.youtube.com/vi/${getYoutubeId(item.url)}/maxresdefault.jpg`}
                                                    className="w-full h-full object-cover blur-[1px] group-hover:blur-0 transition-all opacity-80"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                                                    <div className="h-16 w-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                                                        <Play className="h-8 w-8 fill-current translate-x-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 left-4 z-20">
                                            {item.type === 'photo' ? (
                                                <span className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg flex items-center justify-center shadow-lg">
                                                    <ImageIcon className="h-4 w-4 text-primary" />
                                                </span>
                                            ) : (
                                                <span className="bg-red-600 p-1.5 rounded-lg flex items-center justify-center shadow-lg">
                                                    <Play className="h-4 w-4 text-white fill-current" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.event_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm">{item.event_name}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-xl font-bold mb-2">No items found</h3>
                                    <p className="text-muted-foreground">Try changing the filter or check back later.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Gallery;
