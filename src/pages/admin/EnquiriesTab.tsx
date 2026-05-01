import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface EnquiryRow {
    id: number;
    timestamp: string;
    name: string;
    phone: string;
    email: string;
    student_age: string;
    interested_class: string;
    address: string;
    remarks: string;
}

const emptyForm = () => ({
    timestamp: new Date().toISOString().split("T")[0], name: "", phone: "", email: "",
    student_age: "", interested_class: "", address: "", remarks: ""
});

const getCurrentAcademicYear = () => {
    const today = new Date();
    return today.getMonth() >= 3 ? today.getFullYear().toString() : (today.getFullYear() - 1).toString();
};

export default function EnquiriesTab() {
    const [rows, setRows] = useState<EnquiryRow[]>([]);
    const [year, setYear] = useState(getCurrentAcademicYear());
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<EnquiryRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = `${year}-04-01`;
            const endDate = `${parseInt(year) + 1}-03-31`;
            const res = await db.execute({
                sql: "SELECT * FROM enquiries WHERE timestamp >= ? AND timestamp <= ? ORDER BY id DESC",
                args: [startDate, endDate]
            });
            setRows(res.rows as unknown as EnquiryRow[]);
        } catch { toast.error("Failed to load enquiries"); }
        finally { setLoading(false); }
    }, [year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const filtered = rows.filter(r =>
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search) ||
        r.interested_class?.toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (r: EnquiryRow) => {
        setEditRow(r);
        setForm({ timestamp: r.timestamp || "", name: r.name || "", phone: r.phone || "", email: r.email || "", student_age: r.student_age || "", interested_class: r.interested_class || "", address: r.address || "", remarks: r.remarks || "" });
    };

    const handleSave = async () => {
        if (!form.name) { toast.error("Name is required"); return; }
        const args = [form.timestamp, form.name, form.phone, form.email, form.student_age, form.interested_class, form.address, form.remarks];
        try {
            if (editRow) {
                await db.execute({ sql: "UPDATE enquiries SET timestamp=?,name=?,phone=?,email=?,student_age=?,interested_class=?,address=?,remarks=? WHERE id=?", args: [...args, editRow.id] });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({ sql: "INSERT INTO enquiries (timestamp,name,phone,email,student_age,interested_class,address,remarks) VALUES (?,?,?,?,?,?,?,?)", args });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this enquiry?")) return;
        try { await db.execute({ sql: "DELETE FROM enquiries WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.timestamp} onChange={f("timestamp")} /></div>
                <div><Label>Name*</Label><Input value={form.name} onChange={f("name")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={f("phone")} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={f("email")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Student Age</Label><Input value={form.student_age} onChange={f("student_age")} placeholder="e.g. 3 Years" /></div>
                <div><Label>Interested Class</Label><Input value={form.interested_class} onChange={f("interested_class")} placeholder="e.g. Nursery" /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={f("address")} /></div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={f("remarks")} /></div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Preschool Enquiries</CardTitle>
                    <CardDescription>Incoming enquiries and leads for {year}-{parseInt(year) + 1}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2026">2026-2027</option>
                        <option value="2025">2025-2026</option>
                        <option value="2024">2024-2025</option>
                        <option value="2023">2023-2024</option>
                    </select>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button size="sm" onClick={() => { setForm(emptyForm()); setIsAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Enquiry</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Add Enquiry</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-primary/10 rounded-lg p-3"><p className="text-xs text-primary font-medium">Total Enquiries</p><p className="text-xl font-bold">{rows.length}</p></div>
                    <div className="bg-muted rounded-lg p-3"><p className="text-xs text-muted-foreground font-medium">Filtered</p><p className="text-xl font-bold">{filtered.length}</p></div>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search name, phone or class…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>{["Date", "Name", "Phone", "Email", "Age", "Class", "Address", "Remarks", ""].map(h => <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">No enquiries found</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-3 text-xs text-muted-foreground">{r.timestamp}</td>
                                            <td className="px-3 py-3 font-medium">{r.name}</td>
                                            <td className="px-3 py-3 text-muted-foreground">{r.phone}</td>
                                            <td className="px-3 py-3 text-muted-foreground text-xs">{r.email}</td>
                                            <td className="px-3 py-3 text-xs">{r.student_age}</td>
                                            <td className="px-3 py-3 text-xs"><span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r.interested_class}</span></td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.address}</td>
                                            <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{r.remarks}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent><DialogHeader><DialogTitle>Edit Enquiry</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
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
