"use client"

import { useState, useEffect } from "react"
import { Link, useRouter } from "@/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Loader2, CreditCard, Shield, CheckCircle, Lock } from "lucide-react"

interface SubscriptionPlan {
    planKey: string
    name: string
    price: number
    features: string[]
}

export default function CheckoutPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const planKey = searchParams.get("plan") || ""
    const { user, isLoading: authLoading } = useAuth()

    const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState("")
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setLoading(true)
                const plans = (await apiClient.getSubscriptionPlans()) as SubscriptionPlan[]
                const found = plans.find((p) => p.planKey === planKey)
                if (found) {
                    setPlan(found)
                } else {
                    setError("Invalid plan selected. Please go back and choose a plan.")
                }
            } catch {
                setError("Failed to load plan details.")
            } finally {
                setLoading(false)
            }
        }
        if (planKey) {
            fetchPlan()
        }
    }, [planKey])

    const gstRate = 0.18
    const basePrice = plan?.price || 0
    const gstAmount = Math.round(basePrice * gstRate)
    const totalAmount = basePrice + gstAmount

    const handlePayment = async () => {
        if (!plan || !user) return
        setError("")
        setProcessing(true)

        try {
            if (basePrice === 0 || planKey === "free") {
                await apiClient.createSubscription(planKey as "free" | "basic" | "pro" | "premium")
                router.push("/subscriptions/status?status=success&plan=" + planKey)
                return
            }

            const orderId = `ORDER_${Date.now()}_${user._id || "web"}`
            const response = await apiClient.initiatePaytmPayment({
                amount: basePrice,
                orderId,
                customerId: user._id || "",
                email: user.email,
                phone: user.mobile,
                planId: planKey,
                platform: "web",
            })

            if (response.success) {
                // Determine Paytm Host (Staging vs Production) - defaulting to sandbox for safety if not exposed
                const host = process.env.NEXT_PUBLIC_PAYTM_ENVIRONMENT === 'PRODUCTION' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
                const actionUrl = `https://${host}/theia/api/v1/showPaymentPage?mid=${response.mid}&orderId=${response.orderId}`;

                // Create a dynamic form to submit to Paytm directly 
                const form = document.createElement("form");
                form.method = "POST";
                form.action = actionUrl;

                const midInput = document.createElement("input");
                midInput.type = "hidden";
                midInput.name = "mid";
                midInput.value = response.mid;
                form.appendChild(midInput);

                const orderIdInput = document.createElement("input");
                orderIdInput.type = "hidden";
                orderIdInput.name = "orderId";
                orderIdInput.value = response.orderId;
                form.appendChild(orderIdInput);

                const txnTokenInput = document.createElement("input");
                txnTokenInput.type = "hidden";
                txnTokenInput.name = "txnToken";
                txnTokenInput.value = response.txnToken;
                form.appendChild(txnTokenInput);

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error("Payment initiation failed")
            }
        } catch (err: any) {
            setError(err.message || "Payment failed. Please try again.")
            setProcessing(false)
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
                    <Link href="/subscriptions" className="flex items-center gap-2 group">
                        <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent tracking-tight">
                            Shramik Seva
                        </span>
                    </Link>
                    <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" /> Back to Plans
                    </Button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight">Checkout</h1>
                    <p className="text-muted-foreground">Review your order and complete payment</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : plan ? (
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Order Summary */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="p-6 sm:p-8 bg-card/80 border-border/50 backdrop-blur-lg">
                                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                                <div className="p-4 rounded-xl bg-muted/50 border border-border/50 mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold">{plan.name}</h3>
                                        <span className="text-2xl font-bold text-primary">₹{plan.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Plan Features</h4>
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Breakdown */}
                                <div className="border-t border-border pt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Base Price</span>
                                        <span>₹{basePrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">GST @ 18%</span>
                                        <span>₹{gstAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                                        <span>Total Payable</span>
                                        <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Payment Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6 sm:p-8 bg-card/80 border-border/50 backdrop-blur-lg">
                                <h2 className="text-xl font-bold mb-6">Payment</h2>

                                {/* Payment Methods */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Accepted Methods</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["UPI (GPay, PhonePe)", "Debit / Credit Cards", "Net Banking", "Paytm Wallet"].map((method) => (
                                            <div key={method} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                                                <CreditCard className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                <span className="text-muted-foreground">{method}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Terms Agreement */}
                                <div className="mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-border accent-primary"
                                        />
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            I agree to the{" "}
                                            <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link>,{" "}
                                            <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, and{" "}
                                            <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>.
                                        </span>
                                    </label>
                                </div>

                                {/* Pay Button or Login Prompt */}
                                {!user ? (
                                    <Button
                                        onClick={() => router.push(`/auth/login?returnUrl=/checkout?plan=${planKey}`)}
                                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/20"
                                    >
                                        Login/Register to Continue
                                    </Button>
                                ) : user.role !== "employer" ? (
                                    <div className="p-4 text-center rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                                        Only employers can purchase subscriptions. Please login with an employer account.
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handlePayment}
                                        disabled={processing || !agreedToTerms}
                                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/20"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5 mr-2" /> Pay ₹{totalAmount.toLocaleString()}
                                            </>
                                        )}
                                    </Button>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    <span>Secured by Paytm Payment Gateway</span>
                                </div>
                            </Card>

                            <div className="text-center text-xs text-muted-foreground space-y-1">
                                <p>Payments are processed securely via Paytm PG.</p>
                                <p>We do not store card/banking details.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground mb-4">No plan selected.</p>
                        <Link href="/subscriptions">
                            <Button>View Plans</Button>
                        </Link>
                    </div>
                )}
            </div>

            <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8 bg-card/40 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">© 2026 Shramik Seva. All Rights Reserved. A subsidiary of SDR Security.</p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
                        <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
