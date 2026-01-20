import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Sparkles, Smile, BookOpen, Music, Palette, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Programs = () => {
    const programs = [
        {
            title: "Toddler Transition Program",
            age: "1.5 to 2.5 Years",
            desc: "Our Toddler Transition Program is designed to provide a smooth transition from home to school, fostering independence and social skills in a safe, nurturing environment.",
            color: "border-orange-500",
            bgColor: "bg-orange-50/50",
            iconColor: "text-orange-500",
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400",
            features: [
                { icon: Smile, text: "Settling into a structured routine" },
                { icon: BookOpen, text: "Language and communication development" },
                { icon: Palette, text: "Sensory and motor skill exploration" },
                { icon: Music, text: "Rhymes, music, and rhythmic movement" },
                { icon: Star, text: "Social interaction with peers" }
            ],
            learningOutcomes: "Children develop basic self-help skills, learn to follow simple instructions, and start expressing themselves through words and art."
        },
        {
            title: "Nursery / Pre-School",
            age: "2.5 to 3.5 Years",
            desc: "The Nursery program focuses on holistic development, introducing children to a wider world of learning through exploration and structured play.",
            color: "border-blue-500",
            bgColor: "bg-blue-50/50",
            iconColor: "text-blue-500",
            image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=400",
            features: [
                { icon: CheckCircle2, text: "Building confidence and independence" },
                { icon: Sparkles, text: "Creative expression through art and craft" },
                { icon: BookOpen, text: "Pre-writing and pre-reading skills" },
                { icon: Palette, text: "Hands-on discovery and curiosity" },
                { icon: Users, text: "Collaborative play and sharing" }
            ],
            learningOutcomes: "Enhanced vocabulary, better fine motor control, understanding of shapes and colors, and improved social adaptability."
        },
        {
            title: "Kindergarten (K1 & K2)",
            age: "3.5 to 5.5 Years",
            desc: "Our Kindergarten program prepares children for primary education by strengthening their academic foundation while maintaining a love for learning.",
            color: "border-green-500",
            bgColor: "bg-green-50/50",
            iconColor: "text-green-500",
            image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400",
            features: [
                { icon: BookOpen, text: "Foundational literacy and numeracy" },
                { icon: Sparkles, text: "Critical thinking and problem solving" },
                { icon: Music, text: "Public speaking and stage confidence" },
                { icon: Palette, text: "Advanced art and science projects" },
                { icon: CheckCircle2, text: "Readiness for formal schooling" }
            ],
            learningOutcomes: "Proficient reading and math skills, strong logical reasoning, high emotional intelligence, and readiness for transition to big schools."
        }
    ];

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="bg-primary text-white py-20 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Educational Programs</h1>
                    <p className="text-xl max-w-3xl mx-auto opacity-90">
                        Inspired by global best practices, we provide a curriculum that grows with your child, ensuring a journey of discovery at every step.
                    </p>
                </div>
            </section>

            {/* Programs List */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col gap-24">
                        {programs.map((prog, index) => (
                            <div key={index} className={`flex flex-col lg:flex-row gap-12 items-center ${index % 1 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                                {/* Image Column */}
                                <div className="hidden lg:block w-full lg:w-1/2 relative group">
                                    <div className={`absolute -inset-4 ${prog.bgColor} rounded-3xl -rotate-2 transform group-hover:rotate-0 transition-transform`}></div>
                                    <img
                                        src={prog.image}
                                        alt={prog.title}
                                        className="relative w-full h-[400px] object-cover rounded-2xl shadow-2xl z-10"
                                    />
                                    <div className={`absolute bottom-6 right-6 ${prog.color.replace('border-', 'bg-')} text-white px-6 py-2 rounded-full font-bold shadow-lg z-20`}>
                                        {prog.age}
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="w-full lg:w-1/2">
                                    <div className={`inline-block border-l-4 ${prog.color} pl-4 mb-4`}>
                                        <span className="text-muted-foreground uppercase tracking-widest text-sm font-bold">Recommended Age: {prog.age}</span>
                                        <h2 className="text-4xl font-bold mt-2">{prog.title}</h2>
                                    </div>
                                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                        {prog.desc}
                                    </p>

                                    <div className="grid sm:grid-cols-2 gap-4 mb-10">
                                        {prog.features.map((feat, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg hover:bg-muted/60 transition-colors">
                                                <feat.icon className={`h-5 w-5 ${prog.iconColor}`} />
                                                <span className="text-sm font-medium">{feat.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`${prog.bgColor} p-6 rounded-xl border-t-2 ${prog.color} mb-8`}>
                                        <h4 className="font-bold flex items-center gap-2 mb-3">
                                            <Sparkles className={`h-5 w-5 ${prog.iconColor}`} />
                                            What they learn:
                                        </h4>
                                        <p className="text-muted-foreground">{prog.learningOutcomes}</p>
                                    </div>

                                    <Button size="lg" asChild className="rounded-full px-10 shadow-lg hover:shadow-primary/20">
                                        <Link to="/admissions">Enquire for {prog.title}</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-muted/30 text-center border-y">
                <div className="container mx-auto px-4 max-w-2xl">
                    <h2 className="text-3xl font-bold mb-6">Unsure which program is right?</h2>
                    <p className="text-muted-foreground mb-8">Visit our center for a personal consultation and tour to see our learning world in action.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="default" size="lg" asChild className="rounded-full">
                            <Link to="/admissions">Application Form</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="rounded-full">
                            <a href="tel:+5551234567">Call Us: (555) 123-4567</a>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Programs;
