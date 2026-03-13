"use client"

import { Link, useRouter } from "@/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import PublicNavbar from "@/components/PublicNavbar"

export default function TermsPage() {
    const router = useRouter()
    const lastUpdated = "5th March 2026"

    const sections = [
        {
            title: "1. Acceptance of Terms",
            content: `By accessing and using Shramik Seva ("Platform"), operated by S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Platform.

These Terms apply to all users of the Platform including workers, employers, and visitors.`
        },
        {
            title: "2. Definitions",
            content: `• **"Platform"** refers to the Shramik Seva website and mobile application.
• **"Worker"** refers to any individual who registers on the Platform to find employment opportunities.
• **"Employer"** refers to any individual or organisation who registers on the Platform to hire workers.
• **"Subscription"** refers to a paid plan purchased by an Employer to access premium features.
• **"Services"** refers to all features and functionalities provided through the Platform.
• **"Company"**, **"we"**, **"us"** refers to S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED, the operator of Shramik Seva.`
        },
        {
            title: "3. Eligibility",
            content: `To use the Platform, you must:

• Be at least 18 years of age
• Be legally capable of entering into binding contracts under Indian law
• Provide accurate, complete, and updated registration information
• Not have been previously suspended or removed from the Platform

Employers using the Platform for business purposes represent that they have the authority to bind their organisation.`
        },
        {
            title: "4. Account Registration",
            content: `• You must register an account to access Platform features
• Registration requires a valid Indian mobile number verified via OTP
• You are responsible for maintaining the confidentiality of your account credentials
• You must immediately notify us of any unauthorised use of your account
• One person may not maintain multiple accounts
• We reserve the right to reject, suspend, or terminate accounts at our discretion`
        },
        {
            title: "5. User Responsibilities",
            content: `**For Workers:**
• Provide accurate information about skills, experience, and availability
• Respond to job assignments in a timely manner
• Complete work verification steps (OTP check-in, GPS verification, photo proof)
• Maintain professional conduct at all times during engagements
• Not misrepresent qualifications or work history

**For Employers:**
• Provide accurate job descriptions, salary information, and working conditions
• Not engage in discriminatory hiring practices
• Pay workers fairly and on time as per agreed-upon terms
• Respect worker privacy and not misuse contact information obtained through the Platform
• Use subscription features (database unlocks, job posts) as per plan limits`
        },
        {
            title: "6. Subscription Plans & Payments",
            content: `• Employers can access premium features through paid subscription plans
• All prices are in Indian Rupees (INR) and are exclusive of GST (18%)
• Payments are processed through Paytm Payment Gateway
• Subscriptions require 100% advance payment and activate immediately upon confirmation
• Shramik Seva does NOT auto-renew subscriptions
• Detailed pricing and plan features are available on the Subscriptions page
• Please refer to our Refund/Cancellation Policy for refund terms`
        },
        {
            title: "7. Prohibited Activities",
            content: `Users shall not:

• Use the Platform for any unlawful purpose or to solicit illegal activities
• Post false, misleading, or fraudulent job listings or profiles
• Harass, abuse, or threaten other users
• Attempt to circumvent Platform security or access restrictions
• Scrape, data mine, or extract bulk data from the Platform
• Use bots or automated tools to interact with the Platform
• Share account credentials with third parties
• Post content that is defamatory, obscene, or violates intellectual property rights
• Attempt to contact workers/employers outside the Platform to avoid subscription fees`
        },
        {
            title: "8. Intellectual Property",
            content: `• All content, design, trademarks, logos, and software on the Platform are the property of S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED or its licensors
• Users are granted a limited, non-exclusive, non-transferable licence to use the Platform for its intended purpose
• User-generated content (profiles, job posts) remains the property of the respective user, but users grant us a licence to display and distribute such content on the Platform
• Users may not copy, modify, distribute, or reverse-engineer any part of the Platform`
        },
        {
            title: "9. Work Verification & Attendance",
            content: `• The Platform provides work verification features including OTP check-in/check-out, GPS location verification, and photo documentation
• These features are designed to ensure transparency and accountability
• Employers with appropriate subscription plans can access worklog data
• Workers consent to location tracking and photo capture during active work assignments
• All verification data is subject to our Privacy Policy`
        },
        {
            title: "10. Platform Availability",
            content: `• We strive to maintain 99.9% uptime but do not guarantee uninterrupted service
• Scheduled maintenance will be communicated in advance where possible
• We are not liable for any loss arising from service unavailability due to technical issues, force majeure, or circumstances beyond our control
• The Platform may be updated, modified, or discontinued with reasonable notice`
        },
        {
            title: "11. Limitation of Liability",
            content: `• Shramik Seva acts as a marketplace connecting workers and employers. We do NOT act as an employer, employment agency, or labour contractor
• We are not responsible for the quality of work performed, payment disputes between workers and employers, or any damages arising from employment relationships formed through the Platform
• Our total liability for any claim shall not exceed the amount paid by you to us in the preceding 12 months
• We are not liable for indirect, incidental, special, or consequential damages`
        },
        {
            title: "12. Indemnification",
            content: `You agree to indemnify and hold harmless S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED, its directors, employees, and partners from any claims, damages, losses, or expenses (including legal fees) arising out of:

• Your use or misuse of the Platform
• Your violation of these Terms
• Your violation of any applicable law or regulation
• Any content you post or submit through the Platform
• Any dispute between you and another user`
        },
        {
            title: "13. Termination",
            content: `• Either party may terminate their account at any time
• We reserve the right to suspend or terminate accounts that violate these Terms without prior notice
• Upon termination, your right to use the Platform ceases immediately
• Active subscriptions will not be refunded upon termination for Terms violation
• Sections on Intellectual Property, Limitation of Liability, Indemnification, and Governing Law survive termination`
        },
        {
            title: "14. Modifications to Terms",
            content: `• We may update these Terms from time to time
• Changes will be posted on this page with an updated date
• Continued use of the Platform after changes constitutes acceptance
• Material changes will be notified via email or in-app notification with 30 days' advance notice`
        },
        {
            title: "15. Dispute Resolution",
            content: `• Any disputes arising from the use of the Platform shall first be attempted to be resolved through mutual discussion
• If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996
• The seat of arbitration shall be Kolkata, West Bengal, India
• The arbitration shall be conducted in English`
        },
        {
            title: "16. Governing Law",
            content: `These Terms are governed by and construed in accordance with the laws of India, including but not limited to:

• The Information Technology Act, 2000
• The Consumer Protection Act, 2019
• The Indian Contract Act, 1872

Any legal proceedings shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal, India.`
        },
        {
            title: "17. Contact Information",
            content: `For queries, complaints, or legal notices:

S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED (Shramik Seva)
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

      <PublicNavbar showBack />

            <section className="relative pt-16 pb-8 sm:pt-24 sm:pb-12 px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight"
                    >
                        Terms & <span className="text-primary">Conditions</span>
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
                    <div className="space-y-6">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.02 }}
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
                    <p className="text-sm text-muted-foreground">© 2026 Shramik Seva. All Rights Reserved. A subsidiary of S D R SECURITY MANAGEMENT AND SERVICES PRIVATE LIMITED.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
