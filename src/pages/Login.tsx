
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/auth";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await db.execute({
                sql: "SELECT * FROM users WHERE email = ? AND password = ?",
                args: [email, password]
            });

            if (result.rows.length > 0) {
                const user = result.rows[0];
                const role = user.role as UserRole;
                login(
                    user.email as string,
                    role,
                    user.name as string,
                    user.id as number,
                    user.school_id as number | null
                );
                toast.success(`Welcome back, ${user.name}!`);
                if (role === 'super_admin') {
                    navigate("/superadmin");
                } else {
                    navigate("/admin");
                }
            } else {
                setError("Invalid email or password.");
                toast.error("Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("Database connection failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-muted/20 px-4">
            <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-2xl">
                <div className="bg-primary p-8 text-center text-white">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">The First Step Portal</h1>
                    <p className="opacity-80 text-sm mt-2">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 pt-8">
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-3">
                                <AlertCircle className="h-5 w-5" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-10"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg space-y-2">
                            <p className="font-bold">Demo Credentials:</p>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3 text-violet-600" />
                                    <span className="font-semibold text-violet-700">Super Admin:</span>
                                    superadmin@thefirststep.com / superadmin123
                                </p>
                                <p>Admin: admin@thefirststep.com / admin123</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button type="submit" className="w-full h-12 text-lg group" disabled={loading}>
                            {loading ? "Authenticating..." : "Sign In"}
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
