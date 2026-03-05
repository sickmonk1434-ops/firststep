import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface SalaryRow {
    id: number;
    type: string;
    staff_name: string;
    phone: string;
    working_month: string;
    salary_paid_date: string;
    salary_agreed: number;
    working_days: number;
    leaves: number;
    salary_to_pay: number;
    advance: number;
    salary_paid: number;
    status: string;
    remarks: string;
}

const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const TYPES = ["Principal", "Teaching Staff", "Care Taker staff", "Caretaker", "Non-Teaching", "Admin"];
const STATUSES = ["Paid", "Pending"];

const emptyForm = () => ({
    type: TYPES[0], staff_name: "", phone: "", working_month: "April", salary_paid_date: "",
    salary_agreed: "", working_days: "26", leaves: "0", salary_to_pay: "", advance: "0",
    salary_paid: "", status: "Pending", remarks: ""
});

export default function SalariesTab() {
    const [rows, setRows] = useState<SalaryRow[]>([]);
    const [monthFilter, setMonthFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<SalaryRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await db.execute("SELECT * FROM salaries ORDER BY rowid DESC LIMIT 500");
            setRows(res.rows as unknown as SalaryRow[]);
        } catch { toast.error("Failed to load salaries"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = rows.filter(r => {
        const matchMonth = monthFilter === "All" || r.working_month === monthFilter;
        const matchSearch = r.staff_name?.toLowerCase().includes(search.toLowerCase());
        return matchMonth && matchSearch;
    });

    const totalPaid = filtered.reduce((s, r) => s + (r.salary_paid || 0), 0);
    const paidCount = filtered.filter(r => r.status === "Paid").length;

    const openEdit = (r: SalaryRow) => {
        setEditRow(r);
        setForm({
            type: r.type || "", staff_name: r.staff_name || "", phone: r.phone || "",
            working_month: r.working_month || "", salary_paid_date: r.salary_paid_date || "",
            salary_agreed: String(r.salary_agreed || ""), working_days: String(r.working_days || ""),
            leaves: String(r.leaves || ""), salary_to_pay: String(r.salary_to_pay || ""),
            advance: String(r.advance || ""), salary_paid: String(r.salary_paid || ""),
            status: r.status || "Pending", remarks: r.remarks || ""
        });
    };

    const handleSave = async () => {
        if (!form.staff_name) { toast.error("Staff name is required"); return; }
        const args = [
            form.type, form.staff_name, form.phone, form.working_month, form.salary_paid_date,
            parseFloat(form.salary_agreed) || 0, parseInt(form.working_days) || 0, parseInt(form.leaves) || 0,
            parseFloat(form.salary_to_pay) || 0, parseFloat(form.advance) || 0, parseFloat(form.salary_paid) || 0,
            form.status, form.remarks
        ];
        try {
            if (editRow) {
                await db.execute({ sql: `UPDATE salaries SET type=?,staff_name=?,phone=?,working_month=?,salary_paid_date=?,salary_agreed=?,working_days=?,leaves=?,salary_to_pay=?,advance=?,salary_paid=?,status=?,remarks=? WHERE id=?`, args: [...args, editRow.id] });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({ sql: `INSERT INTO salaries (type,staff_name,phone,working_month,salary_paid_date,salary_agreed,working_days,leaves,salary_to_pay,advance,salary_paid,status,remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this salary record?")) return;
        try { await db.execute({ sql: "DELETE FROM salaries WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.type} onChange={f("type")}>
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div><Label>Status</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.status} onChange={f("status")}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Staff Name*</Label><Input value={form.staff_name} onChange={f("staff_name")} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Working Month</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.working_month} onChange={f("working_month")}>
                        {MONTHS.map(m => <option key={m}>{m}</option>)}
                    </select>
                </div>
                <div><Label>Paid Date</Label><Input type="date" value={form.salary_paid_date} onChange={f("salary_paid_date")} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div><Label>Agreed (₹)</Label><Input type="number" value={form.salary_agreed} onChange={f("salary_agreed")} /></div>
                <div><Label>Working Days</Label><Input type="number" value={form.working_days} onChange={f("working_days")} /></div>
                <div><Label>Leaves</Label><Input type="number" value={form.leaves} onChange={f("leaves")} /></div>
                <div><Label>To Pay (₹)</Label><Input type="number" value={form.salary_to_pay} onChange={f("salary_to_pay")} /></div>
                <div><Label>Advance (₹)</Label><Input type="number" value={form.advance} onChange={f("advance")} /></div>
                <div><Label>Paid (₹)</Label><Input type="number" value={form.salary_paid} onChange={f("salary_paid")} /></div>
            </div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={f("remarks")} /></div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Salaries</CardTitle>
                    <CardDescription>Staff salary payment records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                        <option value="All">All Months</option>
                        {MONTHS.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button size="sm" onClick={() => { setForm(emptyForm()); setIsAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Record</Button></DialogTrigger>
                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add Salary Record</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3"><p className="text-xs text-green-500 font-medium">Total Paid (filtered)</p><p className="text-xl font-bold text-green-700">₹{totalPaid.toLocaleString("en-IN")}</p></div>
                    <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground font-medium">Records</p><p className="text-xl font-bold">{filtered.length}</p></div>
                    <div className="bg-primary/10 rounded-lg p-3"><p className="text-xs text-primary font-medium">Paid Entries</p><p className="text-xl font-bold">{paidCount}</p></div>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search staff name…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>{["Type", "Staff Name", "Month", "Agreed", "Days", "To Pay", "Paid", "Status", "Remarks", ""].map(h => <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : filtered.length === 0 ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-3"><span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.type}</span></td>
                                            <td className="px-3 py-3 font-medium">{r.staff_name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.working_month}</td>
                                            <td className="px-3 py-3 text-right">₹{(r.salary_agreed || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-center">{r.working_days}</td>
                                            <td className="px-3 py-3 text-right">₹{(r.salary_to_pay || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3 text-right text-green-700 font-semibold">₹{(r.salary_paid || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${r.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span></td>
                                            <td className="px-3 py-3 text-muted-foreground text-xs max-w-[120px] truncate">{r.remarks}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Edit Salary</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
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
