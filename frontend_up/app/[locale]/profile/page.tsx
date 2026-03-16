"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import {
  Briefcase,
  Star,
  Edit2,
  Save,
  X,
  Loader2,
  LogOut,
  Menu,
  CheckCircle,
  Filter,
  MapPin,
  Users,
  Globe,
  FileText,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DocumentUploadSection } from "@/components/DocumentUploadSection"
import { useTranslations } from "next-intl"
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal"
import { workerTypeSkills } from "@/lib/worker-data"
import { INDIAN_STATES, EMPLOYEE_COUNT_OPTIONS, BUSINESS_TYPES } from "@/lib/constants"

export default function ProfilePage() {
  const t = useTranslations("Profile")
  const tCommon = useTranslations("Common")
  const tWT = useTranslations("WorkerTypes")
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = (await apiClient.getProfile()) as any
        setProfile(data)
        setFormData({
          ...data,
          experience: data.experience?.toString() || "",
          isFresher: data.isFresher || false,
          workerType: Array.isArray(data.workerType) ? data.workerType[0] || "" : data.workerType || "",
          skills: data.skills || [],
          companyDetails: data.companyDetails || { contactPerson: {}, address: {} },
          gender: data.gender || "",
          bio: data.bio || "",
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setSaving(true)
      setError("")
      try {
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append("file", file)

        const uploadResponse: any = await apiClient.uploadFile(formData)
        // Strip domain to save relative path (e.g., /uploads/filename.jpg)
        const newProfilePictureUrl = uploadResponse.fileUrl.replace(/^https?:\/\/[^\/]+/, "");

        setFormData((prev: any) => ({
          ...prev,
          profilePicture: newProfilePictureUrl,
        }))
        await apiClient.updateProfile({
          ...profile,
          profilePicture: newProfilePictureUrl,
        })
        setProfile((prev: any) => ({
          ...prev,
          profilePicture: newProfilePictureUrl,
        }))
      } catch (err: any) {
        setError(err.message || t("errorUpload"))
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError("")

    // Validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (formData.mobile && !mobileRegex.test(formData.mobile)) {
      setError(t("invalidMobile")); // Ensure you have this key or use raw string
      setSaving(false);
      return;
    }

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError(t("invalidEmail"));
      setSaving(false);
      return;
    }

    if (user?.role === 'employer') {
      const contactPerson = formData.companyDetails?.contactPerson;
      const phone = contactPerson?.phone?.trim();
      const email = contactPerson?.email?.trim();

      if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        setError("Invalid contact person phone number");
        setSaving(false);
        return;
      }
      if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        setError("Invalid contact person email address");
        setSaving(false);
        return;
      }
    }

    try {
      const dataToSave = {
        ...formData,
        bankDetails: formData.bankDetails || {},
        companyDetails: user?.role === 'employer' ? {
          ...formData.companyDetails,
          contactPerson: {
            ...formData.companyDetails?.contactPerson,
            phone: formData.companyDetails?.contactPerson?.phone?.trim() || "",
            email: formData.companyDetails?.contactPerson?.email?.trim() || ""
          },
          address: {
            ...formData.companyDetails?.address,
            street: formData.companyDetails?.address?.street?.trim() || "",
            city: formData.companyDetails?.address?.city?.trim() || "",
            state: formData.companyDetails?.address?.state || "",
            pincode: formData.companyDetails?.address?.pincode?.trim() || ""
          }
        } : formData.companyDetails,
        experience: formData.isFresher
          ? 0
          : formData.experience
            ? Math.max(0, Number(formData.experience))
            : undefined,
        isFresher: formData.isFresher,
      }
      await apiClient.updateProfile(dataToSave)
      setProfile(dataToSave)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getProfileImageUrl = (url: string | undefined) => {
    if (!url) return "";
    let cleanUrl = url;
    if (cleanUrl.startsWith('/http')) {
      cleanUrl = cleanUrl.substring(1);
    }
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const baseUrl = API_ROOT_URL;
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  }

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const availableSkills = useMemo(() => {
    return formData?.workerType ? workerTypeSkills[formData.workerType] || [] : []
  }, [formData?.workerType])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !profile || !formData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href={user?.role === 'employer' ? "/dashboard/employer" : "/dashboard/worker"}
            className="text-xl font-bold text-foreground flex items-center gap-2"
          >
            <img src="/logo.png" alt="Shramik Seva" className="w-8 h-8 object-contain drop-shadow-sm mr-2" />
            {tCommon("appName")}
          </Link>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 bg-transparent text-foreground rounded-full"
              >
                <LogOut className="w-4 h-4" />
                {tCommon("buttons.logout")}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu (Slider) */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 sm:hidden transition-opacity duration-300 ${isMobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMobileNavOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 h-full w-[280px] bg-card shadow-2xl p-6 transition-transform duration-300 ease-in-out border-l border-border ${isMobileNavOpen ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-lg text-primary">{tCommon('appName')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl py-6 h-auto"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 mb-10">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                {t("title")}
              </h1>
              {profile.isVerified && (
                <div className="bg-green-500/10 p-1.5 rounded-full border border-green-500/20">
                  <CheckCircle
                    className="w-5 h-5 text-green-500"
                  />
                </div>
              )}
              {user.role === 'employer' && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 ml-2">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-sm font-extrabold text-primary">{profile.rating?.toFixed(1) || "0.0"}</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">{t("manageInfo")}</p>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                setFormData(profile)
              }
              setIsEditing(!isEditing)
            }}
            className={`rounded-2xl h-12 px-6 font-bold shadow-lg transition-all active:scale-95 ${isEditing
              ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 shadow-none"
              : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/20"
              }`}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                {t("editProfile")}
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="p-6 sm:p-10 bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 mb-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-foreground">
                  {t("personalInfo")}
                </h2>
              </div>

              <div className="space-y-10">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-[2rem] bg-muted/30 border border-border/50">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-background shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <img
                        src={getProfileImageUrl(formData.profilePicture) || "/placeholder-user.jpg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <Edit2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <Label
                      htmlFor="profilePicture"
                      className="text-lg font-bold text-foreground block"
                    >
                      {t("profilePicture")}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="profilePicture"
                        type="file"
                        onChange={handleProfilePictureChange}
                        className="mt-2 bg-background border-border/50 rounded-xl max-w-xs"
                        disabled={saving}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm font-medium">
                        {t("uploadNew")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {t("fullName")}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="mobile" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {t("mobile")}
                    </Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      value={formData.mobile || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {t("location")}
                    </Label>
                    <Input
                      id="locationName"
                      name="locationName"
                      value={formData.locationName || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {tCommon("gender") || "Gender"}
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          gender: value,
                        }))
                      }
                      value={formData.gender || ""}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                        <SelectItem value="Male" className="rounded-xl my-1">Male</SelectItem>
                        <SelectItem value="Female" className="rounded-xl my-1">Female</SelectItem>
                        <SelectItem value="Other" className="rounded-xl my-1">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-3">
                      <Label htmlFor="bio" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                        {tCommon("about_me") || "About Me"}
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio || ""}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, bio: e.target.value }))}
                          className="bg-muted/50 border-border/50 text-foreground min-h-[120px] rounded-2xl px-5 py-4 transition-all font-medium disabled:opacity-70 resize-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <div className="bg-muted/30 border border-border/50 rounded-2xl p-5">
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {formData.bio || <span className="text-muted-foreground italic">No bio added yet.</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {user.role === "employer" && (
                  <div className="pt-6 border-t border-border/50 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label
                          htmlFor="companyName"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                        >
                          {t("companyName")}
                        </Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="businessType"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                        >
                          {t("businessType")}
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              businessType: value,
                            }))
                          }
                          value={formData.businessType || ""}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70">
                            <SelectValue placeholder="Select Business Type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="rounded-xl my-1">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="employeeCount"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                        >
                          {tCommon("employees") || "Employee Count"}
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                employeeCount: value
                              }
                            }))
                          }
                          value={formData.companyDetails?.employeeCount || ""}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70">
                            <SelectValue placeholder="Select Employee Count" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="rounded-xl my-1">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="foundedYear"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                        >
                          {tCommon("founded_year") || "Founded Year"}
                        </Label>
                        <Input
                          id="foundedYear"
                          type="number"
                          value={formData.companyDetails?.foundedYear || ""}
                          onChange={(e) => setFormData((prev: any) => ({
                            ...prev,
                            companyDetails: {
                              ...prev.companyDetails,
                              foundedYear: e.target.value ? parseInt(e.target.value) : ""
                            }
                          }))}
                          disabled={!isEditing}
                          placeholder="e.g. 2010"
                          className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Company Location
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3 sm:col-span-2">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Street Address</Label>
                          <Input
                            value={formData.companyDetails?.address?.street || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                address: { ...prev.companyDetails?.address, street: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="Building name, Street..."
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">City</Label>
                          <Input
                            value={formData.companyDetails?.address?.city || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                address: { ...prev.companyDetails?.address, city: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            placeholder="City"
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">State</Label>
                          <Select
                            onValueChange={(value) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                companyDetails: {
                                  ...prev.companyDetails,
                                  address: { ...prev.companyDetails?.address, state: value }
                                }
                              }))
                            }
                            value={formData.companyDetails?.address?.state || ""}
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/50 shadow-xl max-h-60">
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state} className="rounded-xl my-1">
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Pincode</Label>
                          <Input
                            value={formData.companyDetails?.address?.pincode || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                address: { ...prev.companyDetails?.address, pincode: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            maxLength={6}
                            placeholder="6 digits pincode"
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Contact Person
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Name</Label>
                          <Input
                            value={formData.companyDetails?.contactPerson?.name || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                contactPerson: { ...prev.companyDetails?.contactPerson, name: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Designation</Label>
                          <Input
                            value={formData.companyDetails?.contactPerson?.designation || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                contactPerson: { ...prev.companyDetails?.contactPerson, designation: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Phone</Label>
                          <Input
                            value={formData.companyDetails?.contactPerson?.phone || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                contactPerson: { ...prev.companyDetails?.contactPerson, phone: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            maxLength={10}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Email</Label>
                          <Input
                            value={formData.companyDetails?.contactPerson?.email || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                contactPerson: { ...prev.companyDetails?.contactPerson, email: e.target.value }
                              }
                            }))}
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gstNumber" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                        {t("gstNumber")}
                      </Label>
                      <Input
                        id="gstNumber"
                        name="gstNumber"
                        value={formData.gstNumber || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                      />
                    </div>

                    {/* Description & Website */}
                    <div className="pt-6 border-t border-border/50 space-y-8">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                          Company Description
                        </Label>
                        {isEditing ? (
                          <Textarea
                            value={formData.companyDetails?.description || ""}
                            onChange={(e) => setFormData((prev: any) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                description: e.target.value
                              }
                            }))}
                            placeholder="Describe your company..."
                            className="bg-muted/50 border-border/50 text-foreground min-h-[120px] rounded-2xl px-5 py-4 transition-all font-medium resize-none focus:ring-2 focus:ring-primary/20"
                          />
                        ) : (
                          <div className="bg-muted/30 border border-border/50 rounded-2xl p-5">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                              {formData.companyDetails?.description || <span className="text-muted-foreground italic">No description added yet.</span>}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Website
                          </Label>
                          {isEditing ? (
                            <Input
                              value={formData.companyDetails?.website || ""}
                              onChange={(e) => setFormData((prev: any) => ({
                                ...prev,
                                companyDetails: {
                                  ...prev.companyDetails,
                                  website: e.target.value
                                }
                              }))}
                              placeholder="https://example.com"
                              className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium"
                            />
                          ) : formData.companyDetails?.website ? (
                            <a
                              href={formData.companyDetails.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline font-medium px-1"
                            >
                              {formData.companyDetails.website}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <p className="text-muted-foreground italic px-1">Not added</p>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verification Status
                          </Label>
                          <div className="px-1">
                            {formData.companyDetails?.verificationStatus === 'verified' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                <CheckCircle className="w-4 h-4" /> Verified
                              </span>
                            ) : formData.companyDetails?.verificationStatus === 'rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                <X className="w-4 h-4" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Documents (GST Certificate, PAN Card) */}
                    {(formData.companyDetails?.documents?.gstCertificate || formData.companyDetails?.documents?.panCard) && (
                      <div className="pt-6 border-t border-border/50">
                        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Company Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {formData.companyDetails?.documents?.gstCertificate && (
                            <a
                              href={formData.companyDetails.documents.gstCertificate.startsWith('http') ? formData.companyDetails.documents.gstCertificate : `${API_ROOT_URL}${formData.companyDetails.documents.gstCertificate}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-foreground text-sm">GST Certificate</p>
                                <p className="text-xs text-muted-foreground">Click to view</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {formData.companyDetails?.documents?.panCard && (
                            <a
                              href={formData.companyDetails.documents.panCard.startsWith('http') ? formData.companyDetails.documents.panCard : `${API_ROOT_URL}${formData.companyDetails.documents.panCard}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-4 rounded-2xl bg-accent/5 dark:bg-accent/10 border border-accent/20 hover:bg-accent/10 dark:hover:bg-accent/20 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-accent" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-foreground text-sm">PAN Card</p>
                                <p className="text-xs text-muted-foreground">Click to view</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {user.role === "worker" && (
                  <div className="pt-6 border-t border-border/50 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label
                          htmlFor="workerType"
                          className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                        >
                          {t("workerType")}
                        </Label>
                        <Select
                          onValueChange={(value) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              workerType: value,
                              skills: [],
                            }))
                          }
                          value={formData.workerType || ""}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70">
                            <SelectValue
                              placeholder={t("selectWorkerType")}
                            />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {Object.keys(workerTypeSkills).map((type) => (
                              <SelectItem key={type} value={type} className="rounded-xl my-1">
                                {tWT(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="skills" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                          {t("skills")}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-14 rounded-2xl px-5 justify-between border-border/50 bg-muted/50 hover:bg-muted font-medium transition-all disabled:opacity-70"
                              disabled={!isEditing || !formData.workerType}
                            >
                              {formData.skills?.length > 0 ? (
                                <span className="truncate">
                                  {formData.skills.join(", ")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">{t("selectSkills")}</span>
                              )}
                              <Filter className="ml-2 h-4 w-4 text-primary" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-3 rounded-2xl shadow-2xl border-border/50">
                            <div className="grid gap-2 p-1 max-h-64 overflow-y-auto custom-scrollbar">
                              {availableSkills.length > 0 ? (
                                availableSkills.map((skill: string) => (
                                  <div
                                    key={skill}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => {
                                      if (!isEditing) return;
                                      const newSkills = formData.skills.includes(skill)
                                        ? formData.skills.filter((s: string) => s !== skill)
                                        : [...formData.skills, skill];
                                      setFormData((prev: any) => ({ ...prev, skills: newSkills }));
                                    }}
                                  >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.skills.includes(skill) ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-muted-foreground/30"}`}>
                                      {formData.skills.includes(skill) && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{skill}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground p-2 italic text-center">
                                  {t("noWorkerTypeSelected")}
                                </p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50 cursor-pointer group"
                          onClick={() => {
                            if (!isEditing) return;
                            setFormData((prev: any) => ({
                              ...prev,
                              isFresher: !prev.isFresher,
                              experience: !prev.isFresher ? "" : prev.experience,
                            }));
                          }}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.isFresher ? "bg-primary border-primary shadow-lg" : "border-muted-foreground/30"}`}>
                            {formData.isFresher && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <Label htmlFor="isFresher" className="text-sm font-bold text-foreground cursor-pointer group-hover:text-primary transition-colors">
                            {t("fresher")}
                          </Label>
                        </div>

                        {!formData.isFresher && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label
                              htmlFor="experience"
                              className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                            >
                              {t("yearsExperience")}
                            </Label>
                            <Input
                              id="experience"
                              name="experience"
                              type="number"
                              min="0"
                              value={formData.experience || ""}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="hourlyRate" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                          {t("workRate")}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold">₹</span>
                          <Input
                            id="hourlyRate"
                            name="hourlyRate"
                            type="number"
                            value={formData.hourlyRate || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl pl-10 pr-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-border/50 space-y-8">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold text-foreground">
                          {t("bankDetails")}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="bankName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                            {t("bankName")}
                          </Label>
                          <Input
                            id="bankName"
                            name="bankDetails.bankName"
                            value={formData.bankDetails?.bankName || ""}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                bankDetails: {
                                  ...prev.bankDetails,
                                  bankName: e.target.value,
                                },
                              }))
                            }
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="accountNumber"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1"
                          >
                            {t("accountNumber")}
                          </Label>
                          <Input
                            id="accountNumber"
                            name="bankDetails.accountNumber"
                            value={formData.bankDetails?.accountNumber || ""}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                bankDetails: {
                                  ...prev.bankDetails,
                                  accountNumber: e.target.value,
                                },
                              }))
                            }
                            disabled={!isEditing}
                            className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="ifscCode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                          {t("ifscCode")}
                        </Label>
                        <Input
                          id="ifscCode"
                          name="bankDetails.ifscCode"
                          value={formData.bankDetails?.ifscCode || ""}
                          onChange={(e) =>
                            setFormData((prev: any) => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails,
                                ifscCode: e.target.value,
                              },
                            }))
                          }
                          disabled={!isEditing}
                          className="bg-muted/50 border-border/50 text-foreground h-14 rounded-2xl px-5 transition-all font-medium disabled:opacity-70"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full h-16 bg-primary hover:bg-primary/95 text-primary-foreground rounded-[1.5rem] text-xl font-extrabold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] mt-10"
                  >
                    {saving ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{t("saving")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Save className="w-6 h-6" />
                        <span>{t("saveChanges")}</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Document Upload Section */}
            <div className="mt-12">
              <DocumentUploadSection />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-8 bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-primary/5 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                <Star className="w-8 h-8 fill-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {t("rating")}
              </h3>
              <div className="space-y-3">
                <div className="text-5xl font-black text-primary tracking-tighter">
                  {profile.rating?.toFixed(1) || "0.0"}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 transition-all duration-500 ${i < Math.floor(profile.rating || 0)
                        ? "fill-primary text-primary scale-110"
                        : "text-muted-foreground/30"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest pt-2">Average Score</p>
              </div>
            </Card>

            <Card className="p-8 bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-primary/5">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                {t("statistics")}
              </h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t("userRole")}
                  </p>
                  <p className="text-2xl font-black text-primary capitalize tracking-tight">
                    {user.role}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {t("accountCreated")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {user.role === "worker" && (
                <Link href="/dashboard/worker">
                  <Button className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold transition-all shadow-lg shadow-primary/5">
                    {t("viewDashboard")}
                  </Button>
                </Link>
              )}
              {user.role === "employer" && (
                <Link href="/dashboard/employer">
                  <Button className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl font-bold transition-all shadow-lg shadow-primary/5">
                    {t("viewDashboard")}
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="w-full h-14 bg-background border-border/50 rounded-2xl font-bold hover:bg-primary/10 hover:text-primary transition-all"
              >
                {t("downloadCV")}
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 bg-background border-border/50 rounded-2xl font-bold hover:bg-primary/10 hover:text-primary transition-all text-primary"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                {t("change_password") || "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  )
}