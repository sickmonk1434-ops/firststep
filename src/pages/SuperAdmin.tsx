import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ShieldCheck, Building2, Users, BarChart3, GraduationCap, LogOut,
    Plus, Pencil, Trash2, School, Phone, Mail, MapPin, UserCog,
    TrendingUp, IndianRupee, Receipt, Briefcase, Sun, MessageSquare, Settings as SettingsIcon, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

// Import existing report tabs (context: school_id filter can be added later)
import ReportsTab from "./admin/ReportsTab";
import ExpenditureTab from "./admin/ExpenditureTab";
import AdmissionsTab from "./admin/AdmissionsTab";
import SalariesTab from "./admin/SalariesTab";
import EmployeesTab from "./admin/EmployeesTab";
import InvestmentTab from "./admin/InvestmentTab";
import SummerCampTab from "./admin/SummerCampTab";
import EnquiriesTab from "./admin/EnquiriesTab";

// ─────────────────────── Types ───────────────────────
interface School {
    id: number;
    name: string;
    branch_code: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    created_at: string;
}

interface UserRow {
    id: number;
    email: string;
    name: string;
    role: string;
    school_id: number | null;
}

interface AcademicYearRow {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    type: 'normal' | 'summer_camp';
    is_active: number;
}

interface Stats {
    schools: number;
    users: number;
    applications: number;
    staff: number;
}

// ─────────────────────── Component ───────────────────────
const SuperAdmin = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const [academicYear, setAcademicYear] = useState("");

    // Data
    const [schools, setSchools] = useState<School[]>([]);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [stats, setStats] = useState<Stats>({ schools: 0, users: 0, applications: 0, staff: 0 });
    const [selectedSchoolReport, setSelectedSchoolReport] = useState<string>("all");

    // Dialog states
    const [isSchoolOpen, setIsSchoolOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [editSchool, setEditSchool] = useState<School | null>(null);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYearRow[]>([]);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [editYear, setEditYear] = useState<AcademicYearRow | null>(null);

    const fetchData = useCallback(async () => {
        try {
            if (activeTab === "overview" || activeTab === "schools") {
                const res = await db.execute("SELECT * FROM schools ORDER BY id ASC");
                setSchools(res.rows as unknown as School[]);
            }
            if (activeTab === "overview" || activeTab === "users") {
                const res = await db.execute("SELECT id,email,name,role,school_id FROM users ORDER BY role,name");
                setUsers(res.rows as unknown as UserRow[]);
            }
            if (activeTab === "settings" || activeTab === "overview") {
                const res = await db.execute("SELECT * FROM academic_years ORDER BY start_date DESC");
                const years = res.rows as unknown as AcademicYearRow[];
                setAcademicYears(years);
                if (!academicYear) {
                    const active = years.find(y => y.is_active === 1 && y.type === 'normal');
                    if (active) setAcademicYear(active.id.toString());
                    else if (years.length > 0) setAcademicYear(years[0].id.toString());
                }
            }
            if (activeTab === "overview") {
                const currentYear = academicYears.find(y => y.id.toString() === academicYear);
                if (!currentYear) return;

                const startDate = currentYear.start_date;
                const endDate = currentYear.end_date + " 23:59:59";
                const [sc, us, ap] = await Promise.all([
                    db.execute("SELECT COUNT(*) as c FROM schools"),
                    db.execute("SELECT COUNT(*) as c FROM users"),
                    db.execute({
                        sql: "SELECT COUNT(*) as c FROM applications WHERE created_at >= ? AND created_at <= ?",
                        args: [startDate, endDate]
                    }),
                ]);
                setStats({
                    schools: sc.rows[0].c as number,
                    users: us.rows[0].c as number,
                    applications: ap.rows[0].c as number,
                    staff: (us.rows[0].c as number),
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        }
    }, [activeTab, academicYear, academicYears]);

    useEffect(() => {
        if (user?.role === 'super_admin') fetchData();
    }, [user, fetchData]);

    if (authLoading) return <div className="p-20 text-center text-muted-foreground">Checking auth…</div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'super_admin') return <Navigate to="/login" />;

    // ─── Handlers ───
    const handleSaveSchool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            if (editSchool) {
                await db.execute({
                    sql: "UPDATE schools SET name=?,branch_code=?,address=?,phone=?,email=? WHERE id=?",
                    args: [fd.get('name') as string, fd.get('branch_code') as string, fd.get('address') as string, fd.get('phone') as string, fd.get('email') as string, editSchool.id]
                });
                toast.success("School updated");
            } else {
                await db.execute({
                    sql: "INSERT INTO schools (name,branch_code,address,phone,email) VALUES (?,?,?,?,?)",
                    args: [fd.get('name') as string, fd.get('branch_code') as string, fd.get('address') as string, fd.get('phone') as string, fd.get('email') as string]
                });
                toast.success("School created");
            }
            setIsSchoolOpen(false);
            setEditSchool(null);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save school");
        }
    };

    const handleDeleteSchool = async (id: number) => {
        if (!confirm("Delete this school? Users assigned to it will lose their school assignment.")) return;
        try {
            await db.execute({ sql: "UPDATE users SET school_id=NULL WHERE school_id=?", args: [id] });
            await db.execute({ sql: "DELETE FROM schools WHERE id=?", args: [id] });
            toast.success("School deleted");
            fetchData();
        } catch { toast.error("Failed to delete school"); }
    };

    const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const role = fd.get('role') as string;
        const school_id = fd.get('school_id') ? Number(fd.get('school_id')) : null;
        try {
            if (editUser) {
                await db.execute({
                    sql: "UPDATE users SET name=?,email=?,role=?,school_id=? WHERE id=?",
                    args: [fd.get('name') as string, fd.get('email') as string, role, school_id, editUser.id]
                });
                toast.success("User updated");
            } else {
                await db.execute({
                    sql: "INSERT INTO users (name,email,password,role,school_id) VALUES (?,?,?,?,?)",
                    args: [fd.get('name') as string, fd.get('email') as string, fd.get('password') as string, role, school_id]
                });
                toast.success("User created");
            }
            setIsUserOpen(false);
            setEditUser(null);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save user");
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (id === user.id) { toast.error("Cannot delete yourself"); return; }
        if (!confirm("Delete this user?")) return;
        try {
            await db.execute({ sql: "DELETE FROM users WHERE id=?", args: [id] });
            toast.success("User deleted");
            fetchData();
        } catch { toast.error("Failed"); }
    };

    const handleSaveYear = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const start = fd.get('start_date') as string;
        const end = fd.get('end_date') as string;
        const type = fd.get('type') as string;
        const is_active = fd.get('is_active') === 'on' ? 1 : 0;

        try {
            if (is_active === 1) {
                // Deactivate others of same type
                await db.execute({ sql: "UPDATE academic_years SET is_active=0 WHERE type=?", args: [type] });
            }

            if (editYear) {
                await db.execute({
                    sql: "UPDATE academic_years SET name=?, start_date=?, end_date=?, type=?, is_active=? WHERE id=?",
                    args: [name, start, end, type, is_active, editYear.id]
                });
                toast.success("Academic year updated");
            } else {
                await db.execute({
                    sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
                    args: [name, start, end, type, is_active]
                });
                toast.success("Academic year created");
            }
            setIsYearOpen(false);
            setEditYear(null);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save academic year");
        }
    };

    const handleDeleteYear = async (id: number) => {
        if (!confirm("Delete this academic year?")) return;
        try {
            await db.execute({ sql: "DELETE FROM academic_years WHERE id=?", args: [id] });
            toast.success("Deleted");
            fetchData();
        } catch { toast.error("Failed"); }
    };

    const roleColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-violet-100 text-violet-700';
            case 'admin': return 'bg-blue-100 text-blue-700';
            case 'principal': return 'bg-green-100 text-green-700';
            case 'teacher': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const schoolName = (id: number | null) =>
        id ? (schools.find(s => s.id === id)?.name ?? `School #${id}`) : '—';

    // Group users by school
    const usersBySchool = schools.map(sc => ({
        school: sc,
        members: users.filter(u => u.school_id === sc.id)
    }));
    const unassigned = users.filter(u => u.school_id === null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 text-white">
            {/* ── Header ── */}
            <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight">The First Step</span>
                            <span className="ml-2 text-xs bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full font-medium uppercase tracking-widest">
                                Super Admin
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                            <span className="text-sm text-white/90 hidden md:block">{user.name}</span>
                            <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                                <button 
                                    onClick={() => { setActiveTab("settings"); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <SettingsIcon className="h-4 w-4" /> Settings
                                </button>
                                <div className="h-px bg-white/10 my-1"></div>
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto gap-1 flex-wrap">
                        {[
                            { value: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
                            { value: "schools", label: "Schools", icon: <Building2 className="h-4 w-4" /> },
                            { value: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
                            { value: "reports", label: "Reports", icon: <GraduationCap className="h-4 w-4" /> },
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex-1 min-w-fit gap-1.5 text-white/60 data-[state=active]:text-white data-[state=active]:bg-violet-600"
                            >
                                {tab.icon}{tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* ══════════════════ OVERVIEW ══════════════════ */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Network Overview</h2>
                                <p className="text-white/50 text-sm">Combined stats across all schools</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/50">Academic Year:</span>
                                <select className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500" value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
                                    {academicYears.filter(y => y.type === 'normal').map(y => (
                                        <option key={y.id} value={y.id.toString()} className="text-slate-900">{y.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Schools", value: stats.schools, icon: <Building2 className="h-6 w-6" />, color: "from-violet-600 to-violet-800" },
                                { label: "System Users", value: stats.users, icon: <Users className="h-6 w-6" />, color: "from-blue-600 to-blue-800" },
                                { label: "Applications", value: stats.applications, icon: <GraduationCap className="h-6 w-6" />, color: "from-emerald-600 to-emerald-800" },
                                { label: "Staff Members", value: users.filter(u => ['teacher', 'principal', 'admin'].includes(u.role)).length, icon: <Briefcase className="h-6 w-6" />, color: "from-orange-600 to-orange-800" },
                            ].map(kpi => (
                                <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.color} border-none text-white shadow-xl`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white/70 text-xs uppercase tracking-wider">{kpi.label}</span>
                                            <div className="text-white/40">{kpi.icon}</div>
                                        </div>
                                        <div className="text-4xl font-bold">{kpi.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Schools Summary Grid */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-white/80">Schools at a Glance</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {schools.map(sc => {
                                    const members = users.filter(u => u.school_id === sc.id);
                                    const admin = members.find(u => u.role === 'admin');
                                    const principal = members.find(u => u.role === 'principal');
                                    return (
                                        <Card key={sc.id} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                                        <School className="h-5 w-5 text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base text-white">{sc.name}</CardTitle>
                                                        <CardDescription className="text-white/40 text-xs">{sc.branch_code}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-1 text-sm text-white/60">
                                                {sc.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{sc.address}</p>}
                                                {sc.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{sc.phone}</p>}
                                                <div className="pt-2 flex flex-wrap gap-2">
                                                    {admin && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Admin: {admin.name}</span>}
                                                    {principal && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Principal: {principal.name}</span>}
                                                    <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{members.length} users</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                {schools.length === 0 && (
                                    <div className="col-span-3 text-center text-white/40 py-8">No schools yet. Create one in the Schools tab.</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ══════════════════ SCHOOLS ══════════════════ */}
                    <TabsContent value="schools" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Schools</h2>
                                <p className="text-white/50 text-sm">{schools.length} branch(es) registered</p>
                            </div>
                            <Dialog open={isSchoolOpen} onOpenChange={(o) => { setIsSchoolOpen(o); if (!o) setEditSchool(null); }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                                        <Plus className="h-4 w-4" /> New School
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{editSchool ? "Edit School" : "Create New School"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveSchool} className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <Label>School Name *</Label>
                                            <Input name="name" defaultValue={editSchool?.name} placeholder="The First Step – Branch 2" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Branch Code *</Label>
                                            <Input name="branch_code" defaultValue={editSchool?.branch_code} placeholder="TFS-BN-02" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input name="address" defaultValue={editSchool?.address ?? ""} placeholder="Full address" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input name="phone" defaultValue={editSchool?.phone ?? ""} placeholder="+91 ..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input name="email" type="email" defaultValue={editSchool?.email ?? ""} placeholder="branch@..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                                                {editSchool ? "Save Changes" : "Create School"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {schools.map(sc => {
                                const members = users.filter(u => u.school_id === sc.id);
                                const admin = members.find(u => u.role === 'admin');
                                const principal = members.find(u => u.role === 'principal');
                                return (
                                    <Card key={sc.id} className="bg-white/5 border border-white/10 text-white group">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-11 w-11 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                                        <School className="h-5 w-5 text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-white text-base">{sc.name}</CardTitle>
                                                        <CardDescription className="text-white/40 text-xs">{sc.branch_code}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon" variant="ghost"
                                                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                                        onClick={() => { setEditSchool(sc); setIsSchoolOpen(true); }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon" variant="ghost"
                                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        onClick={() => handleDeleteSchool(sc.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/50">
                                                {sc.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{sc.address}</span>}
                                                {sc.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{sc.phone}</span>}
                                                {sc.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{sc.email}</span>}
                                            </div>
                                            <div className="border-t border-white/10 pt-3">
                                                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Assigned Staff</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {admin
                                                        ? <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">Admin: {admin.name}</span>
                                                        : <span className="text-xs bg-white/5 text-white/30 px-2 py-1 rounded-lg">No Admin assigned</span>}
                                                    {principal
                                                        ? <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-lg">Principal: {principal.name}</span>
                                                        : <span className="text-xs bg-white/5 text-white/30 px-2 py-1 rounded-lg">No Principal assigned</span>}
                                                </div>
                                                <p className="text-xs text-white/30 mt-2">{members.length} total user(s)</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {schools.length === 0 && (
                                <div className="col-span-2 rounded-xl border border-dashed border-white/10 p-12 text-center text-white/30">
                                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p>No schools yet. Click "New School" to get started.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ══════════════════ USERS ══════════════════ */}
                    <TabsContent value="users" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Users</h2>
                                <p className="text-white/50 text-sm">{users.length} users across all schools</p>
                            </div>
                            <Dialog open={isUserOpen} onOpenChange={(o) => { setIsUserOpen(o); if (!o) setEditUser(null); }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                                        <UserCog className="h-4 w-4" /> New User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{editUser ? "Edit User" : "Create New User"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveUser} className="space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label>Full Name *</Label>
                                                <Input name="name" defaultValue={editUser?.name} required />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Email *</Label>
                                                <Input name="email" type="email" defaultValue={editUser?.email} required />
                                            </div>
                                            {!editUser && (
                                                <div className="space-y-2 col-span-2">
                                                    <Label>Password *</Label>
                                                    <Input name="password" required />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label>Role *</Label>
                                                <Select name="role" defaultValue={editUser?.role ?? "teacher"}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="principal">Principal</SelectItem>
                                                        <SelectItem value="teacher">Teacher</SelectItem>
                                                        <SelectItem value="parent">Parent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Assign to School</Label>
                                                <Select name="school_id" defaultValue={editUser?.school_id?.toString() ?? ""}>
                                                    <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                                                    <SelectContent>
                                                        {schools.map(sc => (
                                                            <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                                                {editUser ? "Save Changes" : "Create User"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Users grouped by school */}
                        <div className="space-y-6">
                            {usersBySchool.map(({ school, members }) => (
                                <div key={school.id}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <School className="h-4 w-4 text-violet-400" />
                                        <h3 className="font-semibold text-white/80">{school.name}</h3>
                                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{members.length} users</span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {members.map(u => (
                                            <div
                                                key={u.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/8 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {u.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-white truncate">{u.name}</p>
                                                        <p className="text-xs text-white/40 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${roleColor(u.role)}`}>{u.role}</span>
                                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                                                            onClick={() => { setEditUser(u); setIsUserOpen(true); }}>
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                            onClick={() => handleDeleteUser(u.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="col-span-3 text-white/30 text-sm py-3 pl-2">No users assigned to this school yet.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {unassigned.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users className="h-4 w-4 text-white/40" />
                                        <h3 className="font-semibold text-white/50">Unassigned / Super Admins</h3>
                                        <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{unassigned.length}</span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {unassigned.map(u => (
                                            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                                                <div className="h-9 w-9 rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-sm text-violet-300 shrink-0">
                                                    {u.name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-white truncate">{u.name}</p>
                                                    <p className="text-xs text-white/40 truncate">{u.email}</p>
                                                </div>
                                                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${roleColor(u.role)}`}>{u.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ══════════════════ REPORTS ══════════════════ */}
                    <TabsContent value="reports" className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">Reports</h2>
                                <p className="text-white/50 text-sm">View financial and operations reports</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-white/60">School:</span>
                                <Select value={selectedSchoolReport} onValueChange={setSelectedSchoolReport}>
                                    <SelectTrigger className="w-52 bg-white/10 border-white/20 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">🌐 All Schools (Combined)</SelectItem>
                                        {schools.map(sc => (
                                            <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Combined view banner */}
                        {selectedSchoolReport === "all" && (
                            <div className="rounded-xl bg-violet-600/20 border border-violet-500/30 px-5 py-3 flex items-center gap-3 text-violet-200">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p className="text-sm">Showing <strong>combined view</strong> — data from all schools merged into one report.</p>
                            </div>
                        )}
                        {selectedSchoolReport !== "all" && (
                            <div className="rounded-xl bg-blue-600/20 border border-blue-500/30 px-5 py-3 flex items-center gap-3 text-blue-200">
                                <School className="h-5 w-5 shrink-0" />
                                <p className="text-sm">Showing data for: <strong>{schoolName(Number(selectedSchoolReport))}</strong></p>
                            </div>
                        )}

                        {/* Report sub-tabs */}
                        <div className="bg-white rounded-xl p-1 shadow-xl">
                            <Tabs defaultValue="r-summary">
                                <TabsList className="w-full h-auto flex-wrap gap-0.5 bg-transparent">
                                    {[
                                        { v: "r-summary", label: "Summary", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                                        { v: "r-expenditure", label: "Expenditure", icon: <Receipt className="h-3.5 w-3.5" /> },
                                        { v: "r-admissions", label: "Admissions", icon: <GraduationCap className="h-3.5 w-3.5" /> },
                                        { v: "r-salaries", label: "Salaries", icon: <IndianRupee className="h-3.5 w-3.5" /> },
                                        { v: "r-employees", label: "Employees", icon: <Briefcase className="h-3.5 w-3.5" /> },
                                        { v: "r-investment", label: "Investment", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                                        { v: "r-summercamp", label: "Summer Camp", icon: <Sun className="h-3.5 w-3.5" /> },
                                        { v: "r-enquiries", label: "Enquiries", icon: <MessageSquare className="h-3.5 w-3.5" /> },
                                    ].map(t => (
                                        <TabsTrigger key={t.v} value={t.v} className="flex-1 min-w-fit gap-1 text-xs">
                                            {t.icon}{t.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="pt-2">
                                    <TabsContent value="r-summary"><ReportsTab /></TabsContent>
                                    <TabsContent value="r-expenditure"><ExpenditureTab /></TabsContent>
                                    <TabsContent value="r-admissions"><AdmissionsTab /></TabsContent>
                                    <TabsContent value="r-salaries"><SalariesTab /></TabsContent>
                                    <TabsContent value="r-employees"><EmployeesTab /></TabsContent>
                                    <TabsContent value="r-investment"><InvestmentTab /></TabsContent>
                                    <TabsContent value="r-summercamp"><SummerCampTab /></TabsContent>
                                    <TabsContent value="r-enquiries"><EnquiriesTab /></TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </TabsContent>

                    {/* ══════════════════ SETTINGS ══════════════════ */}
                    <TabsContent value="settings" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Academic Years</h2>
                                <p className="text-white/50 text-sm">Configure normal and summer camp cycles</p>
                            </div>
                            <Dialog open={isYearOpen} onOpenChange={(o) => { setIsYearOpen(o); if (!o) setEditYear(null); }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                                        <Plus className="h-4 w-4" /> New Cycle
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{editYear ? "Edit Cycle" : "Create New Cycle"}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveYear} className="space-y-4 pt-2 text-white">
                                        <div className="space-y-2">
                                            <Label>Cycle Name *</Label>
                                            <Input name="name" defaultValue={editYear?.name} placeholder="e.g. 2026-2027" required className="text-slate-900" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Start Date *</Label>
                                                <Input name="start_date" type="date" defaultValue={editYear?.start_date} required className="text-slate-900" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date *</Label>
                                                <Input name="end_date" type="date" defaultValue={editYear?.end_date} required className="text-slate-900" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type *</Label>
                                            <Select name="type" defaultValue={editYear?.type ?? "normal"}>
                                                <SelectTrigger className="text-slate-900"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal Academic Year</SelectItem>
                                                    <SelectItem value="summer_camp">Summer Camp</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2 py-2">
                                            <input type="checkbox" name="is_active" id="is_active" defaultChecked={editYear?.is_active === 1} className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                                            <Label htmlFor="is_active">Set as Active Cycle</Label>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                                                {editYear ? "Save Changes" : "Create Cycle"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {academicYears.map(year => (
                                <Card key={year.id} className="bg-white/5 border border-white/10 text-white group shadow-lg hover:border-white/20 transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${year.type === 'summer_camp' ? 'bg-orange-500/20 text-orange-400' : 'bg-violet-500/20 text-violet-400'}`}>
                                                    {year.type === 'summer_camp' ? <Sun className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-white text-base flex items-center gap-2">
                                                        {year.name}
                                                        {year.is_active === 1 && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full uppercase font-bold">Active</span>}
                                                    </CardTitle>
                                                    <CardDescription className="text-white/40 text-xs">
                                                        {year.type === 'summer_camp' ? 'Summer Camp' : 'Normal Cycle'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                                    onClick={() => { setEditYear(year); setIsYearOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteYear(year.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm text-white/60">
                                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">Start Date</span>
                                                <span className="font-mono">{year.start_date}</span>
                                            </div>
                                            <div className="h-8 w-px bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">End Date</span>
                                                <span className="font-mono">{year.end_date}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {academicYears.length === 0 && (
                                <div className="col-span-2 rounded-xl border border-dashed border-white/10 p-12 text-center text-white/30">
                                    <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p>No academic cycles configured yet.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default SuperAdmin;
