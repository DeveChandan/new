"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useRouter } from "@/navigation"
import { toast } from "sonner"

interface WorklogAccessModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function WorklogAccessModal({ isOpen, onClose, onSuccess }: WorklogAccessModalProps) {
    const router = useRouter()
    const { user } = useAuth()
    const [purchasing, setPurchasing] = useState(false)

    const handlePurchaseAddon = async () => {
        setPurchasing(true)
        try {
            const orderId = `ADDON_${Date.now()}`;
            const response = await apiClient.initiatePaytmPayment({
                amount: 2499,
                orderId,
                customerId: user?._id || '',
                email: user?.email,
                phone: user?.mobile,
                planId: 'worklog_access',
                platform: 'web'
            });

            if (response.success) {
                const payUrl = `${API_ROOT_URL}/payments/paytm/pay?txnToken=${response.txnToken}&orderId=${response.orderId}&mid=${response.mid}`;
                window.location.href = payUrl;
            } else {
                throw new Error("Failed to initiate payment");
            }
        } catch (error: any) {
            console.error(error)
            toast.error("Purchase Failed", {
                description: error.message || "Something went wrong."
            })
        } finally {
            setPurchasing(false)
        }
    }

    const handleUpgrade = () => {
        onClose()
        router.push("/subscriptions")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
                        <Lock className="h-6 w-6 text-orange-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Restricted Access</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        View detailed worklogs, route history, and day-to-day verification with Worklog Access.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-orange-50/50 border-orange-100 hover:border-orange-200 transition-colors cursor-pointer" onClick={handlePurchaseAddon}>
                        <div className="space-y-1">
                            <p className="font-semibold text-orange-900">Buy 30-Day Pass</p>
                            <p className="text-sm text-orange-700">Unlock only worklogs</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-orange-900">₹2499</p>
                            <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs mt-1"
                                disabled={purchasing}
                                onClick={(e) => { e.stopPropagation(); handlePurchaseAddon(); }}
                            >
                                {purchasing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                {purchasing ? "Processing" : "Buy Now"}
                            </Button>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between p-4 border rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={handleUpgrade}>
                        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Best Value
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-foreground">Upgrade Plan</p>
                            <p className="text-sm text-muted-foreground">Get Plan with Worklogs</p>
                        </div>
                        <div className="text-right">
                            <Button variant="outline" size="sm" className="h-7 text-xs border-primary text-primary hover:bg-primary/10">
                                View Plans
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
                        No, thanks
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
