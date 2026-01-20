
import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "What is the recommended age for admission?",
            answer: "We offer programs for children aged 1.5 to 5.5 years. Our Toddler Transition starts at 1.5 years, Nursery at 2.5 years, and Kindergarten 1 & 2 follow."
        },
        {
            question: "What are the school timings?",
            answer: "Our preschool operates from 9:00 AM to 12:30 PM for Toddlers and Nursery, and until 1:30 PM for Kindergarten students."
        },
        {
            question: "Do you provide transport facilities?",
            answer: "Yes, we provide safe and secure transport facilities within a 5km radius of the school center. All our vehicles are equipped with GPS tracking."
        },
        {
            question: "What is the teacher-student ratio?",
            answer: "We maintain a strict ratio of 1:10 for toddlers and 1:15 for older children, ensuring every child receives personal attention."
        },
        {
            question: "What safety measures are in place?",
            answer: "Our campus is under 24/7 CCTV surveillance. We have child-proofed interiors, regular fire drills, and a first-aid kit with trained staff on-site."
        },
        {
            question: "How do you keep parents updated on their child's progress?",
            answer: "We hold monthly parent-teacher interactions and provide daily activity logs through our school app. We also send periodic progress reports."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <section className="bg-primary py-20 text-white text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
                    <p className="text-xl opacity-90 max-w-2xl mx-auto">
                        Everything you need to know about our school, programs, and admissions process.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-muted/20 flex-1">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <Card key={i} className={`overflow-hidden transition-all duration-300 border-none shadow-sm ${openIndex === i ? 'ring-1 ring-primary shadow-md' : 'hover:shadow-md'}`}>
                                <CardContent className="p-0">
                                    <button
                                        onClick={() => toggleFaq(i)}
                                        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <HelpCircle className={`h-6 w-6 shrink-0 ${openIndex === i ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className={`font-bold text-lg ${openIndex === i ? 'text-primary' : ''}`}>{faq.question}</span>
                                        </div>
                                        {openIndex === i ? (
                                            <Minus className="h-5 w-5 text-primary shrink-0" />
                                        ) : (
                                            <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
                                        )}
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96' : 'max-h-0'}`}>
                                        <div className="px-6 pb-6 pt-0 ml-10">
                                            <p className="text-muted-foreground leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-16 text-center bg-white p-10 rounded-3xl shadow-xl border border-primary/5">
                        <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
                        <p className="text-muted-foreground mb-8">If you couldn't find the answer you're looking for, feel free to contact us.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-colors">
                                Contact Us
                            </button>
                            <button className="bg-muted text-primary font-bold py-3 px-8 rounded-full hover:bg-muted/80 transition-colors">
                                Call Support
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FAQ;
