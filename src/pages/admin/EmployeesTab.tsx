import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface EmployeeRow {
    id: number;
    emp_no: string;
    type: string;
    status: string;
    name: string;
    phone: string;
    address: string;
    joining_date: string;
    end_date: string;
    salary_agreed: number;
}

const EMP_TYPES = ["Principal", "Teaching Staff", "Care Taker staff", "Caretaker", "Correspondent", "Managing Director", "Non-Teaching", "Admin"];
const EMP_STATUSES = ["Active", "Closed"];

const emptyForm = () => ({
    emp_no: "", type: "Teaching Staff", status: "Active", name: "", phone: "", address: "",
    joining_date: new Date().toISOString().split("T")[0], end_date: "", salary_agreed: ""
});

export default function EmployeesTab() {
    const [rows, setRows] = useState<EmployeeRow[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<EmployeeRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await db.execute("SELECT * FROM employees ORDER BY emp_no ASC");
            setRows(res.rows as unknown as EmployeeRow[]);
        } catch { toast.error("Failed to load employees"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = rows.filter(r => {
        const matchStatus = statusFilter === "All" || r.status === statusFilter;
        const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || r.emp_no?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const activeCount = filtered.filter(r => r.status === "Active").length;
    const totalSalaryBudget = rows.filter(r => r.status === "Active").reduce((s, r) => s + (r.salary_agreed || 0), 0);

    const openEdit = (r: EmployeeRow) => {
        setEditRow(r);
        setForm({ emp_no: r.emp_no || "", type: r.type || "", status: r.status || "Active", name: r.name || "", phone: r.phone || "", address: r.address || "", joining_date: r.joining_date || "", end_date: r.end_date || "", salary_agreed: String(r.salary_agreed || "") });
    };

    const handleSave = async () => {
        if (!form.name) { toast.error("Name is required"); return; }
        const args = [form.emp_no, form.type, form.status, form.name, form.phone, form.address, form.joining_date, form.end_date, parseFloat(form.salary_agreed) || 0];
        try {
            if (editRow) {
                await db.execute({ sql: "UPDATE employees SET emp_no=?,type=?,status=?,name=?,phone=?,address=?,joining_date=?,end_date=?,salary_agreed=? WHERE id=?", args: [...args, editRow.id] });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({ sql: "INSERT INTO employees (emp_no,type,status,name,phone,address,joining_date,end_date,salary_agreed) VALUES (?,?,?,?,?,?,?,?,?)", args });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this employee record?")) return;
        try { await db.execute({ sql: "DELETE FROM employees WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Employee No</Label><Input value={form.emp_no} onChange={f("emp_no")} placeholder="TFS-BN-0001" /></div>
                <div><Label>Type</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.type} onChange={f("type")}>
                        {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name*</Label><Input value={form.name} onChange={f("name")} /></div>
                <div><Label>Status</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.status} onChange={f("status")}>
                        {EMP_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} /></div>
                <div><Label>Salary Agreed (₹/mo)</Label><Input type="number" value={form.salary_agreed} onChange={f("salary_agreed")} /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={f("address")} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={f("joining_date")} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={f("end_date")} /></div>
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>All staff and employee records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        {EMP_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button size="sm" onClick={() => { setForm(emptyForm()); setIsAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Employee</Button></DialogTrigger>
                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3"><p className="text-xs text-green-500 font-medium">Active Staff</p><p className="text-xl font-bold text-green-700">{activeCount}</p></div>
                    <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground font-medium">Total Records</p><p className="text-xl font-bold">{rows.length}</p></div>
                    <div className="bg-primary/10 rounded-lg p-3"><p className="text-xs text-primary font-medium">Monthly Salary Budget</p><p className="text-xl font-bold">₹{totalSalaryBudget.toLocaleString("en-IN")}</p></div>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search name or employee number…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>{["Emp No", "Type", "Status", "Name", "Phone", "Address", "Joining", "End Date", "Salary/mo", ""].map(h => <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : filtered.length === 0 ? <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{r.emp_no}</td>
                                            <td className="px-3 py-3"><span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.type}</span></td>
                                            <td className="px-3 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${r.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span></td>
                                            <td className="px-3 py-3 font-medium">{r.name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.phone}</td>
                                            <td className="px-3 py-3 text-muted-foreground text-xs max-w-[130px] truncate">{r.address}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{r.joining_date}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{r.end_date || "—"}</td>
                                            <td className="px-3 py-3 text-right font-semibold">₹{(r.salary_agreed || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
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
