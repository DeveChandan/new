"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Loader2, MapPin } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import dynamic from 'next/dynamic';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslations } from 'next-intl'
import { SubscriptionModal } from "@/components/SubscriptionModal"
import UpgradePrompt from "@/components/UpgradePrompt"
import { useEffect } from "react"

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
});

const workerTypeSkills: { [key: string]: string[] } = {
  "Security guards": [
    "Access Control", "Visitor Management", "Patrolling", "CCTV Monitoring", "Surveillance", "Incident Reporting", "Emergency Response", "Crowd Control", "Conflict Management", "Fire Safety Awareness", "Alarm Systems Handling", "Security Protocols", "Shift Management", "Team Supervision", "Risk Assessment", "Incident Investigation", "Report Writing", "Communication Skills", "Physical Fitness", "First Aid", "SOP Compliance"
  ],
  "Security Supervisor": [
    "Access Control", "Visitor Management", "Patrolling", "CCTV Monitoring", "Surveillance", "Incident Reporting", "Emergency Response", "Crowd Control", "Conflict Management", "Fire Safety Awareness", "Alarm Systems Handling", "Security Protocols", "Shift Management", "Team Supervision", "Risk Assessment", "Incident Investigation", "Report Writing", "Communication Skills", "Physical Fitness", "First Aid", "SOP Compliance"
  ],
  "Housekeepers": [
    "Cleaning & Sanitization", "Floor Cleaning", "Washroom Cleaning", "Waste Management", "Linen Handling", "Chemical Handling", "Housekeeping Equipment Operation", "Room Maintenance", "Deep Cleaning", "Hygiene Standards", "Inventory Management", "Time Management", "Attention to Detail"
  ],
  "Facility Manager": [
    "Facility Operations", "Maintenance Planning", "Vendor Management", "Asset Management", "Preventive Maintenance", "HVAC Knowledge", "Electrical & Plumbing Basics", "Budgeting", "Safety Compliance", "AMC Management", "Team Coordination", "Space Management", "Soft Services Management", "Hard Services Management", "SLA Monitoring", "Documentation"
  ],
  "Electricians": [
    "Wiring Installation", "Electrical Maintenance", "Panel Board Handling", "Circuit Breaker Installation", "Fault Detection", "Electrical Repair", "Power Tools Usage", "Load Calculation", "Earthing", "Lighting Systems", "Industrial Electrical Work", "Residential Electrical Work", "Safety Compliance", "Multimeter Usage"
  ],
  "Plumbers": [
    "Pipe Fitting", "Leakage Detection", "Drainage Systems", "Water Supply Systems", "Sanitary Installation", "Tap & Valve Repair", "Bathroom Fittings", "Sewage Systems", "Plumbing Tools Usage", "Pressure Testing", "Maintenance & Repair", "Blueprint Reading"
  ],
  "Liftman": [
    "Elevator Operation", "Passenger Assistance", "Safety Procedures", "Emergency Handling", "Lift Controls Knowledge", "Daily Lift Checks", "Communication Skills", "Crowd Handling", "Basic Troubleshooting", "SOP Compliance"
  ],
  "Fireman": [
    "Fire Fighting", "Fire Extinguisher Handling", "Fire Alarm Systems", "Emergency Evacuation", "Rescue Operations", "Fire Safety Inspection", "Disaster Management", "First Aid, PPE Handling", "Risk Assessment", "Incident Reporting"
  ],
  "Gardener": [
    "Plant Care", "Lawn Maintenance", "Pruning", "Landscaping", "Irrigation Systems", "Fertilization", "Pest Control", "Soil Preparation", "Gardening Tools Usage", "Nursery Management", "Seasonal Plantation", "Outdoor Maintenance"
  ],
  "Pantry Boy": [
    "Pantry Management", "Tea & Coffee Preparation", "Food Hygiene", "Utensil Cleaning", "Stock Replenishment", "Office Service Etiquette", "Time Management", "Basic Cooking", "Waste Disposal", "Cleanliness Maintenance"
  ],
  "Nurse": [
    "Patient Care", "Vital Signs Monitoring", "Medication Administration", "Wound Dressing", "Injection Handling", "IV Management", "Patient Hygiene Care", "Medical Documentation", "Emergency Care", "Infection Control", "Equipment Handling", "Compassionate Care"
  ],
  "Aya": [
    "Patient Assistance", "Elderly Care", "Child Care", "Bedside Assistance", "Feeding Support", "Hygiene Maintenance", "Mobility Support", "Basic First Aid", "Emotional Support", "Cleanliness Maintenance"
  ],
  "Carpenters": [
    "Wood Cutting", "Furniture Making", "Installation Work", "Repair & Maintenance", "Measurement & Marking", "Blueprint Reading", "Modular Furniture Assembly, Power Tools Usage", "Polishing & Finishing", "Safety Practices"
  ],
  "Welders": [
    "Arc Welding", "Gas Welding", "MIG Welding", "TIG Welding", "Fabrication Work", "Metal Cutting", "Blueprint Reading", "Welding Equipment Handling", "Safety Procedures", "Structural Welding", "Repair Welding"
  ],
  "Electronic mechanic": [
    "Electronic Repair", "Circuit Analysis", "PCB Repair", "Soldering", "Electronic Testing", "Troubleshooting", "Component Replacement", "Use of Testing Instruments", "Consumer Electronics Repair", "Industrial Electronics Basics"
  ],
  "Motor mechanic": [
    "Engine Repair", "Vehicle Maintenance", "Brake Systems", "Clutch Repair", "Transmission Systems", "Electrical Diagnostics", "Oil Change", "Suspension Systems", "Vehicle Inspection", "Tool Handling", "Fault Diagnosis"
  ],
  "Swimming trainer": [
    "Swimming Instruction", "Water Safety", "Lifesaving Techniques", "CPR", "Stroke Training", "Beginner Coaching", "Advanced Coaching", "Pool Safety Rules", "Fitness Training", "Child Training", "Adult Training"
  ],
  "WTP / STP operator": [
    "Water Treatment Process", "Sewage Treatment Process", "Chemical Dosing", "Pump Operation", "Valve Operation", "Plant Monitoring", "Water Quality Testing", "Equipment Maintenance", "Safety Compliance", "Log Book Maintenance", "Process Optimization"
  ],
  "Accountant": [
    "Bookkeeping", "Tally", "GST Filing", "Taxation", "Payroll Management", "Financial Reporting", "Balance Sheet Preparation", "Accounts Receivable", "Accounts Payable", "Audit Support", "Excel Skills", "Compliance Management"
  ],
  "Rajmistri (Masons)": [
    "Bricklaying", "Plastering", "Concreting", "Tiling", "Stone Masonry", "Blueprint Reading", "Material Estimation", "Safety Practices", "Finishing Work", "Formwork"
  ],
  "Any skilled/unskilled workers": [
    "General Maintenance", "Helper Work", "Machine Operation", "Manual Labor", "Cleaning Assistance", "Tool Handling", "Safety Awareness", "Basic Electrical Knowledge", "Basic Plumbing Knowledge", "Team Support", "Physical Work"
  ]
};

export default function CreateJobPage() {
  const t = useTranslations('Jobs.create')
  const tJobs = useTranslations('Jobs')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("")
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<'databaseUnlocks' | 'activeJobs'>('activeJobs')
  const [limitData, setLimitData] = useState<{ limit: number; used: number; plan: string } | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    salary: "",
    address: "",
    latitude: 0,
    longitude: 0,
    workType: "temporary" as "temporary" | "permanent",
    durationDays: "",
    totalOpenings: "1",
    minExperience: "",
    maxExperience: "",
    otpVerificationRequired: false,
    geoTaggingRequired: false,
  })

  // Check subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await apiClient.getCurrentSubscription() as any
        if (response && new Date(response.endDate) >= new Date()) {
          setHasSubscription(true)
        } else {
          setHasSubscription(false)
        }
      } catch (error) {
        // No subscription or error fetching
        setHasSubscription(false)
      } finally {
        setSubscriptionLoading(false)
      }
    }
    checkSubscription()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = (await apiClient.reverseGeocode(latitude, longitude)) as any
            setFormData((prev) => ({
              ...prev,
              address: response.address,
              latitude,
              longitude,
            }));
            setError("");
          } catch (err: any) {
            setError(err.message || "Failed to get address from coordinates.");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting current position:", error);
          setError(t('errors.locationFetch'));
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError(t('errors.noGeoSupport'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (
        !formData.title ||
        !formData.description ||
        formData.skills.length === 0 ||
        !selectedWorkerType ||
        !formData.salary ||
        !formData.address ||
        !formData.totalOpenings ||
        (formData.workType === "temporary" && !formData.durationDays) ||
        (formData.minExperience && !/^\d+$/.test(formData.minExperience)) ||
        (formData.maxExperience && !/^\d+$/.test(formData.maxExperience))
      ) {
        throw new Error(t('create.errors.fillRequired'))
      }

      await apiClient.createJob({
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        salary: Number(formData.salary),
        location: { address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
        workType: formData.workType,
        durationDays: formData.workType === "temporary" ? Number(formData.durationDays) : undefined,
        totalOpenings: Number(formData.totalOpenings),
        minExperience: formData.minExperience ? Number(formData.minExperience) : undefined,
        maxExperience: formData.maxExperience ? Number(formData.maxExperience) : undefined,
        otpVerificationRequired: formData.otpVerificationRequired,
        geoTaggingRequired: formData.geoTaggingRequired,
        workerType: [selectedWorkerType],
      })

      toast.success(t('success'))
      router.push("/jobs")
    } catch (err: any) {
      // Check if error is due to missing subscription or limits
      if (err.response?.data?.requiresSubscription) {
        setShowSubscriptionModal(true)
        setError("")
      } else if (err.response?.data?.requiresUpgrade || err.response?.data?.requiresJobClose) {
        setUpgradeFeature('activeJobs')
        setLimitData({
          limit: err.response.data.maxActiveJobs || err.response.data.limit,
          used: err.response.data.activeJobsCount || err.response.data.used,
          plan: err.response.data.currentPlan
        })
        setShowUpgradePrompt(true)
        setError("")
      } else {
        toast.error(err.message || t('create.errors.postFailed'))
        setError(err.message || t('errors.postFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const availableSkills = selectedWorkerType ? workerTypeSkills[selectedWorkerType] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/employer/jobs" className="flex items-center gap-2 text-foreground hover:text-primary transition group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">{t('backToJobs')}</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
        </div>

        <Card className="bg-card/80 border-border/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t('sectionTitle')}</CardTitle>
            <CardDescription className="text-sm">{t('sectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                  {t('jobTitle')} *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={t('jobTitlePlaceholder')}
                  value={formData.title}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                  {t('description')} *
                </Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder={t('descriptionPlaceholder')}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  disabled={loading}
                />
              </div>

              {/* Worker Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{tCommon('labels.workerType')} *</Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedWorkerType(value);
                    setFormData((prev) => ({ ...prev, skills: [] }));
                  }}
                  value={selectedWorkerType}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder={tCommon('labels.workerType')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.keys(workerTypeSkills).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('requiredSkills')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-between bg-background/50 border-border/50 hover:bg-background/80 hover:border-primary/50 transition-colors font-normal"
                      disabled={!selectedWorkerType || loading}
                    >
                      {formData.skills.length > 0 ? (
                        <span className="truncate text-left flex-1">
                          {formData.skills.join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t('selectSkills')}</span>
                      )}
                      <span className="ml-2 text-muted-foreground">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="max-h-64 overflow-y-auto p-2">
                      {availableSkills.length > 0 ? (
                        availableSkills.map((skill) => (
                          <div
                            key={skill}
                            className="flex items-center gap-3 p-2.5 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer"
                            onClick={() => {
                              setFormData((prev) => {
                                const currentSkills = prev.skills;
                                if (currentSkills.includes(skill)) {
                                  return { ...prev, skills: currentSkills.filter((s) => s !== skill) };
                                } else {
                                  return { ...prev, skills: [...currentSkills, skill] };
                                }
                              });
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`skill-${skill}`}
                              checked={formData.skills.includes(skill)}
                              onChange={() => { }}
                              className="form-checkbox h-4 w-4 text-primary rounded border-border"
                            />
                            <label htmlFor={`skill-${skill}`} className="text-sm flex-1 cursor-pointer">
                              {skill}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 text-center">{t('selectWorkerTypeFirst')}</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Salary and Work Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-sm font-semibold text-foreground">
                    {t('salary')} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="salary"
                      name="salary"
                      type="number"
                      placeholder={t('salaryPlaceholder')}
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50 pr-20"
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {formData.workType === 'permanent' ? '/ month' : '/ day'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workType" className="text-sm font-semibold text-foreground">
                    {t('workType')} *
                  </Label>
                  <select
                    id="workType"
                    name="workType"
                    value={formData.workType}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-background/50 border border-border/50 rounded-lg px-3 text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    disabled={loading}
                  >
                    <option value="temporary">{tJobs('workType.temporary')}</option>
                    <option value="permanent">{tJobs('workType.permanent')}</option>
                  </select>
                </div>
              </div>

              {/* Total Openings, Min/Max Experience, Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalOpenings" className="text-sm font-semibold text-foreground">
                    {t('totalOpenings')} *
                  </Label>
                  <Input
                    id="totalOpenings"
                    name="totalOpenings"
                    type="number"
                    placeholder={t('openingsPlaceholder')}
                    value={formData.totalOpenings}
                    onChange={handleInputChange}
                    min="1"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minExperience" className="text-sm font-semibold text-foreground">
                    {t('minExperience')}
                  </Label>
                  <Input
                    id="minExperience"
                    name="minExperience"
                    type="number"
                    placeholder="0"
                    value={formData.minExperience}
                    onChange={handleInputChange}
                    min="0"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxExperience" className="text-sm font-semibold text-foreground">
                    {t('maxExperience')}
                  </Label>
                  <Input
                    id="maxExperience"
                    name="maxExperience"
                    type="number"
                    placeholder="5"
                    value={formData.maxExperience}
                    onChange={handleInputChange}
                    min="0"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Duration (conditional) */}
              {formData.workType === "temporary" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="durationDays" className="text-sm font-semibold text-foreground">
                    {t('durationDays')} *
                  </Label>
                  <Input
                    id="durationDays"
                    name="durationDays"
                    type="number"
                    placeholder="30"
                    value={formData.durationDays}
                    onChange={handleInputChange}
                    min="1"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    disabled={loading}
                  />
                </div>
              )}

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-foreground">
                  {t('locationDetails')} *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    name="address"
                    placeholder={t('addressPlaceholder')}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50 flex-grow"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUseCurrentLocation}
                    disabled={loading}
                    className="h-11 shrink-0"
                  >
                    <MapPin className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('useLocation')}</span>
                  </Button>
                </div>
                <div className="mt-4 rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                  <LocationPicker
                    initialAddress={formData.address}
                    initialLatitude={formData.latitude}
                    initialLongitude={formData.longitude}
                    onLocationChange={(location) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="otpVerificationRequired"
                    name="otpVerificationRequired"
                    checked={formData.otpVerificationRequired}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otpVerificationRequired: e.target.checked }))}
                    disabled={loading}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <Label htmlFor="otpVerificationRequired" className="text-sm font-medium text-foreground cursor-pointer">
                    {t('otpRequired')}
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="geoTaggingRequired"
                    name="geoTaggingRequired"
                    checked={formData.geoTaggingRequired}
                    onChange={(e) => setFormData((prev) => ({ ...prev, geoTaggingRequired: e.target.checked }))}
                    disabled={loading}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <Label htmlFor="geoTaggingRequired" className="text-sm font-medium text-foreground cursor-pointer">
                    {t('geoRequired')}
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('posting')}</span>
                  </div>
                ) : (
                  <span>{t('postJob')}</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div >
  )
}
