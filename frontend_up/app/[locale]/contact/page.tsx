"use client"

import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, MapPin, Phone, Mail, Clock, Send, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ContactPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" })
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/site/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitted(true)
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert('An error occurred. Please try again later.');
        }
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
            </div>

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

            <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight"
                    >
                        Contact <span className="text-primary">Us</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
                    >
                        Have questions or need help? We'd love to hear from you.
                    </motion.p>
                </div>
            </section>

            <section className="py-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-2 space-y-6"
                        >
                            {[
                                { icon: Building2, title: "Registered Office", desc: "SDR Security\n33/A, Manoranjan Roy Chowdhury Road,\nKolkata, West Bengal, India" },
                                { icon: Phone, title: "Phone", desc: "+91 9305651274\n+91 8981086528\n+91-33-22847198" },
                                { icon: Mail, title: "Email", desc: "support@sdrsecurity.in" },
                                { icon: Clock, title: "Business Hours", desc: "Monday – Saturday\n9:00 AM – 6:00 PM IST" },
                            ].map((item, idx) => {
                                const Icon = item.icon
                                return (
                                    <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold mb-1">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">{item.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="p-5 rounded-2xl bg-card border border-border/50">
                                <h3 className="font-bold mb-3">Branch Offices</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["Ranchi", "Jamshedpur", "Lucknow", "Noida (Delhi/NCR)", "Pune", "Odisha", "Surat"].map((city) => (
                                        <span key={city} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            {city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-3"
                        >
                            <div className="p-8 rounded-3xl bg-card border border-border/50">
                                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                            <Send className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                                        <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                        <Button className="mt-6" onClick={() => {
                                            setSubmitted(false)
                                            setFormData({ name: "", email: "", subject: "", message: "" })
                                        }}>Send Another</Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                    placeholder="your@email.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Subject</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                placeholder="How can we help?"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Message</label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                                                placeholder="Describe your query..."
                                            />
                                        </div>
                                        <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base">
                                            <Send className="w-4 h-4 mr-2" /> Send Message
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2026 Shramik Seva. All Rights Reserved. A subsidiary of SDR Security.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
                        <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
