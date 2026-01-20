
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Simple mock authentication
        setTimeout(() => {
            if (email === "admin@thefirststep.com" && password === "admin123") {
                toast.success("Login successful!");
                navigate("/admin");
            } else {
                setError("Invalid email or password. Hint: admin@thefirststep.com / admin123");
                toast.error("Login failed");
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-muted/20 px-4">
            <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden rounded-2xl">
                <div className="bg-primary p-8 text-center text-white">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Portal</h1>
                    <p className="opacity-80 text-sm mt-2">The First Step Pre-School Management</p>
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
                            <Label htmlFor="email">Work Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-10"
                                    placeholder="admin@thefirststep.com"
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
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button type="submit" className="w-full h-12 text-lg group" disabled={loading}>
                            {loading ? "Logging in..." : "Secure Login"}
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="ghost" type="button" className="text-muted-foreground text-xs" onClick={() => window.location.href = "/"}>
                            Back to Public Site
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
