"use client"

import React, { Suspense, useState, useEffect, useRef } from "react"
import { Link, useRouter } from "@/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { setAuthToken, setUser } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Users,
  Loader2,
  Filter,
  Eye,
  EyeOff,
  Camera,
  MapPin,
  X,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Building2,
  Phone,
  Mail,
  Lock,
  IndianRupee,
  Check,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { workerTypeSkills } from "@/lib/worker-data"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-44 bg-muted/40 animate-pulse rounded-2xl flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Loading interactive location map...</span>
      </div>
    </div>
  )
})

function RegisterContent() {
  const t = useTranslations('Auth.register')
  const tCommon = useTranslations('Common')
  const tWT = useTranslations('WorkerTypes')
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get("role") || "worker") as "worker" | "employer"

  const [role, setRole] = useState<"worker" | "employer">(initialRole)
  // Worker has 3 steps (1: Basic Info, 2: Skills & Wages, 3: Work Location)
  // Employer has 2 steps (1: Credentials, 2: Company Profile)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isOtpStep, setIsOtpStep] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)

  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    profilePicture: "",
    skills: [] as string[],
    companyName: "",
    workerType: "",
    isFresher: false,
    experience: "",
    gender: "",
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    expectedSalaryPeriod: "monthly" as "monthly" | "daily",
    locationName: "",
    city: "",
    state: "",
    coordinates: null as [number, number] | null,
  })

  // Timer effect for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Redirect if already authenticated
  useEffect(() => {
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

  if (user) return null

  const totalSteps = role === "worker" ? 3 : 2
  const availableSkills = formData.workerType ? workerTypeSkills[formData.workerType] || [] : []

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMobileBlur = async () => {
    if (formData.mobile.length === 10) {
      try {
        const res = await apiClient.checkMobile(formData.mobile)
        if (res.exists) {
          toast.error(res.message)
        }
      } catch (err) {
        console.error("Error checking mobile:", err)
      }
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    try {
      setUploadingAvatar(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      const res: any = await apiClient.uploadFile(uploadFormData)
      if (res?.fileUrl) {
        setFormData(prev => ({ ...prev, profilePicture: res.fileUrl }))
        toast.success(role === "worker" ? (t('profilePhotoAdded') || "Profile photo uploaded successfully") : (t('companyLogoUploaded') || "Company logo uploaded successfully"))
      }
    } catch (err: any) {
      console.error("Avatar upload error:", err)
      toast.error(err.message || t('errors.avatarUploadFailed') || "Failed to upload photo")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview("")
    setFormData(prev => ({ ...prev, profilePicture: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSkillChange = (skill: string) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill]
      return { ...prev, skills: newSkills }
    })
  }

  const applySalaryPreset = (min: number, max: number) => {
    setFormData(prev => ({
      ...prev,
      expectedSalaryMin: min.toString(),
      expectedSalaryMax: max.toString()
    }))
  }

  // Step Validation logic
  const validateCurrentStep = async (): Promise<boolean> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const mobileRegex = /^[6-9]\d{9}$/

    if (role === "worker") {
      if (currentStep === 1) {
        if (!formData.name.trim()) {
          toast.error(t('errors.enterFullName') || "Please enter your full name.")
          return false
        }
        if (!formData.gender) {
          toast.error(t('errors.genderRequired') || "Please select your gender.")
          return false
        }
        if (!mobileRegex.test(formData.mobile)) {
          toast.error(t('errors.enterValidMobile') || "Please enter a valid 10-digit mobile number starting with 6-9.")
          return false
        }
        if (formData.email && !emailRegex.test(formData.email)) {
          toast.error(t('errors.enterValidEmail') || "Please enter a valid email address.")
          return false
        }
        if (formData.password && formData.password.length < 6) {
          toast.error(t('errors.passwordMinLength') || "Password must be at least 6 characters.")
          return false
        }

        // Quick mobile availability check
        try {
          const checkRes = await apiClient.checkMobile(formData.mobile)
          if (checkRes.exists) {
            toast.error(checkRes.message)
            return false
          }
        } catch (err) {
          console.error("Mobile check error:", err)
        }
        return true
      }

      if (currentStep === 2) {
        if (!formData.workerType) {
          toast.error(t('errors.selectPrimaryTrade') || "Please select your primary job trade.")
          return false
        }
        if (formData.skills.length === 0) {
          toast.error(t('errors.selectAtLeastOneSkill') || t('errors.addSkillAndType') || "Please select at least one skill.")
          return false
        }
        if (!formData.isFresher && !formData.experience) {
          toast.error(t('errors.experienceRequired') || "Please enter years of experience or check 'I am a fresher'.")
          return false
        }
        if (formData.expectedSalaryMin && formData.expectedSalaryMax) {
          const min = parseFloat(formData.expectedSalaryMin)
          const max = parseFloat(formData.expectedSalaryMax)
          if (max < min) {
            toast.error(t('errors.maxSalaryError') || "Maximum salary must be greater than or equal to minimum salary.")
            return false
          }
        }
        return true
      }

      if (currentStep === 3) {
        if (!formData.locationName) {
          toast.error(t('errors.pinpointLocation') || t('errors.locationRequired') || "Please pinpoint your work location on the map.")
          return false
        }
        return true
      }
    } else {
      // Employer flow
      if (currentStep === 1) {
        if (!formData.name.trim()) {
          toast.error(t('errors.enterRecruiterName') || "Please enter recruiter / contact person name.")
          return false
        }
        if (!mobileRegex.test(formData.mobile)) {
          toast.error(t('errors.enterValidMobile') || "Please enter a valid 10-digit mobile number.")
          return false
        }
        if (!formData.email || !emailRegex.test(formData.email)) {
          toast.error(t('errors.enterValidBusinessEmail') || "Please enter a valid business email address.")
          return false
        }
        if (!formData.password || formData.password.length < 6) {
          toast.error(t('errors.passwordMinLength') || "Password must be at least 6 characters.")
          return false
        }

        // Quick mobile availability check
        try {
          const checkRes = await apiClient.checkMobile(formData.mobile)
          if (checkRes.exists) {
            toast.error(checkRes.message)
            return false
          }
        } catch (err) {
          console.error("Mobile check error:", err)
        }
        return true
      }

      if (currentStep === 2) {
        if (!formData.companyName.trim()) {
          toast.error(t('errors.enterCompanyName') || "Please enter your company or business name.")
          return false
        }
        return true
      }
    }

    return true
  }

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // On final step -> initiate registration
      await handleInitiate()
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleInitiate = async () => {
    setLoading(true)
    try {
      await apiClient.registerInitiate({
        name: formData.name,
        email: formData.email ? formData.email : undefined,
        password: formData.password ? formData.password : undefined,
        role,
        mobile: formData.mobile,
        profilePicture: formData.profilePicture || undefined,
        skills: role === "worker" ? formData.skills : undefined,
        companyName: role === "employer" ? formData.companyName : undefined,
        workerType: role === "worker" ? [formData.workerType] : undefined,
        isFresher: role === "worker" ? formData.isFresher : undefined,
        experience: role === "worker" && !formData.isFresher ? Math.max(0, Number(formData.experience)) : undefined,
        gender: role === "worker" ? formData.gender : undefined,
        locationName: role === "worker" ? (formData.locationName || undefined) : undefined,
        city: role === "worker" ? (formData.city || undefined) : undefined,
        state: role === "worker" ? (formData.state || undefined) : undefined,
        location: role === "worker" && formData.coordinates ? {
          type: "Point",
          coordinates: formData.coordinates
        } : undefined,
        expectedSalary: role === "worker" && (formData.expectedSalaryMin || formData.expectedSalaryMax) ? {
          min: Math.max(0, Number(formData.expectedSalaryMin) || 0),
          max: Math.max(0, Number(formData.expectedSalaryMax) || 0),
          currency: 'INR',
          period: formData.expectedSalaryPeriod || 'monthly'
        } : undefined,
      })

      toast.success(tCommon('messages.otpSent'))
      setIsOtpStep(true)
      setCountdown(300)
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

  // Stepper labels
  const stepsConfig = role === "worker" 
    ? [
        { title: t('stepBasicProfile') || "Basic Profile", subtitle: t('stepNameContact') || "Name & Contact" },
        { title: t('stepSkillsWages') || "Skills & Wages", subtitle: t('stepTradeExp') || "Trade & Experience" },
        { title: t('stepWorkLocation') || "Work Location", subtitle: t('stepServiceAreaPin') || "Service Area Pin" }
      ]
    : [
        { title: t('stepAccountInfo') || "Account Info", subtitle: t('stepRecruiterLogin') || "Recruiter & Login" },
        { title: t('stepCompanyProfile') || "Company Profile", subtitle: t('stepBrandDetails') || "Brand & Details" }
      ]

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* Unified Single Div / Card */}
      <div className="bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300">
        
        {/* Header Section */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-border/50 bg-gradient-to-b from-muted/30 to-background/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{role === "worker" ? (t('jobSeekerReg') || "Job Seeker Registration") : (t('employerReg') || "Employer Registration")}</span>
            </div>

            {!isOtpStep && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/40">
                {t('stepCount', { current: currentStep, total: totalSteps }) || `Step ${currentStep} of ${totalSteps}`}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {isOtpStep ? (t('mobileVerification') || "Mobile Verification") : t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isOtpStep 
              ? (t('enterCodeSentTo', { mobile: formData.mobile }) || `Enter 6-digit code sent to +91 ${formData.mobile}`)
              : t('subtitle')}
          </p>

          {/* Role Switcher (Visible on Step 1 when not in OTP mode) */}
          {!isOtpStep && currentStep === 1 && (
            <div className="mt-5 grid grid-cols-2 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setRole("worker")
                  setCurrentStep(1)
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  role === "worker"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('worker')} / {t('jobSeeker') || "Job Seeker"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("employer")
                  setCurrentStep(1)
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  role === "employer"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('employer')} / {t('recruiter') || "Recruiter"}</span>
              </button>
            </div>
          )}

          {/* Interactive Stepper Bar (Hidden during OTP step) */}
          {!isOtpStep && (
            <div className="mt-6 pt-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Background Line */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full -z-0" />
                {/* Active Progress Fill Line */}
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300 -z-0"
                  style={{
                    width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                    maxWidth: 'calc(100% - 48px)'
                  }}
                />

                {stepsConfig.map((s, idx) => {
                  const stepNum = idx + 1
                  const isCompleted = currentStep > stepNum
                  const isActive = currentStep === stepNum

                  return (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        // Allow clicking back to already completed steps
                        if (isCompleted) {
                          setCurrentStep(stepNum)
                        }
                      }}
                      disabled={!isCompleted}
                      className="flex flex-col items-center gap-1.5 z-10 focus:outline-none disabled:cursor-default"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                          isCompleted
                            ? "bg-primary text-primary-foreground border-primary cursor-pointer hover:opacity-90"
                            : isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20 scale-110"
                            : "bg-background text-muted-foreground border-border"
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className={`text-[11px] font-semibold leading-tight ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {s.title}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step Body Content */}
        <div className="p-5 sm:p-8">
          {isOtpStep ? (
            /* OTP Verification Step */
            <OTPVerification
              mobile={formData.mobile}
              onVerify={handleVerifyOTP}
              onResend={handleInitiate}
              loading={loading}
              countdown={countdown}
              onBack={() => setIsOtpStep(false)}
            />
          ) : (
            <div className="space-y-6">
              
              {/* WORKER FLOW */}
              {role === "worker" && (
                <>
                  {/* WORKER STEP 1: Basic Profile */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <h2 className="text-base font-bold text-foreground">{t('personalDetails') || "Personal Details"}</h2>
                        <p className="text-xs text-muted-foreground">{t('personalDetailsDesc') || "Enter your basic identification and contact information."}</p>
                      </div>

                      {/* Circular Avatar Photo Upload */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-16 h-16 rounded-full border-2 border-dashed border-primary/50 hover:border-primary flex items-center justify-center overflow-hidden bg-background hover:bg-muted/40 transition-all cursor-pointer shrink-0 shadow-sm"
                        >
                          {uploadingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground mb-0.5">
                            {avatarPreview ? (t('profilePhotoAdded') || "Profile Photo Added") : (t('uploadProfilePicture') || "Profile Photo (Optional)")}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t('profilePhotoHint') || "A clear face photo gets 3x more job calls from employers."}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-xs rounded-full px-3"
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              {avatarPreview ? (t('changePhoto') || "Change Photo") : (t('uploadPhoto') || "Upload Photo")}
                            </Button>
                            {avatarPreview && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveAvatar}
                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-2.5"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                {t('remove') || "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <Label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-primary" />
                          {t('fullName')}*
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t('namePlaceholder')}
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                          disabled={loading}
                        />
                      </div>

                      {/* Gender 3-Pill Interactive Selector */}
                      <div>
                        <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                          {t('gender')}*
                        </Label>
                        <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
                          {['Male', 'Female', 'Other'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                                formData.gender === g
                                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                              }`}
                            >
                              <UserIcon className="w-3.5 h-3.5" />
                              <span>{g}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mobile & Email in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <Label htmlFor="mobile" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {tCommon('labels.mobile')}*
                          </Label>
                          <Input
                            id="mobile"
                            name="mobile"
                            placeholder="9876543210"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            onBlur={handleMobileBlur}
                            maxLength={10}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 font-mono"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {tCommon('labels.email')} (Optional)
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Password (Optional for workers) */}
                      <div>
                        <Label htmlFor="password" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Lock className="w-3.5 h-3.5 text-primary" />
                          {tCommon('labels.password')} (Optional)
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 pr-11"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {t('otpLoginNote') || "You can also log in anytime using fast Mobile OTP without setting a password."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* WORKER STEP 2: Skills & Work Preferences */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <h2 className="text-base font-bold text-foreground">{t('skillsPreferences') || "Skills & Work Preferences"}</h2>
                        <p className="text-xs text-muted-foreground">{t('skillsPreferencesDesc') || "Specify your primary trade, skills, experience, and wage expectations."}</p>
                      </div>

                      {/* Primary Trade */}
                      <div>
                        <Label htmlFor="workerType" className="text-xs font-semibold text-foreground mb-1.5 block">
                          {t('workerType')} ({t('primaryTrade') || "Primary Trade"})*
                        </Label>
                        <Select
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, workerType: value, skills: [] }))}
                          value={formData.workerType}
                          disabled={loading}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground rounded-xl h-11">
                            <SelectValue placeholder={t('selectWorkerType')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {Object.keys(workerTypeSkills).map((type) => (
                              <SelectItem key={type} value={type}>
                                {tWT(type as any) || type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Skills Multi-Select Popover */}
                      <div>
                        <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                          {t('skills')}* {formData.workerType ? `(for ${formData.workerType})` : ""}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              disabled={!formData.workerType || loading}
                              className="w-full justify-between bg-background border-border text-foreground font-normal rounded-xl h-11"
                            >
                              <span className="truncate">
                                {formData.skills.length > 0
                                  ? (t('skillsSelected', { count: formData.skills.length }) || `${formData.skills.length} skills selected`)
                                  : formData.workerType
                                  ? t('selectSkills')
                                  : t('noWorkerTypeSelected')}
                              </span>
                              <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] sm:w-[380px] p-2" align="start">
                            <div className="max-h-56 overflow-y-auto space-y-1">
                              {availableSkills.map((skill) => {
                                const isSelected = formData.skills.includes(skill)
                                return (
                                  <div
                                    key={skill}
                                    onClick={() => handleSkillChange(skill)}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground font-medium"
                                        : "hover:bg-muted text-foreground"
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "border-primary-foreground bg-primary-foreground text-primary" : "border-muted-foreground"}`}>
                                      {isSelected && <Check className="w-3 h-3" />}
                                    </div>
                                    <span>{skill}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Selected Skills Badge Chips */}
                        {formData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-24 overflow-y-auto p-1">
                            {formData.skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 font-medium"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => handleSkillChange(skill)}
                                  className="hover:bg-primary/20 rounded p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fresher vs Experience */}
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isFresher"
                            name="isFresher"
                            checked={formData.isFresher}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setFormData(prev => ({
                                ...prev,
                                isFresher: checked,
                                experience: checked ? "" : prev.experience
                              }))
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                            disabled={loading}
                          />
                          <Label htmlFor="isFresher" className="text-xs font-semibold cursor-pointer text-foreground">
                            {t('isFresher')}
                          </Label>
                        </div>

                        {!formData.isFresher && (
                          <div>
                            <Label htmlFor="experience" className="text-xs font-semibold text-foreground mb-1 block">
                              {t('yearsOfExperience')}*
                            </Label>
                            <Input
                              id="experience"
                              name="experience"
                              type="number"
                              min="0"
                              max="50"
                              placeholder={t('experiencePlaceholder')}
                              value={formData.experience}
                              onChange={handleInputChange}
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10"
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>

                      {/* Expected Salary Range */}
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5 text-primary" />
                            {t('expectedSalaryRange') || "Expected Salary (₹)"}
                          </Label>

                          {/* Monthly / Daily Toggle */}
                          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, expectedSalaryPeriod: 'monthly' }))}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                formData.expectedSalaryPeriod === 'monthly'
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {t('monthly') || "Monthly"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, expectedSalaryPeriod: 'daily' }))}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                formData.expectedSalaryPeriod === 'daily'
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {t('daily') || "Daily"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <Input
                            name="expectedSalaryMin"
                            type="number"
                            min="0"
                            placeholder={
                              formData.expectedSalaryPeriod === 'monthly'
                                ? t('minSalaryMonthlyPlaceholder') || 'Min (e.g. 15000)'
                                : t('minSalaryDailyPlaceholder') || 'Min (e.g. 500)'
                            }
                            value={formData.expectedSalaryMin}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 text-xs"
                            disabled={loading}
                          />
                          <Input
                            name="expectedSalaryMax"
                            type="number"
                            min="0"
                            placeholder={
                              formData.expectedSalaryPeriod === 'monthly'
                                ? t('maxSalaryMonthlyPlaceholder') || 'Max (e.g. 25000)'
                                : t('maxSalaryDailyPlaceholder') || 'Max (e.g. 900)'
                            }
                            value={formData.expectedSalaryMax}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 text-xs"
                            disabled={loading}
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formData.expectedSalaryPeriod === 'monthly' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(10000, 15000)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹10k - ₹15k
                              </button>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(15000, 25000)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹15k - ₹25k
                              </button>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(25000, 40000)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹25k - ₹40k
                              </button>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(40000, 60000)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹40k+
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(400, 600)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹400 - ₹600
                              </button>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(600, 900)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹600 - ₹900
                              </button>
                              <button
                                type="button"
                                onClick={() => applySalaryPreset(900, 1500)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                              >
                                ₹900 - ₹1.5k
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WORKER STEP 3: Work Location */}
                  {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            {t('workLocationRadius') || "Work Location & Travel Radius"}*
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {t('workLocationDesc') || "Pinpoint your service area on the map to receive job offers within your travel distance."}
                          </p>
                        </div>
                        {formData.city && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                            {formData.city} {formData.state ? `, ${formData.state}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Interactive Map */}
                      <LocationPicker
                        initialAddress={formData.locationName}
                        onLocationChange={(loc) => {
                          const parts = loc.address ? loc.address.split(',').map(p => p.trim()).filter(Boolean) : []
                          const detectedCity = parts.length > 0 ? parts[0] : ''
                          const detectedState = parts.length > 1 ? parts[1] : ''
                          setFormData(prev => ({
                            ...prev,
                            locationName: loc.address,
                            city: detectedCity,
                            state: detectedState,
                            coordinates: [loc.longitude, loc.latitude]
                          }))
                        }}
                      />

                      {formData.locationName && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/50">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">
                            {t('selectedLocation') || "Selected Location"}: <strong className="text-foreground">{formData.locationName}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* EMPLOYER FLOW */}
              {role === "employer" && (
                <>
                  {/* EMPLOYER STEP 1: Account & Credentials */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <h2 className="text-base font-bold text-foreground">{t('recruiterCredentials') || "Recruiter & Account Credentials"}</h2>
                        <p className="text-xs text-muted-foreground">{t('recruiterCredentialsDesc') || "Enter your contact and authentication details to manage your employer account."}</p>
                      </div>

                      {/* Contact Person Name */}
                      <div>
                        <Label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-primary" />
                          {t('contactPerson') || "Contact Person / HR Name"}*
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t('namePlaceholder')}
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                          disabled={loading}
                        />
                      </div>

                      {/* Mobile & Email in 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <Label htmlFor="mobile" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {tCommon('labels.mobile')}*
                          </Label>
                          <Input
                            id="mobile"
                            name="mobile"
                            placeholder="9876543210"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            onBlur={handleMobileBlur}
                            maxLength={10}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 font-mono"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            {tCommon('labels.email')}*
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="recruiter@company.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <Label htmlFor="password" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Lock className="w-3.5 h-3.5 text-primary" />
                          {tCommon('labels.password')}*
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 pr-11"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EMPLOYER STEP 2: Company Profile */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <h2 className="text-base font-bold text-foreground">{t('companyBusinessProfile') || "Company & Business Profile"}</h2>
                        <p className="text-xs text-muted-foreground">{t('companyProfileDesc') || "Showcase your organization to attract top-rated workers."}</p>
                      </div>

                      {/* Company Logo / Photo Upload */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary flex items-center justify-center overflow-hidden bg-background hover:bg-muted/40 transition-all cursor-pointer shrink-0 shadow-sm"
                        >
                          {uploadingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarPreview}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground mb-0.5">
                            {avatarPreview ? (t('companyLogoUploaded') || "Company Logo Uploaded") : (t('companyLogoPlaceholder') || "Company Logo / Avatar (Optional)")}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t('companyLogoHint') || "Add your logo to build trust and attract high-caliber workers."}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-xs rounded-full px-3"
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              {avatarPreview ? (t('changeLogo') || "Change Logo") : (t('uploadLogo') || "Upload Logo")}
                            </Button>
                            {avatarPreview && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveAvatar}
                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-2.5"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                {t('remove') || "Remove"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <Label htmlFor="companyName" className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          {t('companyName')}*
                        </Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          placeholder={t('companyPlaceholder')}
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                          disabled={loading}
                        />
                      </div>

                      {/* Employer Advantage Callout */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-background border border-primary/20 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold text-foreground">{t('whyRecruitTitle') || "Why Recruit on Shramik Seva?"}</h3>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                            <span>{t('advantage1') || "Direct connection to 10,000+ verified workers in minutes"}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">✓</span>
                            <span>{t('advantage2') || "GPS shift attendance, timesheets, and OTP work logs"}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                            <span>{t('advantage3') || "Zero brokerage commissions or hiring delays"}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Note on Job Site Locations */}
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-foreground">{t('jobSiteLocationsTitle') || "Job Site Locations:"}</strong> {t('jobSiteLocationsDesc') || "You do not need to provide an office location now. Whenever you post a job vacancy, you can specify each job site's exact address and map pin."}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        {!isOtpStep && (
          <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={loading}
                className="h-11 rounded-xl text-xs font-semibold px-4 gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('back') || tCommon('buttons.back') || "Back"}</span>
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('encryptedSecure') || "100% Encrypted & Secure"}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="ml-auto h-11 rounded-xl text-xs font-bold px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('creatingAccount')}</span>
                </>
              ) : currentStep < totalSteps ? (
                <>
                  <span>{t('next') || tCommon('buttons.next') || "Next"}: {stepsConfig[currentStep]?.title || (tCommon('buttons.continue') || "Continue")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>{t('continueToVerification') || "Continue to Mobile Verification"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Sign-In Link */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground mt-5">
        {t('haveAccount')}{" "}
        <Link href="/auth/login" className="text-primary hover:underline font-bold">
          {tCommon('buttons.signIn')}
        </Link>
      </p>
    </div>
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
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground">
          {t('enterOTP')} <strong className="text-foreground font-mono">+91 {mobile}</strong>
        </p>
      </div>

      <div>
        <Label htmlFor="otp" className="text-xs font-semibold text-foreground mb-2 block text-center">
          {t('enterOTP')}
        </Label>
        <Input
          id="otp"
          placeholder="••••••"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground h-14 text-center text-3xl tracking-[0.4em] font-mono rounded-2xl focus:ring-primary"
          maxLength={6}
          disabled={loading}
          autoFocus
        />
      </div>

      <Button
        onClick={() => onVerify(otp)}
        size="lg"
        disabled={loading || otp.length !== 6}
        className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{tCommon('messages.verifying')}</span>
          </>
        ) : (
          <>
            <span>{t('verifyCreateAccount')}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {t('editDetails') || "Edit Details"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={countdown > 0 || loading}
          className="text-xs text-primary font-semibold hover:bg-primary/10"
        >
          {countdown > 0 ? (t('resendCodeIn', { time: formatTime(countdown) }) || `Resend Code in ${formatTime(countdown)}`) : (t('resendCode') || 'Resend Code')}
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
