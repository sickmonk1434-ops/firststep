import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface SummerCampRow {
    id: number;
    student_id: string;
    status: string;
    student_name: string;
    parent_name: string;
    phone: string;
    email: string;
    joining_date: string;
    end_date: string;
    admission_type: string;
    payment_period: string;
    fee_registered: number;
    paid: number;
    fee_balance: number;
    year: number;
}

const getCurrentAcademicYear = () => {
    const today = new Date();
    return today.getMonth() >= 3 ? today.getFullYear().toString() : (today.getFullYear() - 1).toString();
};

const emptyForm = () => ({
    student_id: "", status: "Active", student_name: "", parent_name: "", phone: "", email: "",
    joining_date: new Date().toISOString().split("T")[0], end_date: "",
    admission_type: "Summer Camp", payment_period: "Monthly",
    fee_registered: "", paid: "", fee_balance: "", year: getCurrentAcademicYear()
});

export default function SummerCampTab() {
    const [rows, setRows] = useState<SummerCampRow[]>([]);
    const [year, setYear] = useState(getCurrentAcademicYear());
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<SummerCampRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await db.execute({ sql: "SELECT * FROM summer_camp WHERE year=? ORDER BY student_id ASC", args: [parseInt(year)] });
            setRows(res.rows as unknown as SummerCampRow[]);
        } catch { toast.error("Failed to load summer camp data"); }
        finally { setLoading(false); }
    }, [year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = rows.filter(r =>
        r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.parent_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalFees = filtered.reduce((s, r) => s + (r.fee_registered || 0), 0);
    const totalPaid = filtered.reduce((s, r) => s + (r.paid || 0), 0);
    const totalBalance = filtered.reduce((s, r) => s + (r.fee_balance || 0), 0);

    const openEdit = (r: SummerCampRow) => {
        setEditRow(r);
        setForm({
            student_id: r.student_id || "", status: r.status || "Active", student_name: r.student_name || "",
            parent_name: r.parent_name || "", phone: r.phone || "", email: r.email || "",
            joining_date: r.joining_date || "", end_date: r.end_date || "",
            admission_type: r.admission_type || "Summer Camp", payment_period: r.payment_period || "Monthly",
            fee_registered: String(r.fee_registered || ""), paid: String(r.paid || ""), fee_balance: String(r.fee_balance || ""),
            year: String(r.year)
        });
    };

    const handleSave = async () => {
        if (!form.student_name) { toast.error("Student name is required"); return; }
        const args = [
            form.student_id, form.status, form.student_name, form.parent_name, form.phone, form.email,
            form.joining_date, form.end_date, form.admission_type, form.payment_period,
            parseFloat(form.fee_registered) || 0, parseFloat(form.paid) || 0, parseFloat(form.fee_balance) || 0, parseInt(form.year) || parseInt(getCurrentAcademicYear())
        ];
        try {
            if (editRow) {
                await db.execute({ sql: "UPDATE summer_camp SET student_id=?,status=?,student_name=?,parent_name=?,phone=?,email=?,joining_date=?,end_date=?,admission_type=?,payment_period=?,fee_registered=?,paid=?,fee_balance=?,year=? WHERE id=?", args: [...args, editRow.id] });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({ sql: "INSERT INTO summer_camp (student_id,status,student_name,parent_name,phone,email,joining_date,end_date,admission_type,payment_period,fee_registered,paid,fee_balance,year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", args });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this student?")) return;
        try { await db.execute({ sql: "DELETE FROM summer_camp WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Student ID</Label><Input value={form.student_id} onChange={f("student_id")} placeholder="TFS-BN-S000001" /></div>
                <div><Label>Year</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.year} onChange={f("year")}>
                        <option value="2026">2026-2027</option><option value="2025">2025-2026</option><option value="2024">2024-2025</option><option value="2023">2023-2024</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Student Name*</Label><Input value={form.student_name} onChange={f("student_name")} /></div>
                <div><Label>Status</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.status} onChange={f("status")}>
                        <option>Active</option><option>Closed</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Parent Name</Label><Input value={form.parent_name} onChange={f("parent_name")} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={f("joining_date")} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={f("end_date")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Payment Period</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.payment_period} onChange={f("payment_period")}>
                        <option>Monthly</option><option>Full</option>
                    </select>
                </div>
                <div><Label>Admission Type</Label><Input value={form.admission_type} onChange={f("admission_type")} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div><Label>Fee Registered</Label><Input type="number" value={form.fee_registered} onChange={f("fee_registered")} /></div>
                <div><Label>Paid</Label><Input type="number" value={form.paid} onChange={f("paid")} /></div>
                <div><Label>Balance</Label><Input type="number" value={form.fee_balance} onChange={f("fee_balance")} /></div>
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Summer Camp</CardTitle>
                    <CardDescription>Summer camp enrollments for {year}-{parseInt(year) + 1}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2026">2026-2027</option><option value="2025">2025-2026</option><option value="2024">2024-2025</option><option value="2023">2023-2024</option>
                    </select>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button size="sm" onClick={() => { setForm({ ...emptyForm(), year }); setIsAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Student</Button></DialogTrigger>
                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add Summer Camp Student</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><p className="text-xs text-blue-500 font-medium">Students</p><p className="text-xl font-bold text-blue-700">{filtered.length}</p></div>
                    <div className="bg-primary/10 rounded-lg p-3"><p className="text-xs text-primary font-medium">Fee Registered</p><p className="text-xl font-bold">₹{totalFees.toLocaleString("en-IN")}</p></div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3"><p className="text-xs text-green-500 font-medium">Total Paid</p><p className="text-xl font-bold text-green-700">₹{totalPaid.toLocaleString("en-IN")}</p></div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3"><p className="text-xs text-orange-500 font-medium">Balance</p><p className="text-xl font-bold text-orange-700">₹{totalBalance.toLocaleString("en-IN")}</p></div>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search student or parent…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>{["ID", "Status", "Student", "Parent", "Phone", "Joining", "Fee Reg", "Paid", "Balance", ""].map(h => <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : filtered.length === 0 ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{r.student_id}</td>
                                            <td className="px-3 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span></td>
                                            <td className="px-3 py-3 font-medium">{r.student_name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.parent_name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.phone}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{r.joining_date}</td>
                                            <td className="px-3 py-3 text-right">₹{(r.fee_registered || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-right text-green-700 font-semibold">₹{(r.paid || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-right text-orange-600">₹{(r.fee_balance || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Edit Summer Camp Student</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
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
