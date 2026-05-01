import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface AdmissionRow {
    id: number;
    student_id: string;
    class: string;
    status: string;
    student_name: string;
    parent_name: string;
    primary_phone: string;
    alternate_phone: string;
    email: string;
    join_date: string;
    end_date: string;
    fee_registered: number;
    book_fee: number;
    admission_fee: number;
    term1: number;
    term2: number;
    term3: number;
    others: number;
    total_paid: number;
    fee_balance: number;
    followup: string;
    year: number;
}

const CLASSES = ["Play Group", "Nursery", "LKG", "UKG", "nursery"];
const STATUSES = ["Active", "Closed"];

const getCurrentAcademicYear = () => {
    const today = new Date();
    return today.getMonth() >= 3 ? today.getFullYear().toString() : (today.getFullYear() - 1).toString();
};

const emptyForm = () => ({
    student_id: "", class: "Nursery", status: "Active",
    student_name: "", parent_name: "", primary_phone: "", alternate_phone: "", email: "",
    join_date: new Date().toISOString().split("T")[0], end_date: "",
    fee_registered: "", book_fee: "", admission_fee: "", term1: "", term2: "", term3: "", others: "",
    total_paid: "", fee_balance: "", followup: "", year: getCurrentAcademicYear()
});

export default function AdmissionsTab() {
    const [rows, setRows] = useState<AdmissionRow[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [yearId, setYearId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<AdmissionRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

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
        } catch { toast.error("Failed to load academic cycles"); }
    }, []);

    const fetchData = useCallback(async () => {
        if (!yearId) return;
        setLoading(true);
        try {
            const currentYear = academicYears.find(y => y.id.toString() === yearId);
            if (!currentYear) return;

            // We filter by join_date range to be consistent with other tabs
            const res = await db.execute({ 
                sql: "SELECT * FROM admissions WHERE join_date >= ? AND join_date <= ? ORDER BY student_id ASC", 
                args: [currentYear.start_date, currentYear.end_date] 
            });
            setRows(res.rows as unknown as AdmissionRow[]);
        } catch { toast.error("Failed to load admissions"); }
        finally { setLoading(false); }
    }, [yearId, academicYears]);

    useEffect(() => { fetchYears(); }, [fetchYears]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = rows.filter(r =>
        r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.parent_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalFees = filtered.reduce((s, r) => s + (r.total_paid || 0), 0);
    const totalBalance = filtered.reduce((s, r) => s + (r.fee_balance || 0), 0);
    const activeCount = filtered.filter(r => r.status === "Active").length;

    const openAdd = () => { setForm({ ...emptyForm(), year: yearId }); setIsAddOpen(true); };
    const openEdit = (r: AdmissionRow) => {
        setEditRow(r);
        setForm({
            student_id: r.student_id || "", class: r.class || "Nursery", status: r.status || "Active",
            student_name: r.student_name || "", parent_name: r.parent_name || "",
            primary_phone: r.primary_phone || "", alternate_phone: r.alternate_phone || "", email: r.email || "",
            join_date: r.join_date || "", end_date: r.end_date || "",
            fee_registered: String(r.fee_registered || ""), book_fee: String(r.book_fee || ""),
            admission_fee: String(r.admission_fee || ""), term1: String(r.term1 || ""),
            term2: String(r.term2 || ""), term3: String(r.term3 || ""), others: String(r.others || ""),
            total_paid: String(r.total_paid || ""), fee_balance: String(r.fee_balance || ""),
            followup: r.followup || "", year: String(r.year)
        });
    };

    const handleSave = async () => {
        if (!form.student_name) { toast.error("Student name is required"); return; }
        const args = [
            form.student_id, form.class, form.status, form.student_name, form.parent_name,
            form.primary_phone, form.alternate_phone, form.email, form.join_date, form.end_date,
            parseFloat(form.fee_registered) || 0, parseFloat(form.book_fee) || 0, parseFloat(form.admission_fee) || 0,
            parseFloat(form.term1) || 0, parseFloat(form.term2) || 0, parseFloat(form.term3) || 0,
            parseFloat(form.others) || 0, parseFloat(form.total_paid) || 0, parseFloat(form.fee_balance) || 0,
            form.followup, parseInt(form.year) || parseInt(getCurrentAcademicYear())
        ];
        try {
            if (editRow) {
                await db.execute({
                    sql: `UPDATE admissions SET student_id=?,class=?,status=?,student_name=?,parent_name=?,primary_phone=?,alternate_phone=?,email=?,join_date=?,end_date=?,fee_registered=?,book_fee=?,admission_fee=?,term1=?,term2=?,term3=?,others=?,total_paid=?,fee_balance=?,followup=?,year=? WHERE id=?`,
                    args: [...args, editRow.id]
                });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({
                    sql: `INSERT INTO admissions (student_id,class,status,student_name,parent_name,primary_phone,alternate_phone,email,join_date,end_date,fee_registered,book_fee,admission_fee,term1,term2,term3,others,total_paid,fee_balance,followup,year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    args
                });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this student record?")) return;
        try { await db.execute({ sql: "DELETE FROM admissions WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Student ID</Label><Input value={form.student_id} onChange={f("student_id")} placeholder="TFS-BN-A000001" /></div>
                <div><Label>Year (Auto)</Label>
                    <Input value={academicYears.find(y => y.id.toString() === yearId)?.name || "N/A"} disabled />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Class</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.class} onChange={f("class")}>
                        {CLASSES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div><Label>Status</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.status} onChange={f("status")}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div><Label>Student Name*</Label><Input value={form.student_name} onChange={f("student_name")} /></div>
            <div><Label>Parent Name</Label><Input value={form.parent_name} onChange={f("parent_name")} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Primary Phone</Label><Input value={form.primary_phone} onChange={f("primary_phone")} /></div>
                <div><Label>Alt Phone</Label><Input value={form.alternate_phone} onChange={f("alternate_phone")} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Join Date</Label><Input type="date" value={form.join_date} onChange={f("join_date")} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={f("end_date")} /></div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Fee Details (₹)</p>
            <div className="grid grid-cols-3 gap-2">
                <div><Label>Fee Registered</Label><Input type="number" value={form.fee_registered} onChange={f("fee_registered")} placeholder="0" /></div>
                <div><Label>Admission Fee</Label><Input type="number" value={form.admission_fee} onChange={f("admission_fee")} placeholder="0" /></div>
                <div><Label>Book Fee</Label><Input type="number" value={form.book_fee} onChange={f("book_fee")} placeholder="0" /></div>
                <div><Label>Term 1</Label><Input type="number" value={form.term1} onChange={f("term1")} placeholder="0" /></div>
                <div><Label>Term 2</Label><Input type="number" value={form.term2} onChange={f("term2")} placeholder="0" /></div>
                <div><Label>Term 3</Label><Input type="number" value={form.term3} onChange={f("term3")} placeholder="0" /></div>
                <div><Label>Others</Label><Input type="number" value={form.others} onChange={f("others")} placeholder="0" /></div>
                <div><Label>Total Paid</Label><Input type="number" value={form.total_paid} onChange={f("total_paid")} placeholder="0" /></div>
                <div><Label>Balance</Label><Input type="number" value={form.fee_balance} onChange={f("fee_balance")} placeholder="0" /></div>
            </div>
            <div><Label>Followup Note</Label><Input value={form.followup} onChange={f("followup")} placeholder="e.g. Fully Paid" /></div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Admissions</CardTitle>
                    <CardDescription>Student admission records for {academicYears.find(y => y.id.toString() === yearId)?.name || "Selected Period"}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={yearId} onChange={e => setYearId(e.target.value)}>
                        {academicYears.map(y => (
                            <option key={y.id} value={y.id.toString()}>{y.name}</option>
                        ))}
                    </select>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Student</Button></DialogTrigger>
                        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Add Admission</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><p className="text-xs text-blue-500 font-medium">Total Students</p><p className="text-xl font-bold text-blue-700">{filtered.length}</p></div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3"><p className="text-xs text-green-500 font-medium">Active</p><p className="text-xl font-bold text-green-700">{activeCount}</p></div>
                    <div className="bg-primary/10 rounded-lg p-3"><p className="text-xs text-primary font-medium">Fees Collected</p><p className="text-xl font-bold">₹{totalFees.toLocaleString("en-IN")}</p></div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3"><p className="text-xs text-orange-500 font-medium">Balance Pending</p><p className="text-xl font-bold text-orange-700">₹{totalBalance.toLocaleString("en-IN")}</p></div>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search student, parent name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                {["ID", "Class", "Status", "Student Name", "Parent", "Phone", "Join Date", "Fee Reg", "Total Paid", "Balance", "Followup", ""].map(h => (
                                    <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={12} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : filtered.length === 0 ? <tr><td colSpan={12} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{r.student_id}</td>
                                            <td className="px-3 py-3"><span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r.class}</span></td>
                                            <td className="px-3 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span></td>
                                            <td className="px-3 py-3 font-medium whitespace-nowrap">{r.student_name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.parent_name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.primary_phone}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{r.join_date}</td>
                                            <td className="px-3 py-3 text-right">₹{(r.fee_registered || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-right text-green-700 font-semibold">₹{(r.total_paid || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-right text-orange-600 font-semibold">₹{(r.fee_balance || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground max-w-[100px] truncate">{r.followup}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit Admission</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
                                                    </Dialog>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
