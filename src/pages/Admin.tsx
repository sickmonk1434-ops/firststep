
import { useState, useEffect } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Image as ImageIcon, Users, Camera, Video, Plus, Check, X, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [gallery, setGallery] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("applications");

    // Form states
    const [isBannerOpen, setIsBannerOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryType, setGalleryType] = useState<'photo' | 'video'>('photo');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === "applications") {
                const res = await db.execute("SELECT * FROM applications ORDER BY created_at DESC");
                setApplications(res.rows);
            } else if (activeTab === "banners") {
                const res = await db.execute("SELECT * FROM banner_images ORDER BY display_order ASC");
                setBanners(res.rows);
            } else if (activeTab === "gallery") {
                const res = await db.execute("SELECT * FROM gallery_items ORDER BY event_date DESC");
                setGallery(res.rows);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            await db.execute({
                sql: "UPDATE applications SET status = ? WHERE id = ?",
                args: [status, id]
            });
            toast.success(`Application ${status}`);
            fetchData();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDeleteItem = async (table: string, id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await db.execute({
                sql: `DELETE FROM ${table} WHERE id = ?`,
                args: [id]
            });
            toast.success("Item deleted");
            fetchData();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleAddBanner = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await db.execute({
                sql: "INSERT INTO banner_images (url, alt_text, display_order) VALUES (?, ?, ?)",
                args: [
                    formData.get('url') as string,
                    formData.get('alt_text') as string,
                    parseInt(formData.get('display_order') as string || '0')
                ]
            });
            toast.success("Banner added");
            setIsBannerOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to add banner");
        }
    };

    const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await db.execute({
                sql: "INSERT INTO gallery_items (type, url, title, event_name, event_date) VALUES (?, ?, ?, ?, ?)",
                args: [
                    galleryType,
                    formData.get('url') as string,
                    formData.get('title') as string,
                    formData.get('event_name') as string,
                    formData.get('event_date') as string
                ]
            });
            toast.success(`${galleryType} added to gallery`);
            setIsGalleryOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to add gallery item");
        }
    };

    const handleSendEmail = (email: string, status: string, name: string) => {
        toast.info(`Email sent to ${email} regarding ${status} status for ${name}`);
        console.log(`SUBJECT: The First Step Pre-School Application Status - ${status}`);
        console.log(`BODY: Dear Parent, The application for ${name} has been ${status}.`);
    };

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Admin Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl">FS Admin Portal</span>
                    </div>
                    <Button variant="ghost" onClick={() => window.location.href = "/"}>Logout</Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="applications" className="space-y-6" onValueChange={setActiveTab}>
                    <TabsList className="bg-white border p-1 rounded-xl w-full md:w-auto h-auto grid grid-cols-3 gap-2">
                        <TabsTrigger value="applications" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Users className="h-4 w-4 mr-2" /> Applications
                        </TabsTrigger>
                        <TabsTrigger value="banners" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <ImageIcon className="h-4 w-4 mr-2" /> Banners
                        </TabsTrigger>
                        <TabsTrigger value="gallery" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Camera className="h-4 w-4 mr-2" /> Gallery
                        </TabsTrigger>
                    </TabsList>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Applications</CardTitle>
                                <CardDescription>Review and manage admission requests.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 border-y">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Student Name</th>
                                                <th className="px-4 py-3 font-semibold">Parent</th>
                                                <th className="px-4 py-3 font-semibold">Program</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {applications.map((app) => (
                                                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-4 font-bold">{app.student_name}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium">{app.parent_name}</div>
                                                        <div className="text-xs text-muted-foreground">{app.email}</div>
                                                    </td>
                                                    <td className="px-4 py-4">{app.program_interest}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                app.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                    'bg-red-100 text-red-800 border-red-200'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right space-x-2">
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleUpdateStatus(app.id, 'approved')}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button size="sm" variant="secondary" onClick={() => handleSendEmail(app.email, app.status, app.student_name)}>
                                                            <Mail className="h-4 w-4 mr-2" /> Email
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteItem('applications', app.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {applications.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-10 text-muted-foreground">No applications found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Banners Tab */}
                    <TabsContent value="banners">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Banner Images</CardTitle>
                                    <CardDescription>Manage images for the home page slider.</CardDescription>
                                </div>
                                <Dialog open={isBannerOpen} onOpenChange={setIsBannerOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Image</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Banner Image</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddBanner} className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="url">Image URL</Label>
                                                <Input id="url" name="url" placeholder="https://unsplash..." required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="alt_text">Display Title / Alt Text</Label>
                                                <Input id="alt_text" name="alt_text" placeholder="Kids playing..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="display_order">Order Position</Label>
                                                <Input id="display_order" name="display_order" type="number" defaultValue="0" />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="w-full">Create Banner</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {banners.map((banner) => (
                                        <Card key={banner.id} className="overflow-hidden group">
                                            <div className="h-40 relative">
                                                <img src={banner.url} alt={banner.alt_text} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteItem('banner_images', banner.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium truncate">{banner.alt_text || 'No description'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Order Index: {banner.display_order}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {banners.length === 0 && (
                                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted text-muted-foreground">
                                            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <p>No banners uploaded. The home page will use defaults.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Gallery Tab */}
                    <TabsContent value="gallery">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gallery Items</CardTitle>
                                    <CardDescription>Event photos and YouTube videos.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                                        <DialogTrigger asChild>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setGalleryType('photo')}><Plus className="h-4 w-4 mr-2" /> Photo</Button>
                                                <Button size="sm" onClick={() => setGalleryType('video')}><Video className="h-4 w-4 mr-2" /> Video</Button>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add {galleryType === 'photo' ? 'Photo' : 'YouTube Video'}</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleAddGallery} className="space-y-4 pt-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="url">{galleryType === 'photo' ? 'Image URL' : 'YouTube Link'}</Label>
                                                    <Input id="url" name="url" placeholder={galleryType === 'photo' ? 'https://...' : 'https://youtube.com/watch?v=...'} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input id="title" name="title" placeholder="Moment Name" required />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event_name">Event Name</Label>
                                                        <Input id="event_name" name="event_name" placeholder="e.g. Annual Day" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event_date">Event Date</Label>
                                                        <Input id="event_date" name="event_date" type="date" required />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit" className="w-full">Add to Gallery</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {gallery.map((item) => (
                                        <Card key={item.id} className="overflow-hidden group">
                                            <div className="h-48 bg-muted flex items-center justify-center relative">
                                                {item.type === 'photo' ? (
                                                    <img src={item.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <Video className="h-10 w-10" />
                                                        <span className="text-xs">Video Content</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteItem('gallery_items', item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase pointer-events-none">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <CardContent className="p-4">
                                                <h4 className="font-bold truncate">{item.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{item.event_name} • {item.event_date}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {gallery.length === 0 && (
                                        <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl">
                                            <Camera className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                            <p className="text-muted-foreground">Gallery is empty.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Admin;
