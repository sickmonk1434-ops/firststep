
import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    GraduationCap, ImageIcon, Users, Camera, Video, Plus, Check, X,
    Trash2, Clock, ShieldCheck, UserPlus, BarChart3, Receipt, IndianRupee,
    Briefcase, TrendingUp, Sun, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

// New admin-only report tabs
import ReportsTab from "./admin/ReportsTab";
import ExpenditureTab from "./admin/ExpenditureTab";
import AdmissionsTab from "./admin/AdmissionsTab";
import SalariesTab from "./admin/SalariesTab";
import EmployeesTab from "./admin/EmployeesTab";
import InvestmentTab from "./admin/InvestmentTab";
import SummerCampTab from "./admin/SummerCampTab";
import EnquiriesTab from "./admin/EnquiriesTab";
import FeeDetailsTab from "./admin/FeeDetailsTab";

const Admin = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [yearId, setYearId] = useState<string>("");

    // Data states
    const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
    const [banners, setBanners] = useState<Record<string, unknown>[]>([]);
    const [gallery, setGallery] = useState<Record<string, unknown>[]>([]);
    const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
    const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);

    // Form states
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [galleryType, setGalleryType] = useState<'photo' | 'video'>('photo');

    const fetchYears = useCallback(async () => {
        try {
            const res = await db.execute("SELECT * FROM academic_years WHERE type='normal' ORDER BY start_date DESC");
            setAcademicYears(res.rows);
            const active = res.rows.find((r: any) => r.is_active === 1);
            if (active && active.id !== null && active.id !== undefined) {
                setYearId(active.id.toString());
            } else if (res.rows.length > 0 && res.rows[0].id !== null && res.rows[0].id !== undefined) {
                setYearId(res.rows[0].id.toString());
            }
        } catch { toast.error("Failed to load cycles"); }
    }, []);

    const fetchData = useCallback(async () => {
        if (!yearId) return;
        try {
            const currentYear = academicYears.find(y => y.id.toString() === yearId);
            if (!currentYear) return;

            const startDate = currentYear.start_date;
            const endDate = currentYear.end_date + " 23:59:59";
            
            if (activeTab === "applications") {
                const res = await db.execute({
                    sql: "SELECT * FROM applications WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC",
                    args: [startDate, endDate]
                });
                setApplications(res.rows as Record<string, unknown>[]);
            } else if (activeTab === "attendance") {
                const res = await db.execute({
                    sql: "SELECT * FROM attendance WHERE date >= ? AND date <= ? ORDER BY date DESC, clock_in DESC",
                    args: [currentYear.start_date, currentYear.end_date]
                });
                setAttendance(res.rows as Record<string, unknown>[]);
            } else if (activeTab === "staff") {
                const res = await db.execute("SELECT * FROM users ORDER BY role ASC");
                setStaff(res.rows as Record<string, unknown>[]);
            } else if (activeTab === "banners") {
                const res = await db.execute("SELECT * FROM banner_images ORDER BY display_order ASC");
                setBanners(res.rows as Record<string, unknown>[]);
            } else if (activeTab === "gallery") {
                const res = await db.execute("SELECT * FROM gallery_items ORDER BY event_date DESC");
                setGallery(res.rows as Record<string, unknown>[]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch data");
        }
    }, [activeTab, yearId, academicYears]);

    useEffect(() => { fetchYears(); }, [fetchYears]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    if (authLoading) return <div className="p-20 text-center">Checking authentication...</div>;
    if (!user) return <Navigate to="/login" />;

    // ----- Action Handlers -----

    const handleUpdateApplication = async (id: number, action: string) => {
        try {
            if (user.role === 'principal') {
                await db.execute({
                    sql: "UPDATE applications SET principal_recommendation = ? WHERE id = ?",
                    args: [action, id]
                });
                toast.success(`Principal ${action} recommendation submitted`);
            } else if (user.role === 'admin') {
                await db.execute({
                    sql: "UPDATE applications SET admin_confirmation = ?, status = ? WHERE id = ?",
                    args: ['confirmed', action, id]
                });
                toast.success(`Admin confirmed application as ${action}`);
            }
            fetchData();
        } catch {
            toast.error("Application update failed");
        }
    };

    const handleAttendanceAction = async (id: number, status: string) => {
        if (user.role !== 'admin' && user.role !== 'principal') return;
        try {
            await db.execute({
                sql: "UPDATE attendance SET status = ? WHERE id = ?",
                args: [status, id]
            });
            toast.success(`Attendance ${status}`);
            fetchData();
        } catch {
            toast.error("Failed to update attendance");
        }
    };

    const handleClockIn = async () => {
        try {
            const now = new Date().toISOString();
            await db.execute({
                sql: "INSERT INTO attendance (type, target_id, clock_in, status, marked_by) VALUES (?, ?, ?, ?, ?)",
                args: ['staff', user.id, now, 'pending', user.id]
            });
            toast.success("Clocked in successfully! Awaiting approval.");
            fetchData();
        } catch {
            toast.error("Clock-in failed");
        }
    };

    const handleClockOut = async (attendanceId: number) => {
        try {
            const now = new Date().toISOString();
            await db.execute({
                sql: "UPDATE attendance SET clock_out = ? WHERE id = ?",
                args: [now, attendanceId]
            });
            toast.success("Clocked out successfully!");
            fetchData();
        } catch {
            toast.error("Clock-out failed");
        }
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await db.execute({
                sql: "INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
                args: [
                    formData.get('email') as string,
                    formData.get('password') as string,
                    formData.get('role') as string,
                    formData.get('name') as string
                ]
            });
            toast.success("System user created");
            setIsStaffOpen(false);
            fetchData();
        } catch {
            toast.error("Failed to create user");
        }
    };

    const handleDeleteItem = async (table: string, id: number) => {
        if (user.role !== 'admin') {
            toast.error("Only Admin can delete items");
            return;
        }
        if (!confirm("Confirm deletion?")) return;
        try {
            await db.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [id] });
            toast.success("Item deleted");
            fetchData();
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await db.execute({
                sql: "INSERT INTO gallery_items (type, url, title, event_name, event_date) VALUES (?, ?, ?, ?, ?)",
                args: [galleryType, formData.get('url') as string, formData.get('title') as string, formData.get('event_name') as string, formData.get('event_date') as string]
            });
            toast.success("Gallery item added");
            setIsGalleryOpen(false);
            fetchData();
        } catch { toast.error("Failed"); }
    };

    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Admin Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl uppercase tracking-tighter">
                            FS <span className="text-muted-foreground font-light">{user.role}</span> Portal
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium hidden md:block">Welcome, {user.name}</span>
                        <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="dashboard" className="space-y-6" onValueChange={setActiveTab}>
                    <TabsList className="bg-white border p-1 rounded-xl w-full h-auto flex flex-wrap gap-1 overflow-x-auto">
                        <TabsTrigger value="dashboard" className="flex-1 min-w-fit">Dashboard</TabsTrigger>
                        <TabsTrigger value="attendance" className="flex-1 min-w-fit"><Clock className="h-4 w-4 mr-1.5" />Attendance</TabsTrigger>
                        <TabsTrigger value="applications" className="flex-1 min-w-fit"><Users className="h-4 w-4 mr-1.5" />Applications</TabsTrigger>
                        {(isAdmin || user.role === 'principal') && (
                            <TabsTrigger value="gallery" className="flex-1 min-w-fit"><Camera className="h-4 w-4 mr-1.5" />Gallery</TabsTrigger>
                        )}
                        {(isAdmin || user.role === 'principal') && (
                            <TabsTrigger value="expenditure" className="flex-1 min-w-fit"><Receipt className="h-4 w-4 mr-1.5" />Expenditure</TabsTrigger>
                        )}
                        {(isAdmin || user.role === 'principal') && (
                            <TabsTrigger value="fee-details" className="flex-1 min-w-fit"><IndianRupee className="h-4 w-4 mr-1.5" />Fee Details</TabsTrigger>
                        )}
                        {isAdmin && (
                            <>
                                <TabsTrigger value="staff" className="flex-1 min-w-fit"><UserPlus className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
                                <TabsTrigger value="banners" className="flex-1 min-w-fit"><ImageIcon className="h-4 w-4 mr-1.5" />Banners</TabsTrigger>
                                {/* ── Excel Reports Tabs ── */}
                                <TabsTrigger value="reports" className="flex-1 min-w-fit"><BarChart3 className="h-4 w-4 mr-1.5" />Reports</TabsTrigger>
                                <TabsTrigger value="admissions-data" className="flex-1 min-w-fit"><GraduationCap className="h-4 w-4 mr-1.5" />Admissions</TabsTrigger>
                                <TabsTrigger value="salaries" className="flex-1 min-w-fit"><IndianRupee className="h-4 w-4 mr-1.5" />Salaries</TabsTrigger>
                                <TabsTrigger value="employees" className="flex-1 min-w-fit"><Briefcase className="h-4 w-4 mr-1.5" />Employees</TabsTrigger>
                                <TabsTrigger value="investment" className="flex-1 min-w-fit"><TrendingUp className="h-4 w-4 mr-1.5" />Investment</TabsTrigger>
                                <TabsTrigger value="summercamp" className="flex-1 min-w-fit"><Sun className="h-4 w-4 mr-1.5" />Summer Camp</TabsTrigger>
                                <TabsTrigger value="enquiries" className="flex-1 min-w-fit"><MessageSquare className="h-4 w-4 mr-1.5" />Enquiries</TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {/* Dashboard Summary View */}
                    <TabsContent value="dashboard">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-primary text-white border-none">
                                <CardHeader className="pb-2">
                                    <CardDescription className="text-white/80">Role</CardDescription>
                                    <CardTitle className="text-3xl capitalize">{user.role}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm opacity-90">Manage your specific duties here.</p>
                                </CardContent>
                            </Card>

                            {/* Attendance Quick Action */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" /> Self Attendance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button onClick={handleClockIn} variant="default" className="w-full">Clock In</Button>
                                    <Button variant="outline" className="w-full">Remarks</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Attendance Tab */}
                    <TabsContent value="attendance">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                                <div>
                                    <CardTitle>Attendance Log</CardTitle>
                                    <CardDescription>Records of clock-ins and outs for {academicYears.find(y => y.id.toString() === yearId)?.name || "Selected Period"}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select className="border rounded-md px-3 py-1.5 text-sm" value={yearId} onChange={e => setYearId(e.target.value)}>
                                        {academicYears.map(y => (
                                            <option key={y.id} value={y.id.toString()}>{y.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {attendance.map((att) => (
                                        <div key={String(att.id)} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                                    {String(att.type)[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{String(att.date)}</p>
                                                    <p className="text-xs text-muted-foreground">In: {new Date(String(att.clock_in)).toLocaleTimeString()} {att.clock_out ? `| Out: ${new Date(String(att.clock_out)).toLocaleTimeString()}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${att.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {String(att.status)}
                                                </span>
                                                {(user.role === 'admin' || user.role === 'principal') && att.status === 'pending' && (
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAttendanceAction(Number(att.id), 'approved')}><Check className="h-4 w-4" /></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleAttendanceAction(Number(att.id), 'rejected')}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                )}
                                                {!att.clock_out && att.target_id === user.id && (
                                                    <Button size="sm" onClick={() => handleClockOut(Number(att.id))}>Clock Out</Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                                <div>
                                    <CardTitle>Admission Pipeline</CardTitle>
                                    <CardDescription>Two-step approval: Principal (Review) → Admin (Confirm) for {academicYears.find(y => y.id.toString() === yearId)?.name || "Selected Period"}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select className="border rounded-md px-3 py-1.5 text-sm" value={yearId} onChange={e => setYearId(e.target.value)}>
                                        {academicYears.map(y => (
                                            <option key={y.id} value={y.id.toString()}>{y.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 border-y">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Student</th>
                                                <th className="px-4 py-3 font-semibold">Principal Rec</th>
                                                <th className="px-4 py-3 font-semibold">Admin Conf</th>
                                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y bg-white">
                                            {applications.map((app) => (
                                                <tr key={String(app.id)}>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold">{String(app.student_name)}</div>
                                                        <div className="text-xs text-muted-foreground">{String(app.program_interest)}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.principal_recommendation === 'approved' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                                            {String(app.principal_recommendation).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${app.admin_confirmation === 'confirmed' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                            {String(app.admin_confirmation).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right space-x-2">
                                                        {user.role === 'principal' && app.principal_recommendation === 'pending' && (
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" onClick={() => handleUpdateApplication(Number(app.id), 'approved')}>Recommend</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => handleUpdateApplication(Number(app.id), 'rejected')}>Reject</Button>
                                                            </div>
                                                        )}
                                                        {user.role === 'admin' && app.principal_recommendation === 'approved' && app.admin_confirmation === 'pending' && (
                                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => handleUpdateApplication(Number(app.id), 'approved')}>
                                                                <ShieldCheck className="h-4 w-4 mr-2" /> Confirm Admission
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Staff/User Management (Admin Only) */}
                    <TabsContent value="staff">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle>Core System Users</CardTitle></div>
                                <Dialog open={isStaffOpen} onOpenChange={setIsStaffOpen}>
                                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Account</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Create Staff Login</DialogTitle></DialogHeader>
                                        <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                                            <div className="space-y-2"><Label>Full Name</Label><Input name="name" required /></div>
                                            <div className="space-y-2"><Label>Email / Login</Label><Input name="email" type="email" required /></div>
                                            <div className="space-y-2"><Label>Temporary Password</Label><Input name="password" required /></div>
                                            <div className="space-y-2">
                                                <Label>System Role</Label>
                                                <Select name="role" defaultValue="teacher">
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="principal">Principal</SelectItem>
                                                        <SelectItem value="teacher">Teacher</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <DialogFooter><Button type="submit" className="w-full">Create Account</Button></DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {staff.map((s) => (
                                        <Card key={String(s.id)} className="relative group overflow-hidden">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-md flex justify-between">
                                                    {String(s.name)}
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 rounded-full uppercase">{String(s.role)}</span>
                                                </CardTitle>
                                                <CardDescription>{String(s.email)}</CardDescription>
                                            </CardHeader>
                                            {user.id !== s.id && (
                                                <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive h-8 w-8" onClick={() => handleDeleteItem('users', Number(s.id))}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="banners">
                        <Card>
                            <CardHeader><CardTitle>Banners</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {banners.map(b => (
                                        <div key={String(b.id)} className="flex items-center gap-4 border p-2 rounded">
                                            <img src={String(b.url)} className="w-20 h-10 object-cover" />
                                            <div className="flex-1">{String(b.alt_text)}</div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('banner_images', Number(b.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gallery">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div><CardTitle>Gallery Management</CardTitle></div>
                                <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                                    <DialogTrigger asChild>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setGalleryType('photo')}><Plus className="h-4 w-4 mr-2" /> Photo</Button>
                                            <Button size="sm" onClick={() => setGalleryType('video')}><Video className="h-4 w-4 mr-2" /> Video</Button>
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Add to Gallery</DialogTitle></DialogHeader>
                                        <form onSubmit={handleAddGallery} className="space-y-4 pt-4">
                                            <Input name="url" placeholder="URL" required />
                                            <Input name="title" placeholder="Title" required />
                                            <Input name="event_name" placeholder="Event" />
                                            <Input name="event_date" type="date" required />
                                            <DialogFooter><Button type="submit" className="w-full">Post</Button></DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {gallery.map((item) => (
                                        <Card key={String(item.id)} className="overflow-hidden group relative">
                                            <div className="h-40 bg-muted">
                                                {item.type === 'photo' && <img src={String(item.url)} className="w-full h-full object-cover" />}
                                            </div>
                                            <CardContent className="p-4">
                                                <p className="font-bold truncate">{String(item.title)}</p>
                                                {user.role === 'admin' && (
                                                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteItem('gallery_items', Number(item.id))}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── New Excel-Powered Report Tabs (Admin Only) ── */}
                    <TabsContent value="reports"><ReportsTab /></TabsContent>
                    <TabsContent value="expenditure"><ExpenditureTab userRole={user.role} userEmail={user.email} /></TabsContent>
                    <TabsContent value="fee-details"><FeeDetailsTab /></TabsContent>
                    <TabsContent value="admissions-data"><AdmissionsTab /></TabsContent>
                    <TabsContent value="salaries"><SalariesTab /></TabsContent>
                    <TabsContent value="employees"><EmployeesTab /></TabsContent>
                    <TabsContent value="investment"><InvestmentTab /></TabsContent>
                    <TabsContent value="summercamp"><SummerCampTab /></TabsContent>
                    <TabsContent value="enquiries"><EnquiriesTab /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Admin;
