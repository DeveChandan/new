"use client"

import React from "react"

import { Suspense, useState } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { setAuthToken, setUser } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { ArrowRight, Briefcase, Users, Loader2, Filter, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { workerTypeSkills } from "@/lib/worker-data"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function RegisterContent() {
  const t = useTranslations('Auth.register')
  const tCommon = useTranslations('Common')
  const tWT = useTranslations('WorkerTypes')
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get("role") || "worker") as "worker" | "employer"

  const [role, setRole] = useState<"worker" | "employer">(initialRole)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const { user, isLoading } = useAuth()

  // Timer effect for OTP resend
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else if (user.role === "employer") {
        router.push("/dashboard/employer")
      } else {
        router.push("/jobs")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  // If user is already logged in, don't show the form
  if (user) return null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    skills: [] as string[],
    companyName: "",
    workerType: "",
    isFresher: false,
    experience: "",
    gender: "",
  })

  const availableSkills = formData.workerType ? workerTypeSkills[formData.workerType] : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMobileBlur = async () => {
    if (formData.mobile.length === 10) {
      try {
        const res = await apiClient.checkMobile(formData.mobile);
        if (res.exists) {
          toast.error(res.message);
        }
      } catch (err) {
        console.error("Error checking mobile:", err);
      }
    }
  }

  const handleSkillChange = (skill: string) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills: newSkills };
    });
  };

  const handleInitiate = async () => {
    if (!formData.name || !formData.mobile || (role === "employer" && (!formData.email || !formData.password))) {
      toast.error(t('errors.fillRequired'))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return
    }

    if (role === "worker" && (formData.skills.length === 0 || !formData.workerType)) {
      toast.error(t('errors.addSkillAndType'));
      return
    }
    if (role === "worker" && !formData.isFresher && !formData.experience) {
      toast.error(t('errors.experienceRequired'));
      return
    }
    if (role === "worker" && !formData.gender) {
      toast.error(t('errors.genderRequired'));
      return
    }

    setLoading(true)
    try {
      const checkRes = await apiClient.checkMobile(formData.mobile);
      if (checkRes.exists) {
        toast.error(checkRes.message);
        setLoading(false); // Ensure loading is reset if validation fails here
        return;
      }

      // Send OTP via backend MSG91 service
      await apiClient.registerInitiate({
        name: formData.name,
        email: formData.email ? formData.email : undefined,
        password: formData.password ? formData.password : undefined,
        role,
        mobile: formData.mobile,
        skills: role === "worker" ? formData.skills : undefined,
        companyName: role === "employer" ? formData.companyName : undefined,
        workerType: role === "worker" ? [formData.workerType] : undefined,
        isFresher: role === "worker" ? formData.isFresher : undefined,
        experience: role === "worker" && !formData.isFresher ? Math.max(0, Number(formData.experience)) : undefined,
        gender: role === "worker" ? formData.gender : undefined,
      })

      toast.success(tCommon('messages.otpSent'))
      setStep(2)
      setCountdown(300) // Start 5-minute timer
    } catch (err: any) {
      console.error('Error initiating registration:', err)
      toast.error(err.message || t('errors.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true)
    try {
      if (!otp || otp.length !== 6) {
        throw new Error(tCommon('validation.invalidFormat'))
      }

      // Verify OTP and complete registration
      const response: any = await apiClient.registerComplete({
        mobile: formData.mobile,
        otp,
      })

      setAuthToken(response.token)
      setUser(response)

      toast.success(tCommon('messages.registerSuccess'))

      if (response.role === "admin") {
        router.push("/admin/dashboard")
      } else if (response.role === "employer") {
        router.push("/dashboard/employer")
      } else {
        router.push("/jobs")
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err)
      toast.error(err.message || t('errors.otpVerificationFailed'))
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
        <CardContent className="space-y-6 sm:space-y-5">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => setRole("worker")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${role === "worker"
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border bg-muted/30 hover:border-primary/50"
                }`}
            >
              <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity ${role === "worker" ? "opacity-100" : ""}`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${role === "worker" ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className={`text-sm font-bold tracking-tight uppercase ${role === "worker" ? "text-primary" : "text-muted-foreground"}`}>
                  {t('worker')}
                </div>
              </div>
            </button>
            <button
              onClick={() => setRole("employer")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${role === "employer"
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border bg-muted/30 hover:border-primary/50"
                }`}
            >
              <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity ${role === "employer" ? "opacity-100" : ""}`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${role === "employer" ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}>
                  <Users className="w-6 h-6" />
                </div>
                <div className={`text-sm font-bold tracking-tight uppercase ${role === "employer" ? "text-primary" : "text-muted-foreground"}`}>
                  {t('employer')}
                </div>
              </div>
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  {t('fullName')}*
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t('namePlaceholder')}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-foreground">
                  {tCommon('labels.email')}{role === "employer" ? "*" : ""}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="mobile" className="text-foreground">
                  {tCommon('labels.mobile')}*
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  placeholder="1234567890"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  onBlur={handleMobileBlur}
                  maxLength={10}
                  className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  {tCommon('labels.password')}{role === "employer" ? "*" : ""}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
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

              {role === "worker" && (
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-foreground">
                    {t('gender')}*
                  </Label>
                  <Select
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    value={formData.gender}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full">
                      <SelectValue placeholder={t('selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === "worker" && (
                <div className="space-y-2">
                  <Label htmlFor="workerType" className="text-foreground">
                    {t('workerType')}*
                  </Label>
                  <Select
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, workerType: value, skills: [] }))}
                    value={formData.workerType}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full">
                      <SelectValue placeholder={t('selectWorkerType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(workerTypeSkills).map((type) => (
                        <SelectItem key={type} value={type}>
                          {tWT(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === "worker" && (
                <div>
                  <Label htmlFor="filter-skills" className="text-foreground font-semibold">
                    {t('skills')}*
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full mt-2 rounded-full justify-between" disabled={!formData.workerType}>
                        {formData.skills.length > 0 ? (
                          <span className="truncate">
                            {formData.skills.join(", ")}
                          </span>
                        ) : (
                          t('selectSkills')
                        )}
                        <Filter className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0" align="start">
                      <div className="grid gap-1 p-2 max-h-48 overflow-y-auto">
                        {availableSkills.length > 0 ? (
                          availableSkills.map((skill) => (
                            <div key={skill} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`popover-skill-${skill}`}
                                checked={formData.skills.includes(skill)}
                                onChange={() => handleSkillChange(skill)}
                                className="form-checkbox h-4 w-4 text-primary rounded"
                              />
                              <label htmlFor={`popover-skill-${skill}`} className="text-sm">
                                {skill}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('noWorkerTypeSelected')}</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {role === "worker" && (
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="isFresher"
                    name="isFresher"
                    checked={formData.isFresher}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFresher: e.target.checked, experience: e.target.checked ? "" : prev.experience }))}
                    disabled={loading}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <Label htmlFor="isFresher" className="text-foreground">
                    {t('isFresher')}
                  </Label>
                </div>
              )}

              {role === "worker" && !formData.isFresher && (
                <div>
                  <Label htmlFor="experience" className="text-foreground">
                    {t('yearsOfExperience')}*
                  </Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    placeholder={t('experiencePlaceholder')}
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                    disabled={loading}
                  />
                </div>
              )}

              {role === "employer" && (
                <div>
                  <Label htmlFor="companyName" className="text-foreground">
                    {t('companyName')}
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder={t('companyPlaceholder')}
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground mt-2 rounded-full"
                    disabled={loading}
                  />
                </div>
              )}

              <Button
                onClick={handleInitiate}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6 rounded-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  <>
                    {tCommon('buttons.continue')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <OTPVerification
              mobile={formData.mobile}
              onVerify={handleVerifyOTP}
              onResend={handleInitiate}
              loading={loading}
              countdown={countdown}
              onBack={() => setStep(1)}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('haveAccount')}{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              {tCommon('buttons.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div >
  )
}



function OTPVerification({
  mobile,
  onVerify,
  onResend,
  loading,
  countdown,
  onBack,
}: {
  mobile: string
  onVerify: (otp: string) => void
  onResend: () => void
  loading: boolean
  countdown: number
  onBack: () => void
}) {
  const t = useTranslations('Auth.register')
  const tCommon = useTranslations('Common')
  const [otp, setOtp] = useState("")

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">{t('otpSentTo', { mobile })}</p>
      </div>
      <div>
        <Label htmlFor="otp" className="text-foreground">
          {t('enterOTP')}
        </Label>
        <Input
          id="otp"
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.slice(0, 6))}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground mt-2 text-center text-2xl tracking-widest font-mono"
          maxLength={6}
          disabled={loading}
        />
      </div>
      <Button
        onClick={() => onVerify(otp)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {tCommon('messages.verifying')}
          </>
        ) : (
          <>
            {t('verifyCreateAccount')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
      <div className="flex flex-col gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full bg-transparent rounded-full"
        >
          {tCommon('buttons.back')}
        </Button>
        <Button
          variant="ghost"
          onClick={onResend}
          disabled={countdown > 0 || loading}
          className="w-full rounded-full text-sm text-primary hover:text-primary hover:bg-primary/5"
        >
          {countdown > 0 ? `Resend OTP in ${formatTime(countdown)}` : 'Resend OTP'}
        </Button>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}
