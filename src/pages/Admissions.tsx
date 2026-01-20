
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/db/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const Admissions = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        studentName: "",
        parentName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        programInterest: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleProgramChange = (value: string) => {
        setFormData(prev => ({ ...prev, programInterest: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.studentName || !formData.email || !formData.phone || !formData.programInterest) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            await db.execute({
                sql: `
                    INSERT INTO applications (student_name, parent_name, email, phone, date_of_birth, address, program_interest, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    formData.studentName,
                    formData.parentName,
                    formData.email,
                    formData.phone,
                    formData.dateOfBirth,
                    formData.address,
                    formData.programInterest,
                    'pending'
                ]
            });

            setIsSubmitted(true);
            toast.success("Application submitted successfully!");
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error("Failed to submit application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <Card className="max-w-md w-full text-center border-green-200 bg-green-50/50">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-800">Application Received!</CardTitle>
                        <CardDescription>
                            Thank you for your interest in The First Step Pre-School. Our team will review your application and get back to you shortly at <strong>{formData.email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="bg-primary/10 py-16 text-center border-b border-primary/10">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-5xl font-bold text-primary mb-4">Admissions Open</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Join our nurturing learning community. Please fill out the form below to start your child's journey with us.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-20 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Info Side */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Why Apply Now?</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    We provide early exposure to a rich world of curiosity. Our admissions process is transparent and focused on finding the right fit for your child.
                                </p>
                            </div>
                            <div className="grid gap-6">
                                {[
                                    { title: "Personal Attention", desc: "Limited seats to ensure high teacher-student ratio." },
                                    { title: "Easy Process", desc: "Submit application, attend a brief interaction, and join." },
                                    { title: "Immediate Feedback", desc: "Get notified about status updates via email." },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="bg-blue-100 text-blue-600 h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold">{i + 1}</div>
                                        <div>
                                            <h4 className="font-bold">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Card className="bg-primary text-white border-none">
                                <CardContent className="pt-6">
                                    <p className="italic mb-4 opacity-90">"The transition for my son was so smooth. The teachers are incredibly patient and encouraging."</p>
                                    <p className="font-bold">— Happy Parent</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Form Side */}
                        <Card className="shadow-2xl border-none">
                            <CardHeader>
                                <CardTitle>Student Application</CardTitle>
                                <CardDescription>Fields marked with * are mandatory.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="studentName">Student Full Name *</Label>
                                            <Input id="studentName" placeholder="Child's name" value={formData.studentName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="parentName">Parent / Guardian Name</Label>
                                        <Input id="parentName" placeholder="Your name" value={formData.parentName} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input id="email" type="email" placeholder="example@gmail.com" value={formData.email} onChange={handleInputChange} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <Input id="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Program of Interest *</Label>
                                        <Select onValueChange={handleProgramChange} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Toddler Transition">Toddler Transition (1.5 - 2.5y)</SelectItem>
                                                <SelectItem value="Nursery">Nursery (2.5 - 3.5y)</SelectItem>
                                                <SelectItem value="Kindergarten 1">Kindergarten 1 (3.5 - 4.5y)</SelectItem>
                                                <SelectItem value="Kindergarten 2">Kindergarten 2 (4.5 - 5.5y)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Residential Address</Label>
                                        <Textarea id="address" placeholder="Type your full address..." className="min-h-[100px]" value={formData.address} onChange={handleInputChange} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
                                        {isSubmitting ? "Submitting Application..." : "Submit Application"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Admissions;
