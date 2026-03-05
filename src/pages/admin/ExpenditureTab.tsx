import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface ExpenditureRow {
    id: number;
    date: string;
    category: string;
    description: string;
    type: string;
    amount: number;
    mode: string;
    remark: string;
    estimation: number;
}

const TYPES = [
    "Miscellaneous", "Office Infra", "POP (1500*Rs. 42)", "Wall painting (2300*47.5)",
    "Interlocking Mats (Rs. 90*225)", "Salaries", "Rent", "Utilities", "Other"
];

export default function ExpenditureTab() {
    const [rows, setRows] = useState<ExpenditureRow[]>([]);
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<ExpenditureRow | null>(null);
    const [form, setForm] = useState({ date: "", category: "", description: "", type: "", amount: "", mode: "Cash", remark: "", estimation: "" });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await db.execute("SELECT * FROM expenditure ORDER BY date DESC, id DESC LIMIT 500");
            setRows(res.rows as unknown as ExpenditureRow[]);
        } catch { toast.error("Failed to load expenditure data"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = rows.filter(r =>
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase())
    );

    const totalAmount = filtered.reduce((s, r) => s + (r.amount || 0), 0);

    const openAdd = () => {
        setForm({ date: new Date().toISOString().split("T")[0], category: "", description: "", type: TYPES[0], amount: "", mode: "Cash", remark: "", estimation: "" });
        setIsAddOpen(true);
    };

    const openEdit = (r: ExpenditureRow) => {
        setEditRow(r);
        setForm({
            date: r.date || "",
            category: r.category || "",
            description: r.description || "",
            type: r.type || "",
            amount: String(r.amount || 0),
            mode: r.mode || "Cash",
            remark: r.remark || "",
            estimation: String(r.estimation || 0)
        });
    };

    const handleSave = async () => {
        if (!form.description) { toast.error("Description is required"); return; }
        try {
            if (editRow) {
                await db.execute({
                    sql: "UPDATE expenditure SET date=?, category=?, description=?, type=?, amount=?, mode=?, remark=?, estimation=? WHERE id=?",
                    args: [form.date, form.category, form.description, form.type, parseFloat(form.amount) || 0, form.mode, form.remark, parseFloat(form.estimation) || 0, editRow.id]
                });
                setEditRow(null);
                toast.success("Updated");
            } else {
                await db.execute({
                    sql: "INSERT INTO expenditure (date, category, description, type, amount, mode, remark, estimation) VALUES (?,?,?,?,?,?,?,?)",
                    args: [form.date, form.category, form.description, form.type, parseFloat(form.amount) || 0, form.mode, form.remark, parseFloat(form.estimation) || 0]
                });
                setIsAddOpen(false);
                toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this entry?")) return;
        try {
            await db.execute({ sql: "DELETE FROM expenditure WHERE id=?", args: [id] });
            toast.success("Deleted");
            fetchData();
        } catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            </div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Setup, Admission" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Logo Designer" /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Mode</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="Online">Online</option>
                    </select>
                </div>
                <div><Label>Estimation (₹)</Label><Input type="number" value={form.estimation} onChange={e => setForm(f => ({ ...f, estimation: e.target.value }))} placeholder="0" /></div>
            </div>
            <div><Label>Remark</Label><Input value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} placeholder="Additional notes..." /></div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Expenditure</CardTitle>
                    <CardDescription>All school expense records</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Entry</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Expenditure</DialogTitle></DialogHeader>
                        <FormFields />
                        <DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="text-xs text-red-500 font-medium">Total (filtered)</p>
                        <p className="text-xl font-bold text-red-700">₹{totalAmount.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium">Records</p>
                        <p className="text-xl font-bold">{filtered.length}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search description or type…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-left">Date</th>
                                <th className="px-4 py-3 font-semibold text-left">Category</th>
                                <th className="px-4 py-3 font-semibold text-left">Description</th>
                                <th className="px-4 py-3 font-semibold text-left">Type/Mode</th>
                                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                <th className="px-4 py-3 font-semibold text-right">Estimation</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                            ) : filtered.map(r => (
                                <tr key={r.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.date || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{r.category || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3 font-medium max-w-[220px] truncate">
                                        {r.description}
                                        {r.remark && <p className="text-[10px] text-muted-foreground font-normal">{r.remark}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full w-fit">{r.type || "—"}</span>
                                            <span className="text-[10px] text-muted-foreground ml-1">{r.mode || "Cash"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-red-600">₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">₹{(r.estimation || 0).toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Dialog open={editRow?.id === r.id} onOpenChange={open => { if (!open) setEditRow(null); }}>
                                                <DialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>Edit Expenditure</DialogTitle></DialogHeader>
                                                    <FormFields />
                                                    <DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter>
                                                </DialogContent>
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
