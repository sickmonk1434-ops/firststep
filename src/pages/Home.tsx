import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/db/client";

interface BannerImage {
    id: number;
    url: string;
    alt_text: string;
}

const Home = () => {
    const [banners, setBanners] = useState<BannerImage[]>([]);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const result = await db.execute("SELECT * FROM banner_images WHERE is_active = 1 ORDER BY display_order ASC");
                setBanners(result.rows as unknown as BannerImage[]);
            } catch (error) {
                console.error("Failed to fetch banners:", error);
                // Fallback dummy images
                setBanners([
                    { id: 1, url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200", alt_text: "Kids learning" },
                    { id: 2, url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200", alt_text: "Playing space" },
                ]);
            }
        };
        fetchBanners();
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (emblaApi) emblaApi.scrollNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [emblaApi]);

    return (
        <div className="flex flex-col">
            {/* Hero / Banner Section */}
            <section className="relative overflow-hidden">
                <div className="embla" ref={emblaRef}>
                    <div className="embla__container flex">
                        {banners.map((banner) => (
                            <div key={banner.id} className="embla__slide flex-[0_0_100%] min-w-0 relative h-[500px] md:h-[600px]">
                                <img
                                    src={banner.url}
                                    alt={banner.alt_text}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-4">
                                    <div className="max-w-3xl">
                                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                                            The First Step to a Bright Future
                                        </h1>
                                        <p className="text-xl text-white mb-8 drop-shadow-md">
                                            A nurturing environment where children discover, learn, and grow.
                                        </p>
                                        <div className="flex gap-4 justify-center">
                                            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                                                <Link to="/admissions">Apply Now</Link>
                                            </Button>
                                            <Button size="lg" variant="outline" asChild className="text-white border-white hover:bg-white/20">
                                                <Link to="/programs">Our Programs</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Carousel Controls */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors hidden md:block" onClick={scrollPrev}>
                    <ArrowRight className="h-6 w-6 rotate-180" />
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors hidden md:block" onClick={scrollNext}>
                    <ArrowRight className="h-6 w-6" />
                </button>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Why Choose The First Step?</h2>
                        <div className="h-1.5 w-24 bg-primary/20 mx-auto rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-primary animate-pulse"></div>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { icon: GraduationCap, title: "Expert Teachers", desc: "Certified educators passionate about early childhood development." },
                            { icon: Users, title: "Small Classes", desc: "Individualized attention for every child in an inclusive setting." },
                            { icon: BookOpen, title: "Rich Curriculum", desc: "Holistic approach combining academics, art, and play." },
                            { icon: Star, title: "Safe Environment", desc: "Secure facility with a focus on health and emotional safety." },
                        ].map((item, i) => (
                            <Card key={i} className="text-center hover:shadow-xl transition-all hover:-translate-y-2 border-primary/10">
                                <CardContent className="pt-8">
                                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <item.icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {item.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Programs Preview */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div className="max-w-2xl text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Learning Programs</h2>
                            <p className="text-muted-foreground">Tailored educational experiences for different stages of your child's growth.</p>
                        </div>
                        <Button variant="link" asChild className="text-primary font-bold text-lg group">
                            <Link to="/programs" className="flex items-center gap-2">
                                View All Programs <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[
                            { title: "Toddler Transition", age: "1.5 - 2.5 Years", color: "bg-orange-500", img: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=500" },
                            { title: "Nursery", age: "2.5 - 3.5 Years", color: "bg-blue-500", img: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=500" },
                            { title: "Kindergarten", age: "3.5 - 5.5 Years", color: "bg-green-500", img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=500" },
                        ].map((prog, i) => (
                            <Card key={i} className="overflow-hidden group border-none shadow-lg">
                                <div className="h-48 relative overflow-hidden">
                                    <img src={prog.img} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className={`absolute top-4 left-4 ${prog.color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                                        {prog.age}
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <h3 className="text-2xl font-bold mb-2">{prog.title}</h3>
                                    <p className="text-muted-foreground text-sm mb-4">Developing essential social, emotional and cognitive skills through play.</p>
                                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors" asChild>
                                        <Link to="/programs">Learn More</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials or CTA */}
            <section className="py-24 bg-primary text-white text-center">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8 italic">"The First Step has been a second home for my daughter. She wakes up excited to go to school every day!"</h2>
                    <p className="text-xl mb-12 opacity-90">— Sarah J., Parent of Nursery Student</p>
                    <Button size="lg" variant="secondary" asChild className="bg-white text-primary hover:bg-gray-100 h-14 px-10 text-lg font-bold">
                        <Link to="/admissions">Join Our Family Today</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default Home;
