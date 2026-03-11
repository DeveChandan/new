"use client"

import React, { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { setAuthToken, setUser } from "@/lib/auth"
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('Auth.login')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const [loginMethod, setLoginMethod] = useState<"otp" | "email">("otp")
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Timer effect for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handleRequestOTP = async () => {
    setLoading(true)
    try {
      if (!mobile || mobile.length < 10) {
        throw new Error(t('errors.invalidMobile'))
      }

      // Send OTP via backend MSG91 service
      await apiClient.requestOTP(mobile)
      toast.success(t('otpSent'))
      setStep(2)
      setCountdown(300) // Start 5-minute timer
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      toast.error(err.message || t('errors.failedOTP'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setLoading(true)
    try {
      if (!otp || otp.length !== 6) {
        throw new Error(t('errors.invalidOTP'))
      }

      // Verify OTP with backend
      const response: any = await apiClient.verifyOTP({ mobile, otp })

      setAuthToken(response.token)
      setUser(response)

      toast.success(tCommon('messages.loginSuccess'))

      toast.success(tCommon('messages.loginSuccess'))

      if (returnUrl) {
        router.push(returnUrl)
      } else if (response.role === "admin") {
        router.push("/admin/dashboard")
      } else if (response.role === "employer") {
        router.push("/dashboard/employer")
      } else {
        router.push("/jobs")
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err)

      // Check if user needs to register
      if (err.message?.includes('not found') || err.message?.includes('register')) {
        toast.error('Account not found. Please register first.')
      } else {
        toast.error(err.message || t('errors.invalidOTP'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasswordLogin = async () => {
    setLoading(true)
    try {
      if (!email || !password) {
        throw new Error(t('errors.bothRequired'))
      }
      const response: any = await apiClient.loginUser({ email, password })
      setAuthToken(response.token)
      setUser(response)
      toast.success(tCommon('messages.loginSuccess'))
      if (returnUrl) {
        router.push(returnUrl)
      } else if (response.role === "admin") {
        router.push("/admin/dashboard")
      } else if (response.role === "employer") {
        router.push("/dashboard/employer")
      } else {
        router.push("/jobs")
      }
    } catch (err: any) {
      toast.error(err.message || t('errors.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card className="w-full bg-card/80 border-border/50 backdrop-blur-lg shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden border-t-primary/20">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center sm:text-left">
          <CardTitle className="text-2xl sm:text-3xl font-bold">{t('cardTitle')}</CardTitle>
          <CardDescription className="text-base text-balance">{t('cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col xs:flex-row justify-center gap-3 mb-8 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
            <Button
              variant={loginMethod === "otp" ? "default" : "ghost"}
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 rounded-xl h-12 text-base transition-all duration-300 ${loginMethod === "otp" ? "bg-primary shadow-lg shadow-primary/20 text-primary-foreground" : "hover:bg-primary/5"}`}
            >
              {t('mobileOTP')}
            </Button>
            <Button
              variant={loginMethod === "email" ? "default" : "ghost"}
              onClick={() => setLoginMethod("email")}
              className={`flex-1 rounded-xl h-12 text-base transition-all duration-300 ${loginMethod === "email" ? "bg-primary shadow-lg shadow-primary/20 text-primary-foreground" : "hover:bg-primary/5"}`}
            >
              {t('emailPassword')}
            </Button>
          </div>

          {loginMethod === "otp" && (
            step === 1 ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mobile" className="text-foreground">
                    {t('mobileNumber')}
                  </Label>
                  <Input
                    id="mobile"
                    placeholder={t('mobilePlaceholder')}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleRequestOTP}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {tCommon('messages.sending')}
                    </>
                  ) : (
                    <>
                      {t('requestOTP')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">{t('otpSentTo', { mobile })}</p>
                </div>
                <div>
                  <Label htmlFor="otp" className="text-foreground">
                    {t('enterOTP')}
                  </Label>
                  <Input
                    id="otp"
                    placeholder={t('otpPlaceholder')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 text-center text-2xl tracking-widest font-mono rounded-full"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {tCommon('messages.verifying')}
                    </>
                  ) : (
                    <>
                      {t('verifyLogin')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1)
                      setOtp("")
                    }}
                    className="w-full bg-transparent rounded-full"
                  >
                    {tCommon('buttons.back')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleRequestOTP}
                    disabled={countdown > 0 || loading}
                    className="w-full rounded-full text-sm text-primary hover:text-primary hover:bg-primary/5"
                  >
                    {countdown > 0 ? `Resend OTP in ${formatTime(countdown)}` : 'Resend OTP'}
                  </Button>
                </div>
              </div>
            )
          )}

          {loginMethod === "email" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground">
                  {t('emailAddress')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground">
                  {t('password')}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleEmailPasswordLogin}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('loggingIn')}
                  </>
                ) : (
                  <>
                    {tCommon('buttons.login')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('noAccount')}{" "}
            <Link href={`/auth/register${returnUrl ? `?returnUrl=${returnUrl}` : ''}`} className="text-primary hover:underline font-semibold">
              {tCommon('buttons.signUp')}
            </Link>
          </p>
        </CardContent>
      </Card>


    </div >
  )
}
