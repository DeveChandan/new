"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Loader2, MapPin } from "lucide-react"
import dynamic from 'next/dynamic'; // Import dynamic

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p>Loading map...</p> // Optional: Add a loading state
});
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from 'next-intl'

const workerTypeSkills: { [key: string]: string[] } = {
  "Security guards": [
    "Access Control", "Visitor Management", "Patrolling", "CCTV Monitoring", "Surveillance", "Incident Reporting", "Emergency Response", "Crowd Control", "Conflict Management", "Fire Safety Awareness", "Alarm Systems Handling", "Security Protocols", "Shift Management", "Team Supervision", "Risk Assessment", "Incident Investigation", "Report Writing", "Communication Skills", "Physical Fitness", "First Aid", "SOP Compliance"
  ],
  "Security Supervisor": [ // Keep this as it's a specific role, not a generic "guards"
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



export default function EditJobPage() {
  const t = useTranslations('Jobs.edit')
  const tCreate = useTranslations('Jobs.create')
  const tJobs = useTranslations('Jobs')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    salary: "",
    address: "",
    latitude: 0,
    longitude: 0,
    workType: "temporary" as "temporary" | "permanent",
    durationDays: "", // New
    totalOpenings: "", // New
    minExperience: "", // Add minExperience
    maxExperience: "", // Add maxExperience
    otpVerificationRequired: false,
    geoTaggingRequired: false,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    const fetchJobData = async () => {
      try {
        setLoading(true)
        const jobData = (await apiClient.getJobById(id)) as any
        if (user?._id !== jobData.employer?._id) {
          // If user is not the owner of the job, redirect
          router.push("/jobs")
          return
        }
        setFormData({
          ...jobData,
          address: jobData.location?.address || "",
          latitude: jobData.location?.latitude || 0,
          longitude: jobData.location?.longitude || 0,
          salary: jobData.salary.toString(),
          durationDays: jobData.durationDays?.toString() || "", // New
          totalOpenings: jobData.totalOpenings?.toString() || "1", // New, default to "1" if not set
          minExperience: jobData.minExperience?.toString() || "", // Add minExperience
          maxExperience: jobData.maxExperience?.toString() || "", // Add maxExperience
          otpVerificationRequired: jobData.otpVerificationRequired || false,
          geoTaggingRequired: jobData.geoTaggingRequired || false,
          skills: jobData.skills || [],
        })
        setSelectedWorkerType(jobData.workerType?.[0] || "");
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      fetchJobData()
    }
  }, [id, user, authLoading, router])

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
            const response = (await apiClient.reverseGeocode(latitude, longitude)) as any;
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
          setError("Unable to retrieve your current location. Please enable location services.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
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
        !formData.totalOpenings || // New validation
        (formData.workType === "temporary" && !formData.durationDays) || // New validation
        (formData.minExperience && !/^\d+$/.test(formData.minExperience)) || // Validate minExperience is a number
        (formData.maxExperience && !/^\d+$/.test(formData.maxExperience)) // Validate maxExperience is a number
      ) {
        throw new Error("Please fill all required fields and ensure experience is a number")
      }

      await apiClient.updateJob(id, {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        salary: Number(formData.salary),
        location: { address: formData.address, latitude: formData.latitude, longitude: formData.longitude },
        workType: formData.workType,
        durationDays: formData.workType === "temporary" ? Number(formData.durationDays) : undefined, // New field
        totalOpenings: Number(formData.totalOpenings), // New field
        minExperience: formData.minExperience ? Number(formData.minExperience) : undefined, // Add minExperience
        maxExperience: formData.maxExperience ? Number(formData.maxExperience) : undefined, // Add maxExperience
        otpVerificationRequired: formData.otpVerificationRequired,
        geoTaggingRequired: formData.geoTaggingRequired,
        workerType: [selectedWorkerType], // Pass workerType
      })

      router.push(`/jobs/${id}`)
    } catch (err: any) {
      setError(err.message || "Failed to update job")
    } finally {
      setLoading(false)
    }
  }





  const availableSkills = selectedWorkerType ? workerTypeSkills[selectedWorkerType] || [] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/jobs/${id}`} className="flex items-center gap-2 text-foreground hover:text-primary transition w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Job
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('sectionDescription')}</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>{t('sectionTitle')}</CardTitle>
            <CardDescription>{t('sectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-foreground">
                  {tCreate('jobTitle')} *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={tCreate('jobTitlePlaceholder')}
                  value={formData.title}
                  onChange={handleInputChange}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed"
                  disabled={true}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">
                  {tCreate('description')} *
                </Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder={tCreate('descriptionPlaceholder')}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground cursor-not-allowed"
                  disabled={true}
                />
              </div>

              <div>
                <Label className="text-foreground">{tCommon('labels.workerType')} *</Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedWorkerType(value);
                    setFormData((prev) => ({ ...prev, skills: [] }));
                  }}
                  value={selectedWorkerType}
                  disabled={true}
                >
                  <SelectTrigger className="bg-input border-border text-foreground placeholder:text-muted-foreground mt-2">
                    <SelectValue placeholder={tCommon('labels.workerType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(workerTypeSkills).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">{tCreate('requiredSkills')} *</Label>
                <Select
                  onValueChange={(value) => {
                    setFormData((prev) => {
                      const currentSkills = prev.skills;
                      if (currentSkills.includes(value)) {
                        return { ...prev, skills: currentSkills.filter((skill) => skill !== value) };
                      } else {
                        return { ...prev, skills: [...currentSkills, value] };
                      }
                    });
                  }}
                  value={formData.skills[0] || ""} // Keep this for initial display, but actual selection is handled by onValueChange
                  disabled={true}
                >
                  <SelectTrigger className="w-full mt-2 rounded-full">
                    <SelectValue placeholder="Select Skills">
                      {formData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.skills.map((skill) => (
                            <span key={skill} className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        tCreate('selectSkills')
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill)}
                            readOnly
                            className="form-checkbox h-4 w-4 text-primary rounded"
                          />
                          <span>{skill}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary" className="text-foreground">
                    {tCreate('salary')} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="salary"
                      name="salary"
                      type="number"
                      placeholder={tCreate('salaryPlaceholder')}
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed pr-20"
                      disabled={true}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-bold text-muted-foreground uppercase tracking-widest pt-2">
                      {formData.workType === 'permanent' ? '/ month' : '/ day'}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="workType" className="text-foreground">
                    {tCreate('workType')} *
                  </Label>
                  <select
                    id="workType"
                    name="workType"
                    value={formData.workType}
                    onChange={handleInputChange}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground mt-2 cursor-not-allowed"
                    disabled={true}
                  >
                    <option value="temporary">{tJobs('workType.temporary')}</option>
                    <option value="permanent">{tJobs('workType.permanent')}</option>
                  </select>
                </div>
                {/* New: Total Openings */}
                <div>
                  <Label htmlFor="totalOpenings" className="text-foreground">
                    {tCreate('totalOpenings')} *
                  </Label>
                  <Input
                    id="totalOpenings"
                    name="totalOpenings"
                    type="number"
                    placeholder={tCreate('openingsPlaceholder')}
                    value={formData.totalOpenings}
                    onChange={handleInputChange}
                    min="1"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed"
                    disabled={true}
                  />
                </div>
                {/* New: Min Experience */}
                <div>
                  <Label htmlFor="minExperience" className="text-foreground">
                    {tCreate('minExperience')}
                  </Label>
                  <Input
                    id="minExperience"
                    name="minExperience"
                    type="number"
                    placeholder={tCreate('experiencePlaceholder')}
                    value={formData.minExperience}
                    onChange={handleInputChange}
                    min="0"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed"
                    disabled={true}
                  />
                </div>
                {/* New: Max Experience */}
                <div>
                  <Label htmlFor="maxExperience" className="text-foreground">
                    {tCreate('maxExperience')}
                  </Label>
                  <Input
                    id="maxExperience"
                    name="maxExperience"
                    type="number"
                    placeholder="5"
                    value={formData.maxExperience}
                    onChange={handleInputChange}
                    min="0"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed"
                    disabled={true}
                  />
                </div>
                {/* New: Duration Days (only for temporary jobs) */}
                {formData.workType === "temporary" && (
                  <div>
                    <Label htmlFor="durationDays" className="text-foreground">
                      {tCreate('durationDays')}*
                    </Label>
                    <Input
                      id="durationDays"
                      name="durationDays"
                      type="number"
                      placeholder="30"
                      value={formData.durationDays}
                      onChange={handleInputChange}
                      min="1"
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-2 cursor-not-allowed"
                      disabled={true}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-foreground">
                  {tCreate('locationDetails')} *
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="address"
                    name="address"
                    placeholder={tCreate('addressPlaceholder')}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground flex-grow"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="secondary" // Changed from "outline" to "secondary"
                    onClick={handleUseCurrentLocation}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {tCreate('useLocation')}
                  </Button>
                </div>
                <div className="mt-4">
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="otpVerificationRequired"
                  name="otpVerificationRequired"
                  checked={formData.otpVerificationRequired}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otpVerificationRequired: e.target.checked }))}
                  disabled={true}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-not-allowed"
                />
                <Label htmlFor="otpVerificationRequired" className="text-foreground">
                  {tCreate('otpRequired')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="geoTaggingRequired"
                  name="geoTaggingRequired"
                  checked={formData.geoTaggingRequired}
                  onChange={(e) => setFormData((prev) => ({ ...prev, geoTaggingRequired: e.target.checked }))}
                  disabled={true}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-not-allowed"
                />
                <Label htmlFor="geoTaggingRequired" className="text-foreground">
                  {tCreate('geoRequired')}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  t('updateJob')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
