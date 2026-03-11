"use client"

import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
    const router = useRouter()
    const lastUpdated = "5th March 2026"

    const sections = [
        {
            title: "1. Introduction",
            content: `Welcome to Shramik Seva ("Platform", "we", "us", or "our"), a product of SDR Security. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application.

By using Shramik Seva, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not access the Platform.`
        },
        {
            title: "2. Information We Collect",
            content: `**Personal Information:**
• Full name, date of birth, gender
• Mobile phone number and email address
• Physical address and location data
• Aadhaar number or other government ID (for verification purposes)
• Profile photographs
• Skills, work experience, and educational background
• Bank account details (for payment processing)
• GSTIN (for employers)

**Device & Usage Information:**
• Device type, operating system, and browser type
• IP address and approximate location
• App usage patterns, pages visited, and features used
• Login timestamps and session duration

**Payment Information:**
• Transaction records and payment history
• Subscription plan details
• Invoice data

Note: We do NOT store credit/debit card numbers, CVV, or banking credentials. All payment data is securely processed by our payment partner, Paytm Payment Gateway, in compliance with PCI-DSS standards.`
        },
        {
            title: "3. How We Use Your Information",
            content: `We use the collected information for:

• **Account Management:** Creating and managing your user account
• **Service Delivery:** Matching workers with job opportunities, facilitating communication between workers and employers
• **Verification:** Verifying identity, skills, and work attendance through OTP and GPS-based systems
• **Payments:** Processing subscription payments, generating invoices, and managing refunds
• **Communication:** Sending OTPs, job alerts, payment confirmations, and platform updates via SMS and push notifications
• **Platform Improvement:** Analysing usage patterns to improve features and user experience
• **Legal Compliance:** Complying with applicable Indian laws and regulations
• **Support:** Responding to customer inquiries and resolving disputes`
        },
        {
            title: "4. Information Sharing & Disclosure",
            content: `We may share your information with:

• **Employers & Workers:** Basic profile information is shared between matched parties to facilitate employment (e.g., worker skills visible to employers, employer company name visible to workers)
• **Payment Processors:** Paytm Payment Gateway for processing transactions
• **SMS Service Providers:** For OTP delivery and notifications
• **Legal Authorities:** When required by law, court order, or government regulation
• **Service Providers:** Cloud hosting, analytics, and customer support tools

We do NOT sell your personal data to third parties for marketing purposes.`
        },
        {
            title: "5. Data Retention",
            content: `• **Active Accounts:** Data is retained as long as your account is active
• **Deleted Accounts:** Personal data is deleted within 90 days of account deletion request, except where retention is required by law
• **Payment Records:** Transaction history and invoices are retained for 7 years as per Indian tax regulations (GST Act)
• **Work Logs:** Worklog data (attendance, photos, GPS data) is retained for the duration of the job plus 90 days`
        },
        {
            title: "6. Data Security",
            content: `We implement industry-standard security measures including:

• SSL/TLS encryption for all data in transit
• Encrypted storage for sensitive personal data
• Role-based access controls for internal data access
• Regular security audits and vulnerability assessments
• Secure payment processing via PCI-DSS compliant Paytm Payment Gateway

While we take every reasonable precaution, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your data.`
        },
        {
            title: "7. Your Rights",
            content: `As a user, you have the right to:

• **Access:** Request a copy of the personal data we hold about you
• **Correction:** Update or correct inaccurate personal information
• **Deletion:** Request deletion of your account and associated data
• **Portability:** Request your data in a machine-readable format
• **Withdraw Consent:** Opt out of marketing communications at any time
• **Grievance Redressal:** File a complaint with our Grievance Officer

To exercise these rights, contact us at support@sdrsecurity.in or through the in-app support feature.`
        },
        {
            title: "8. Cookies & Tracking",
            content: `We use cookies and similar technologies for:

• **Essential Cookies:** Required for platform functionality (authentication, session management)
• **Analytics Cookies:** To understand usage patterns and improve the platform
• **Preference Cookies:** To remember your language, theme, and other settings

You can manage cookie preferences through your browser settings. Disabling essential cookies may affect platform functionality.`
        },
        {
            title: "9. Third-Party Services",
            content: `Our Platform may contain links to third-party websites and services. We are not responsible for the privacy practices of these external sites. We recommend reviewing their privacy policies before providing any personal information.

Third-party services we use include:
• Paytm Payment Gateway (payments)
• Google Maps (location services)
• Firebase (push notifications)
• Fast2SMS / Jio DLT (SMS services)`
        },
        {
            title: "10. Children's Privacy",
            content: `Shramik Seva is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we discover that a minor has provided us with personal data, we will promptly delete such information.`
        },
        {
            title: "11. Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the Platform after changes constitutes acceptance of the revised policy. Significant changes will be communicated via email or in-app notification.`
        },
        {
            title: "12. Governing Law",
            content: `This Privacy Policy is governed by the laws of India, including the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal, India.`
        },
        {
            title: "13. Contact Us",
            content: `For privacy-related queries, data requests, or grievances:

**Grievance Officer / Data Protection Contact**
SDR Security (Shramik Seva)
33/A, Manoranjan Roy Chowdhury Road,
Kolkata, West Bengal, India

Email: support@sdrsecurity.in
Phone: +91 9305651274
Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM IST`
        },
    ]

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
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

            <section className="relative pt-16 pb-8 sm:pt-24 sm:pb-12 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight"
                    >
                        Privacy <span className="text-primary">Policy</span>
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
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.03 }}
                                className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50"
                            >
                                <h2 className="text-xl font-bold mb-4 text-primary">{section.title}</h2>
                                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                    {section.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                                        if (part.startsWith("**") && part.endsWith("**")) {
                                            return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>
                                        }
                                        return <span key={i}>{part}</span>
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2026 Shramik Seva. All Rights Reserved. A subsidiary of SDR Security.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link>
                        <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
