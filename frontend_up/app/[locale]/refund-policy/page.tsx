"use client"

import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock, CreditCard, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import PublicNavbar from "@/components/PublicNavbar"

export default function RefundPolicyPage() {
    const router = useRouter()
    const lastUpdated = "5th March 2026"

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <PublicNavbar showBack />

            <section className="relative pt-16 pb-8 sm:pt-24 sm:pb-12 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight"
                    >
                        Refund & <span className="text-primary">Cancellation Policy</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground"
                    >
                        Last Updated: {lastUpdated}
                    </motion.p>
                </div>
            </section>

            <section className="py-8 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Overview</h2>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                            This Refund and Cancellation Policy outlines the terms under which refunds may be issued for subscription plans purchased on Shramik Seva, a product of S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED. All payments are processed via <strong className="text-foreground">Paytm Payment Gateway</strong>.
                        </p>
                    </motion.div>

                    {/* Refund Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-6 text-primary">Refund Eligibility — Paid Subscriptions</h2>
                        <p className="text-muted-foreground text-sm mb-6">Applies to Basic (₹2,350), Pro (₹4,999), and Premium (₹11,000) plans.</p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-semibold text-foreground">Condition</th>
                                        <th className="text-left py-3 px-4 font-semibold text-foreground">Refund</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-4 text-muted-foreground">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span>Request within <strong className="text-foreground">48 hours</strong> of purchase AND no features used (no jobs posted, no database unlocks consumed)</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-semibold text-xs">FULL REFUND</span>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-4 text-muted-foreground">
                                            <div className="flex items-start gap-2">
                                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <span>Request within <strong className="text-foreground">48 hours</strong> but features have been partially used</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-semibold text-xs">NO REFUND</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-4 text-muted-foreground">
                                            <div className="flex items-start gap-2">
                                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <span>Request after <strong className="text-foreground">48 hours</strong> of purchase</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-semibold text-xs">NO REFUND</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Free Trial */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Free Trial</h2>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                            The Free Trial plan (7 days) involves no payment. No refund is applicable for free trial usage.
                        </p>
                    </motion.div>

                    {/* Add-ons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Add-ons</h2>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                            Add-on purchases (such as the Worklog Access add-on at ₹2,499/30 days) are <strong className="text-foreground">non-refundable</strong> once activated. Please review the add-on features carefully before purchasing.
                        </p>
                    </motion.div>

                    {/* Upgrades */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Plan Upgrades</h2>
                        <div className="text-muted-foreground leading-relaxed text-sm sm:text-base space-y-3">
                            <p>
                                When upgrading from a lower to a higher plan, the <strong className="text-foreground">unused balance</strong> of the current plan is adjusted <strong className="text-foreground">pro-rata</strong> against the new plan's price.
                            </p>
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Example</p>
                                <p className="text-sm">
                                    Upgrading from Basic (₹2,350) to Pro (₹4,999) after using 15 of 30 days: A credit of ₹1,175 is applied, and ₹3,824 is charged for the upgrade.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Cancellation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Cancellation Policy</h2>
                        <div className="text-muted-foreground leading-relaxed text-sm sm:text-base space-y-3">
                            <p>
                                <strong className="text-foreground">Shramik Seva does NOT auto-renew subscriptions.</strong> Your subscription will simply expire at the end of the plan period.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span>You can cancel your subscription at any time from your account settings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span>Cancellation stops future renewals but does not issue a refund for the remaining period</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span>You will continue to have access to premium features until the subscription end date</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span>After expiry, active job posts will be paused (not deleted), and database access will be restricted</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Refund Processing */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-6 text-primary">Refund Processing</h2>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { icon: Clock, title: "Processing Time", desc: "5–7 business days after approval" },
                                { icon: CreditCard, title: "Refund Method", desc: "Credited to the original payment method used" },
                                { icon: AlertCircle, title: "Dispute Window", desc: "7 calendar days from the transaction date" },
                            ].map((item, idx) => {
                                const Icon = item.icon
                                return (
                                    <div key={idx} className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                            <Icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* How to Request */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">How to Request a Refund</h2>
                        <div className="text-muted-foreground leading-relaxed text-sm sm:text-base space-y-3">
                            <p>To submit a refund request, contact us through any of the following:</p>
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span><strong className="text-foreground">Email:</strong> support@sdrsecurity.in</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span><strong className="text-foreground">Phone:</strong> +91 9305651274</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span><strong className="text-foreground">In-App:</strong> Settings → Help & Support → Billing Issues</span>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                All refund requests will be acknowledged within 24 hours and resolved within 7 business days.
                            </p>
                        </div>
                    </motion.div>

                    {/* Governing Law */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                    >
                        <h2 className="text-xl font-bold mb-4 text-primary">Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                            This Refund and Cancellation Policy is governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal, India.
                        </p>
                    </motion.div>
                </div>
            </section>

            <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10 mt-12">
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
