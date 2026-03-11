"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/navigation"
import { Link } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, Briefcase, LayoutDashboard } from "lucide-react"
import { useTranslations } from "next-intl"

function PaymentStatusContent() {
    const t = useTranslations("Subscriptions")
    const tCommon = useTranslations("Common")
    const searchParams = useSearchParams()
    const router = useRouter()

    const status = searchParams.get("status")
    const orderId = searchParams.get("orderId")
    const txnId = searchParams.get("txnId")

    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        if (status === "success") {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        router.push("/dashboard/employer")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [status, router])

    const isSuccess = status === "success"

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl bg-card/80 backdrop-blur-lg">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        {isSuccess ? (
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle2 className="w-16 h-16 text-green-600" />
                            </div>
                        ) : (
                            <div className="bg-red-100 p-3 rounded-full">
                                <XCircle className="w-16 h-16 text-red-600" />
                            </div>
                        )}
                    </div>
                    <CardTitle className={`text-2xl font-bold ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                        {isSuccess ? t("status.successTitle") : t("status.failedTitle")}
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        {isSuccess
                            ? t("status.successMessage")
                            : t("status.failedMessage")}
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono font-medium">{orderId || "N/A"}</span>
                        </div>
                        {txnId && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transaction ID:</span>
                                <span className="font-mono font-medium">{txnId}</span>
                            </div>
                        )}
                    </div>

                    {isSuccess && (
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Redirecting to your dashboard in {countdown} seconds...
                        </p>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-6">
                    <Link href={isSuccess ? "/dashboard/employer" : "/subscriptions"} className="w-full">
                        <Button className="w-full gap-2 rounded-full">
                            {isSuccess ? (
                                <>
                                    <LayoutDashboard className="w-4 h-4" />
                                    Go to Dashboard
                                </>
                            ) : (
                                <>
                                    Try Again
                                </>
                            )}
                        </Button>
                    </Link>
                    <Link href="/subscriptions" className="w-full">
                        <Button variant="ghost" className="w-full rounded-full text-muted-foreground">
                            Return to Subscriptions
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <PaymentStatusContent />
        </Suspense>
    )
}
