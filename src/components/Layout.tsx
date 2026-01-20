
import { Outlet, Link } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Programs", path: "/programs" },
        { name: "Admissions", path: "/admissions" },
        { name: "Gallery", path: "/gallery" },
        { name: "FAQ", path: "/faq" },
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl hidden md:inline-block text-primary">The First Step</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Button asChild variant="default" size="sm">
                            <Link to="/login">Admin Login</Link>
                        </Button>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden" onClick={toggleMenu}>
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden border-b bg-background p-4">
                        <nav className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-sm font-medium hover:text-primary"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                to="/login"
                                className="text-sm font-medium hover:text-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Admin Login
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/40">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg">The First Step Pre-School</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Nurturing young minds for a bright future.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link to="/programs">Our Programs</Link></li>
                                <li><Link to="/admissions">Admissions</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Contact Us</h3>
                            <address className="not-italic text-sm text-muted-foreground space-y-2">
                                <p>123 Learning Lane</p>
                                <p>Cityville, State 12345</p>
                                <p>Email: info@thefirststep.com</p>
                                <p>Phone: (555) 123-4567</p>
                            </address>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} The First Step Pre-School. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
