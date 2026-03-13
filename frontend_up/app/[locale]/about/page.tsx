"use client"

import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Users, Shield, Target, Heart, Building2, MapPin, Phone, Mail, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
    const router = useRouter()
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Decorative Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 w-full bg-background/60 backdrop-blur-xl border-b border-border z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent tracking-tight">
                            Shramik Seva
                        </span>
                    </Link>
                    <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight"
                    >
                        About <span className="text-primary">Shramik Seva</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        Empowering India's skilled workforce by connecting workers with meaningful employment opportunities through technology.
                    </motion.p>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-12 items-center"
                    >
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight">Our Story</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Shramik Seva is a digital platform launched by <strong className="text-foreground">S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED</strong>, a trusted name in the manpower and security services industry operating across multiple states in India since its inception.
                                </p>
                                <p>
                                    Born from the realization that India's vast skilled workforce — security guards, plumbers, electricians, carpenters, housekeeping staff, drivers, and more — deserves a modern, dignified way to find work, Shramik Seva bridges the gap between blue-collar workers and employers.
                                </p>
                                <p>
                                    Our platform leverages technology to simplify hiring, verify work attendance with GPS and OTP, and ensure transparent payment processes for both employers and workers alike.
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                            <div className="relative p-8 rounded-3xl bg-card border border-border/50 backdrop-blur-md">
                                <div className="space-y-6">
                                    {[
                                        { icon: Building2, label: "Parent Company", value: "S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED" },
                                        { icon: MapPin, label: "Headquarters", value: "Kolkata, West Bengal" },
                                        { icon: Globe, label: "Operations", value: "Pan-India" },
                                        { icon: Users, label: "Workforce Categories", value: "15+ Skill Types" },
                                    ].map((item, idx) => {
                                        const Icon = item.icon
                                        return (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                                    <p className="font-semibold text-foreground">{item.value}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-transparent via-card/50 to-transparent">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: Target,
                                title: "Our Mission",
                                description: "To digitize and organize India's blue-collar job market by providing a reliable, transparent, and efficient platform that connects skilled workers with employers — ensuring fair wages, verified employment, and dignity of labour.",
                                color: "primary",
                            },
                            {
                                icon: Heart,
                                title: "Our Vision",
                                description: "To become India's most trusted workforce marketplace where every skilled worker has access to dignified employment, and every employer can find verified, reliable talent within minutes — powered by technology, driven by trust.",
                                color: "accent",
                            },
                        ].map((item, idx) => {
                            const Icon = item.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${item.color === "primary" ? "bg-primary/10" : "bg-accent/10"} flex items-center justify-center mb-6`}>
                                        <Icon className={`w-8 h-8 ${item.color === "primary" ? "text-primary" : "text-accent"}`} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">Our Values</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">What drives us every day</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Shield, title: "Trust & Safety", desc: "Verified profiles, secure payments, and transparent processes." },
                            { icon: Users, title: "Inclusivity", desc: "Equal opportunities for all workers regardless of background." },
                            { icon: Target, title: "Efficiency", desc: "Quick matching and streamlined hiring in under 48 hours." },
                            { icon: Heart, title: "Worker Dignity", desc: "Fair wages, documented work, and professional recognition." },
                        ].map((value, idx) => {
                            const Icon = value.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ y: -5 }}
                                    className="p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/30 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h4 className="font-bold mb-2">{value.title}</h4>
                                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Parent Company */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-8 sm:p-12 rounded-3xl bg-card border border-border/50"
                    >
                        <h2 className="text-3xl font-extrabold mb-6 tracking-tight">Parent Company — S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED</h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                <strong className="text-foreground">S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED</strong> is a leading manpower and security services company headquartered in Kolkata, West Bengal. With branch offices across Ranchi, Jamshedpur, Lucknow, Noida (Delhi/NCR), Pune, Odisha, and Surat, S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED provides a comprehensive range of services including:
                            </p>
                            <ul className="grid sm:grid-cols-2 gap-2 mt-4">
                                {[
                                    "Security Guard Services",
                                    "Female Security Guards",
                                    "Bouncer & Bodyguard Services",
                                    "Cash Management",
                                    "Housekeeping Services",
                                    "Facility Management",
                                    "Driver Services",
                                    "Electrician & Plumber Services",
                                ].map((service, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        <span className="text-sm">{service}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    33/A, Manoranjan Roy Chowdhury Road, Kolkata
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-primary" />
                                    +91 9305651274
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-primary" />
                                    support@sdrsecurity.in
                                </div>
                            </div>
                            <div className="mt-4">
                                <a href="https://sdrsecurity.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
                                    Visit sdrsecurity.in →
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2026 Shramik Seva. All Rights Reserved. A subsidiary of S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
