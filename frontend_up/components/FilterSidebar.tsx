import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Filter, X } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { workerTypeSkills, salaryRanges, experienceRanges } from "@/lib/worker-data";

interface FilterSidebarProps {
  onApplyFilters: (filters: {
    location?: string
    skills?: string[]
    minSalary?: number
    maxSalary?: number
    minExperience?: number
    maxExperience?: number
    workType?: "temporary" | "permanent" | "all"
  }) => void
  onResetFilters: () => void
  initialFilters?: {
    location?: string
    skills?: string[]
    minSalary?: number
    maxSalary?: number
    minExperience?: number
    maxExperience?: number
    workType?: "temporary" | "permanent" | "all"
  }
  isMobileOpen: boolean
  onCloseMobile: () => void
}

  export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  onApplyFilters,
  onResetFilters,
  initialFilters,
  isMobileOpen,
  onCloseMobile,
}) => {
  const t = useTranslations("Filters");
  const tWT = useTranslations("WorkerTypes");
  const tCommon = useTranslations("Common");

  const [location, setLocation] = useState(initialFilters?.location || "")
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialFilters?.skills || [])
  const [minSalary, setMinSalary] = useState<string>(initialFilters?.minSalary?.toString() || "")
  const [maxSalary, setMaxSalary] = useState<string>(initialFilters?.maxSalary?.toString() || "")
  const [minExperience, setMinExperience] = useState<string>(initialFilters?.minExperience?.toString() || "")
  const [maxExperience, setMaxExperience] = useState<string>(initialFilters?.maxExperience?.toString() || "")
  const [workType, setWorkType] = useState<"temporary" | "permanent" | "all">(initialFilters?.workType || "all")
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>("any");
  const [selectedExperienceRange, setSelectedExperienceRange] = useState<string>("any");

  const availableSkills = selectedWorkerType ? workerTypeSkills[selectedWorkerType] : [];

  useEffect(() => {
    setLocation(initialFilters?.location || "")
    setSelectedSkills(initialFilters?.skills || []);
    if (initialFilters?.skills && initialFilters.skills.length > 0) {
      let inferredWorkerType = "";
      for (const type in workerTypeSkills) {
        const allSkillsMatch = initialFilters.skills.every(skill => workerTypeSkills[type].includes(skill));
        if (allSkillsMatch) {
          inferredWorkerType = type;
          break;
        }
      }
      setSelectedWorkerType(inferredWorkerType);
    } else {
      setSelectedWorkerType("");
    }

    if (initialFilters?.minSalary !== undefined || initialFilters?.maxSalary !== undefined) {
      const matchingRange = salaryRanges.find(range =>
        range.min === initialFilters?.minSalary && range.max === initialFilters?.maxSalary
      );
      if (matchingRange) {
        setSelectedSalaryRange(matchingRange.key);
      } else {
        setSelectedSalaryRange("custom");
      }
    } else {
      setSelectedSalaryRange("any");
    }

    setMinSalary(initialFilters?.minSalary?.toString() || "")
    setMaxSalary(initialFilters?.maxSalary?.toString() || "")
    setMinExperience(initialFilters?.minExperience?.toString() || "")
    setMaxExperience(initialFilters?.maxExperience?.toString() || "")
    setWorkType(initialFilters?.workType || "all")
  }, [initialFilters])

  const handleApply = () => {
    onApplyFilters({
      location: location || undefined,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      minSalary: minSalary ? Number(minSalary) : undefined,
      maxSalary: maxSalary ? Number(maxSalary) : undefined,
      minExperience: minExperience ? Number(minExperience) : undefined,
      maxExperience: maxExperience ? Number(maxExperience) : undefined,
      workType: workType === "all" ? undefined : workType,
    })
    onCloseMobile()
  }

  const handleReset = () => {
    setLocation("")
    setSelectedWorkerType("")
    setSelectedSkills([])
    setSelectedSalaryRange("any")
    setSelectedExperienceRange("any")
    setMinSalary("")
    setMaxSalary("")
    setMinExperience("")
    setMaxExperience("")
    setWorkType("all")
    onResetFilters()
    onCloseMobile()
  }

  const handleSalaryRangeChange = (value: string) => {
    setSelectedSalaryRange(value);
    const range = salaryRanges.find(r => r.key === value);
    if (range) {
      setMinSalary(range.min !== undefined ? range.min.toString() : "");
      setMaxSalary(range.max !== undefined ? range.max.toString() : "");
    } else {
      setMinSalary("");
      setMaxSalary("");
    }
  };

  const handleExperienceRangeChange = (value: string) => {
    setSelectedExperienceRange(value);
    const range = experienceRanges.find(r => r.key === value);
    if (range) {
      setMinExperience(range.min !== undefined ? range.min.toString() : "");
      setMaxExperience(range.max !== undefined ? range.max.toString() : "");
    } else {
      setMinExperience("");
      setMaxExperience("");
    }
  };

  return (
    <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg relative">
       
      <h3 className="text-lg font-semibold text-foreground mb-4">{t('title')}</h3>
      {isMobileOpen && (
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 lg:hidden" onClick={onCloseMobile}>
          <X className="w-5 h-5" />
        </Button>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="filter-location" className="text-foreground font-semibold">
            {t('location')}
          </Label>
          <Input
            id="filter-location"
            placeholder={t('locationPlaceholder')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-2 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-full"
          />
        </div>

        <div>
          <Label htmlFor="filter-worker-type" className="text-foreground font-semibold">
            {t('workerType')}
          </Label>
          <Select value={selectedWorkerType} onValueChange={(value) => {
            setSelectedWorkerType(value);
            setSelectedSkills([]);
          }}>
            <SelectTrigger className="w-full mt-2 rounded-full">
              <SelectValue placeholder={t('workerTypePlaceholder')} />
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

        <div>
          <Label htmlFor="filter-skills" className="text-foreground font-semibold">
            {t('skills')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-2 rounded-full justify-between">
                {selectedSkills.length > 0 ? (
                  <span className="truncate">
                    {selectedSkills.join(", ")}
                  </span>
                ) : (
                  t('selectSkills')
                )}
                <Filter className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <div className="grid gap-1 p-2 h-48 overflow-y-auto">
                {availableSkills.length > 0 ? (
                  availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`popover-skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onChange={() => {
                          if (selectedSkills.includes(skill)) {
                            setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                          } else {
                            setSelectedSkills([...selectedSkills, skill]);
                          }
                        }}
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

        <div>
          <Label className="text-foreground font-semibold">{t('salaryRange')}</Label>
          <Select value={selectedSalaryRange} onValueChange={handleSalaryRangeChange}>
            <SelectTrigger className="w-full mt-2 rounded-full">
              <SelectValue placeholder={t('salaryRangePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {salaryRanges.map((range) => (
                <SelectItem key={range.key} value={range.key}>
                  {t(`salaryRangeLabels.${range.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-foreground font-semibold">{t('experienceRange')}</Label>
          <Select value={selectedExperienceRange} onValueChange={handleExperienceRangeChange}>
            <SelectTrigger className="w-full mt-2 rounded-full">
              <SelectValue placeholder={t('experienceRangePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {experienceRanges.map((range) => (
                <SelectItem key={range.key} value={range.key}>
                  {t(`experienceRangeLabels.${range.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-workType" className="text-foreground font-semibold">
            {t('workType')}
          </Label>
          <Select
            value={workType}
            onValueChange={(value) => setWorkType(value as "temporary" | "permanent" | "all")}
          >
            <SelectTrigger className="w-full mt-2 rounded-full">
              <SelectValue placeholder={t('allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              <SelectItem value="temporary">{t('temporary')}</SelectItem>
              <SelectItem value="permanent">{t('permanent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
        <Button onClick={handleApply} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
          {t('applyFilters')}
        </Button>
        <Button onClick={handleReset} variant="outline" className="w-full bg-transparent rounded-full">
          {t('resetFilters')}
        </Button>
      </div>
    </Card>
  )
}
