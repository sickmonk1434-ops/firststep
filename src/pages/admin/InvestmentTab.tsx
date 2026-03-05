import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InvestmentRow {
    id: number;
    sno: number;
    date: string;
    investor: string;
    amount: number;
    remarks: string;
}

const emptyForm = () => ({
    sno: "", date: new Date().toISOString().split("T")[0], investor: "", amount: "", remarks: ""
});

export default function InvestmentTab() {
    const [rows, setRows] = useState<InvestmentRow[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editRow, setEditRow] = useState<InvestmentRow | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await db.execute("SELECT * FROM investments ORDER BY sno ASC");
            setRows(res.rows as unknown as InvestmentRow[]);
        } catch { toast.error("Failed to load investments"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const totalInvested = rows.reduce((s, r) => s + (r.amount || 0), 0);

    // Group by investor for summary
    const byInvestor = rows.reduce<Record<string, number>>((acc, r) => {
        const key = r.investor || "—";
        acc[key] = (acc[key] || 0) + (r.amount || 0);
        return acc;
    }, {});

    const openEdit = (r: InvestmentRow) => {
        setEditRow(r);
        setForm({ sno: String(r.sno || ""), date: r.date || "", investor: r.investor || "", amount: String(r.amount || ""), remarks: r.remarks || "" });
    };

    const handleSave = async () => {
        if (!form.investor) { toast.error("Investor name is required"); return; }
        const args = [parseInt(form.sno) || 0, form.date, form.investor, parseFloat(form.amount) || 0, form.remarks];
        try {
            if (editRow) {
                await db.execute({ sql: "UPDATE investments SET sno=?,date=?,investor=?,amount=?,remarks=? WHERE id=?", args: [...args, editRow.id] });
                setEditRow(null); toast.success("Updated");
            } else {
                await db.execute({ sql: "INSERT INTO investments (sno,date,investor,amount,remarks) VALUES (?,?,?,?,?)", args });
                setIsAddOpen(false); toast.success("Added");
            }
            fetchData();
        } catch { toast.error("Save failed"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this investment record?")) return;
        try { await db.execute({ sql: "DELETE FROM investments WHERE id=?", args: [id] }); toast.success("Deleted"); fetchData(); }
        catch { toast.error("Delete failed"); }
    };

    const FormFields = () => (
        <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>S.No</Label><Input type="number" value={form.sno} onChange={f("sno")} /></div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={f("date")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Investor Name*</Label><Input value={form.investor} onChange={f("investor")} /></div>
                <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={f("amount")} /></div>
            </div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={f("remarks")} /></div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Investment</CardTitle>
                    <CardDescription>Investor contributions and tracks</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button size="sm" onClick={() => { setForm(emptyForm()); setIsAddOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Investment</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Save</Button></DialogFooter></DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {/* Investor summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-primary/10 rounded-lg p-3 col-span-2 md:col-span-1">
                        <p className="text-xs text-primary font-medium">Total Invested</p>
                        <p className="text-xl font-bold">₹{totalInvested.toLocaleString("en-IN")}</p>
                    </div>
                    {Object.entries(byInvestor).map(([inv, amt]) => (
                        <div key={inv} className="bg-muted rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-medium capitalize">{inv}</p>
                            <p className="text-xl font-bold">₹{(amt as number).toLocaleString("en-IN")}</p>
                        </div>
                    ))}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>{["#", "Date", "Investor", "Amount", "Remarks", ""].map(h => <th key={h} className="px-4 py-3 font-semibold text-left whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                                : rows.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                                    : rows.map(r => (
                                        <tr key={r.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3 text-muted-foreground">{r.sno}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{r.date || "—"}</td>
                                            <td className="px-4 py-3 font-medium capitalize">{r.investor}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-700">₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{r.remarks}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Dialog open={editRow?.id === r.id} onOpenChange={o => { if (!o) setEditRow(null); }}>
                                                        <DialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                                                        <DialogContent><DialogHeader><DialogTitle>Edit Investment</DialogTitle></DialogHeader><FormFields /><DialogFooter className="pt-2"><Button className="w-full" onClick={handleSave}>Update</Button></DialogFooter></DialogContent>
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
