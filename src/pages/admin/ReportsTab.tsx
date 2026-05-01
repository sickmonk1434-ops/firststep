import { useState, useEffect } from "react";
import { db } from "@/db/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    TrendingUp, TrendingDown, Users, GraduationCap, IndianRupee,
    Briefcase, Sun, BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface SummaryData {
    totalExpenditure: number;
    admissions: number;
    admissionsActive: number;
    admissionsPrev: number;
    summerCamp: number;
    summerCampPrev: number;
    activeEmployees: number;
    totalEmployees: number;
    totalInvested: number;
    totalSalaryPaid: number;
    totalFeeCollected: number;
    totalFeeBalance: number;
    totalFeeCollectedPrev: number;
    enquiryCount: number;
    totalEstimation: number;
}

interface ExpenditureByCategory { category: string; total: number; }
interface ExpenditureByMode { mode: string; total: number; }
interface MonthlyExpenditure { month: string; total: number; }

function KpiCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
    return (
        <Card className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color.replace("border-", "bg-").replace("-500", "-100")}`}>
                    <Icon className={`h-5 w-5 ${color.replace("border-", "text-").replace("-500", "-600")}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-2xl font-bold truncate">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export default function ReportsTab() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [expByCategory, setExpByCategory] = useState<ExpenditureByCategory[]>([]);
    const [expByMode, setExpByMode] = useState<ExpenditureByMode[]>([]);
    const [monthlyExp, setMonthlyExp] = useState<MonthlyExpenditure[]>([]);
    const [year, setYear] = useState("2025");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const startDate = `${year}-04-01`;
                const endDate = `${parseInt(year) + 1}-03-31 23:59:59`;
                const currentYearNum = parseInt(year);
                const prevYearNum = currentYearNum - 1;

                const [
                    expRes, adm25Res, adm24Res, sc25Res, sc24Res,
                    empRes, invRes, salRes, feeRes, enqRes, expCatRes, expModeRes, monthRes
                ] = await Promise.all([
                    db.execute({ sql: "SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(estimation),0) as est FROM expenditure WHERE date >= ? AND date <= ?", args: [startDate, endDate] }),
                    db.execute({ sql: "SELECT COUNT(*) as cnt, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active FROM admissions WHERE year=?", args: [currentYearNum] }),
                    db.execute({ sql: "SELECT COUNT(*) as cnt FROM admissions WHERE year=?", args: [prevYearNum] }),
                    db.execute({ sql: "SELECT COUNT(*) as cnt FROM summer_camp WHERE year=?", args: [currentYearNum] }),
                    db.execute({ sql: "SELECT COUNT(*) as cnt FROM summer_camp WHERE year=?", args: [prevYearNum] }),
                    db.execute("SELECT COUNT(*) as cnt, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active FROM employees"),
                    db.execute({ sql: "SELECT COALESCE(SUM(amount),0) as total FROM investments WHERE date >= ? AND date <= ?", args: [startDate, endDate] }),
                    db.execute("SELECT COALESCE(SUM(salary_paid),0) as total FROM salaries WHERE status='Paid'"),
                    db.execute({ sql: "SELECT COALESCE(SUM(total_paid),0) as collected, COALESCE(SUM(fee_balance),0) as balance FROM admissions WHERE year=?", args: [currentYearNum] }),
                    db.execute({ sql: "SELECT COUNT(*) as cnt FROM enquiries WHERE timestamp >= ? AND timestamp <= ?", args: [startDate, endDate] }),
                    db.execute({ sql: "SELECT category, COALESCE(SUM(amount),0) as total FROM expenditure WHERE category != '' AND date >= ? AND date <= ? GROUP BY category ORDER BY total DESC LIMIT 8", args: [startDate, endDate] }),
                    db.execute({ sql: "SELECT mode, COALESCE(SUM(amount),0) as total FROM expenditure WHERE mode != '' AND date >= ? AND date <= ? GROUP BY mode", args: [startDate, endDate] }),
                    db.execute({ sql: `SELECT substr(date,1,7) as month, SUM(amount) as total FROM expenditure WHERE date != '' AND date >= ? AND date <= ? GROUP BY month ORDER BY month DESC LIMIT 12`, args: [startDate, endDate] })
                ]);

                setData({
                    totalExpenditure: Number((expRes.rows[0] as Record<string, unknown>).total) || 0,
                    admissions: Number((adm25Res.rows[0] as Record<string, unknown>).cnt) || 0,
                    admissionsActive: Number((adm25Res.rows[0] as Record<string, unknown>).active) || 0,
                    admissionsPrev: Number((adm24Res.rows[0] as Record<string, unknown>).cnt) || 0,
                    summerCamp: Number((sc25Res.rows[0] as Record<string, unknown>).cnt) || 0,
                    summerCampPrev: Number((sc24Res.rows[0] as Record<string, unknown>).cnt) || 0,
                    activeEmployees: Number((empRes.rows[0] as Record<string, unknown>).active) || 0,
                    totalEmployees: Number((empRes.rows[0] as Record<string, unknown>).cnt) || 0,
                    totalInvested: Number((invRes.rows[0] as Record<string, unknown>).total) || 0,
                    totalSalaryPaid: Number((salRes.rows[0] as Record<string, unknown>).total) || 0,
                    totalFeeCollected: Number((feeRes.rows[0] as Record<string, unknown>).collected) || 0,
                    totalFeeBalance: Number((feeRes.rows[0] as Record<string, unknown>).balance) || 0,
                    totalFeeCollectedPrev: 0,
                    enquiryCount: Number((enqRes.rows[0] as Record<string, unknown>).cnt) || 0,
                    totalEstimation: Number((expRes.rows[0] as Record<string, unknown>).est) || 0,
                });
                setExpByCategory((expCatRes.rows as Record<string, unknown>[]).map(r => ({ category: String(r.category || "Other"), total: Number(r.total) || 0 })));
                setExpByMode((expModeRes.rows as Record<string, unknown>[]).map(r => ({ mode: String(r.mode || "Other"), total: Number(r.total) || 0 })));
                setMonthlyExp((monthRes.rows as Record<string, unknown>[]).map(r => ({ month: String(r.month || ""), total: Number(r.total) || 0 })));
            } catch (e) { console.error(e); toast.error("Failed to load summary"); }
            finally { setLoading(false); }
        };
        load();
    }, [year]);

    if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading reports…</div>;
    if (!data) return null;

    const maxCat = Math.max(...expByCategory.map(e => e.total), 1);
    const maxMonth = Math.max(...monthlyExp.map(m => m.total), 1);

    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">School Reports Overview</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Academic Year:</span>
                    <select className="border rounded-md px-3 py-1.5 text-sm" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="2025">2025-2026</option>
                        <option value="2024">2024-2025</option>
                        <option value="2023">2023-2024</option>
                    </select>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={IndianRupee} label="Total Expenditure" value={`₹${data.totalExpenditure.toLocaleString("en-IN")}`} sub="Selected Year" color="border-red-500" />
                <KpiCard icon={IndianRupee} label="Total Invested" value={`₹${data.totalInvested.toLocaleString("en-IN")}`} sub="Selected Year" color="border-green-500" />
                <KpiCard icon={IndianRupee} label="Salary Paid" value={`₹${data.totalSalaryPaid.toLocaleString("en-IN")}`} sub="All time" color="border-blue-500" />
                <KpiCard icon={IndianRupee} label={`Fee Collected (${year})`} value={`₹${data.totalFeeCollected.toLocaleString("en-IN")}`} sub={`Balance: ₹${data.totalFeeBalance.toLocaleString("en-IN")}`} color="border-purple-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={GraduationCap} label={`Admissions ${year}`} value={String(data.admissions)} sub={`${data.admissionsActive} Active`} color="border-primary" />
                <KpiCard icon={GraduationCap} label={`Admissions ${parseInt(year) - 1}`} value={String(data.admissionsPrev)} color="border-indigo-500" />
                <KpiCard icon={Sun} label={`Summer Camp ${year}`} value={String(data.summerCamp)} color="border-orange-500" />
                <KpiCard icon={Sun} label={`Summer Camp ${parseInt(year) - 1}`} value={String(data.summerCampPrev)} color="border-amber-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users} label="Active Employees" value={String(data.activeEmployees)} sub={`of ${data.totalEmployees} total`} color="border-teal-500" />
                <KpiCard icon={Briefcase} label="Enquiries" value={String(data.enquiryCount)} color="border-cyan-500" />
            </div>

            {/* Expenditure vs Investment */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* financial balance */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Financial Balance</CardTitle><CardDescription>Investments vs Expenditure</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: "Total Invested", amount: data.totalInvested, color: "bg-green-500" },
                            { label: "Total Expenditure", amount: data.totalExpenditure, color: "bg-red-500" },
                            { label: "Balance", amount: data.totalInvested - data.totalExpenditure, color: data.totalInvested >= data.totalExpenditure ? "bg-primary" : "bg-orange-500" },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className="font-semibold">₹{Math.abs(item.amount).toLocaleString("en-IN")}{item.amount < 0 ? " (deficit)" : ""}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, Math.abs(item.amount) / Math.max(data.totalInvested, data.totalExpenditure) * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 flex items-center gap-2 text-sm">
                            {data.totalInvested >= data.totalExpenditure
                                ? <><TrendingUp className="h-4 w-4 text-green-600" /><span className="text-green-700 font-medium">Surplus of ₹{(data.totalInvested - data.totalExpenditure).toLocaleString("en-IN")}</span></>
                                : <><TrendingDown className="h-4 w-4 text-red-600" /><span className="text-red-700 font-medium">Deficit of ₹{(data.totalExpenditure - data.totalInvested).toLocaleString("en-IN")}</span></>
                            }
                        </div>
                    </CardContent>
                </Card>

                {/* Top Categories */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Expenditure by Category</CardTitle><CardDescription>Top spending categories</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {expByCategory.slice(0, 5).map(e => (
                                <div key={e.category}>
                                    <div className="flex justify-between text-sm mb-0.5">
                                        <span className="text-muted-foreground truncate max-w-[60%]">{e.category || "Uncategorized"}</span>
                                        <span className="font-semibold">₹{e.total.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${(e.total / maxCat) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Payment Modes</p>
                            <div className="flex gap-4">
                                {expByMode.map(m => (
                                    <div key={m.mode} className="flex-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{m.mode}</p>
                                        <p className="text-sm font-bold">₹{m.total.toLocaleString("en-IN")}</p>
                                        <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${(m.total / data.totalExpenditure) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Estimation vs Actual */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Estimation vs Actual Spending</CardTitle>
                    <CardDescription>Comparison of estimated budgets vs actual costs</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Total Estimation</p>
                            <p className="text-2xl font-bold">₹{data.totalEstimation.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Actual Spending</p>
                            <p className="text-2xl font-bold text-red-600">₹{data.totalExpenditure.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl flex flex-col justify-center">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Difference</p>
                            <div className="flex items-center gap-2">
                                <p className={`text-2xl font-bold ${data.totalExpenditure > data.totalEstimation ? "text-orange-600" : "text-green-600"}`}>
                                    ₹{Math.abs(data.totalExpenditure - data.totalEstimation).toLocaleString("en-IN")}
                                </p>
                                {data.totalExpenditure > data.totalEstimation
                                    ? <TrendingUp className="h-5 w-5 text-orange-600" />
                                    : <TrendingDown className="h-5 w-5 text-green-600" />
                                }
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {data.totalExpenditure > data.totalEstimation ? "Spending exceeded estimates" : "Spending within estimates"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly spend chart */}
            {monthlyExp.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Monthly Expenditure</CardTitle><CardDescription>Last 12 months</CardDescription></CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                            {[...monthlyExp].reverse().map(m => (
                                <div key={m.month} className="flex flex-col items-center gap-1 flex-1 min-w-[36px]">
                                    <span className="text-[10px] text-muted-foreground font-medium">₹{Math.round(m.total / 1000)}k</span>
                                    <div className="w-full bg-primary/80 rounded-t-sm" style={{ height: `${(m.total / maxMonth) * 110}px` }} />
                                    <span className="text-[9px] text-muted-foreground">{m.month?.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
