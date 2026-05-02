import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Save, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface FeeDetailRow {
    id: number;
    student_name: string;
    parent_name: string;
    primary_phone: string;
    fee_registered: number;
    admission_fee: number;
    book_fee: number;
    total_paid: number;
    fee_balance: number;
    join_date: string;
    followup: string;
}

export default function FeeDetailsTab() {
    const [rows, setRows] = useState<FeeDetailRow[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [yearId, setYearId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingRemarks, setEditingRemarks] = useState<Record<number, string>>({});

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

            const res = await db.execute({
                sql: "SELECT id, student_name, parent_name, primary_phone, fee_registered, admission_fee, book_fee, total_paid, fee_balance, join_date, followup FROM admissions WHERE join_date >= ? AND join_date <= ? ORDER BY student_name ASC",
                args: [currentYear.start_date, currentYear.end_date]
            });
            setRows(res.rows as unknown as FeeDetailRow[]);
            // Initialize editing remarks from data
            const remarks: Record<number, string> = {};
            (res.rows as unknown as FeeDetailRow[]).forEach(r => {
                remarks[r.id] = r.followup || "";
            });
            setEditingRemarks(remarks);
        } catch { toast.error("Failed to load fee data"); }
        finally { setLoading(false); }
    }, [yearId, academicYears]);

    useEffect(() => { fetchYears(); }, [fetchYears]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = rows.filter(r =>
        r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.parent_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.primary_phone?.includes(search)
    );

    const totalFees = filtered.reduce((s, r) => s + ((r.fee_registered || 0) + (r.admission_fee || 0) + (r.book_fee || 0)), 0);
    const totalPaid = filtered.reduce((s, r) => s + (r.total_paid || 0), 0);
    const totalBalance = filtered.reduce((s, r) => s + (r.fee_balance || 0), 0);

    const handleSaveRemark = async (id: number) => {
        const remark = editingRemarks[id] || "";
        try {
            await db.execute({
                sql: "UPDATE admissions SET followup = ? WHERE id = ?",
                args: [remark, id]
            });
            toast.success("Remark saved");
            // Update local state
            setRows(prev => prev.map(r => r.id === id ? { ...r, followup: remark } : r));
        } catch {
            toast.error("Failed to save remark");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        Fee Details
                    </CardTitle>
                    <CardDescription>Student fee records with follow-up remarks for {academicYears.find(y => y.id.toString() === yearId)?.name || "Selected Period"}</CardDescription>
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
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs text-blue-500 font-medium">Total Students</p>
                        <p className="text-xl font-bold text-blue-700">{filtered.length}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-xs text-purple-500 font-medium">Total Fees (Reg+Adm+Book)</p>
                        <p className="text-xl font-bold text-purple-700">₹{totalFees.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-xs text-green-500 font-medium">Total Paid</p>
                        <p className="text-xl font-bold text-green-700">₹{totalPaid.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <p className="text-xs text-orange-500 font-medium">Balance Pending</p>
                        <p className="text-xl font-bold text-orange-700">₹{totalBalance.toLocaleString("en-IN")}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search student, parent name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                {["Student Name", "Parent Name", "Phone", "Total Fees", "Payment Date", "Mode", "Remarks on Follow Up", ""].map(h => (
                                    <th key={h} className="px-3 py-3 font-semibold text-left whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No records found</td></tr>
                            ) : filtered.map(r => {
                                const totalFee = (r.fee_registered || 0) + (r.admission_fee || 0) + (r.book_fee || 0);
                                return (
                                    <tr key={r.id} className="hover:bg-muted/20">
                                        <td className="px-3 py-3 font-medium whitespace-nowrap">{r.student_name}</td>
                                        <td className="px-3 py-3 text-muted-foreground">{r.parent_name || "—"}</td>
                                        <td className="px-3 py-3 text-muted-foreground">{r.primary_phone || "—"}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-purple-700">₹{totalFee.toLocaleString("en-IN")}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Reg: ₹{(r.fee_registered || 0).toLocaleString("en-IN")} | Adm: ₹{(r.admission_fee || 0).toLocaleString("en-IN")} | Book: ₹{(r.book_fee || 0).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-muted-foreground">{r.join_date || "—"}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-green-700 font-semibold text-xs">Paid: ₹{(r.total_paid || 0).toLocaleString("en-IN")}</span>
                                                {(r.fee_balance || 0) > 0 && (
                                                    <span className="text-orange-600 text-[10px] font-medium">Bal: ₹{r.fee_balance.toLocaleString("en-IN")}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 min-w-[220px]">
                                            <div className="flex items-center gap-1">
                                                <textarea
                                                    className="w-full border rounded-md px-2 py-1.5 text-xs resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                                    rows={2}
                                                    maxLength={210}
                                                    value={editingRemarks[r.id] ?? r.followup ?? ""}
                                                    onChange={e => setEditingRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                    placeholder="Notes about call follow-up..."
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(editingRemarks[r.id] ?? r.followup ?? "").length}/210
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            {(editingRemarks[r.id] ?? "") !== (r.followup ?? "") && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => handleSaveRemark(r.id)}
                                                >
                                                    <Save className="h-3 w-3" /> Save
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
