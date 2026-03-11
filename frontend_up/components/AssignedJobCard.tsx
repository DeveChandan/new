import React from "react"
import { Link } from "@/navigation"
import { Card } from "@/components/ui/card"
import { MapPin, Briefcase } from "lucide-react"
import { useTranslations } from "next-intl"

interface AssignedJobCardProps {
  job: any // Define a more specific type for job if possible
}

export const AssignedJobCard: React.FC<AssignedJobCardProps> = ({ job }) => {
  const t = useTranslations("Jobs");
  const tCommon = useTranslations("Common");

  return (
    <Link href={`/dashboard/worker/assigned-jobs/${job._id}`} className="block">
      <Card className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors hover:shadow-md cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground">{job.title}</h3>
          <div
            className={`text-xs px-2 py-1 rounded-full font-medium ${job.workType === "temporary"
              ? "bg-accent/20 text-accent-foreground"
              : "bg-primary/20 text-primary"
              }`}
          >
            {t(`workType.${job.workType}`)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{job.employer?.companyName || job.employer?.name || tCommon('companyFallback')}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location?.address ? job.location.address.split(',')[0].trim() : t('location')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span>{job.minExperience !== undefined && job.maxExperience !== undefined ? (
              job.minExperience === 0 && job.maxExperience === 0 ? (
                t('experience.na')
              ) : job.minExperience === 0 ? (
                t('experience.upTo', { max: job.maxExperience })
              ) : job.maxExperience === 0 ? (
                t('experience.from', { min: job.minExperience })
              ) : (
                t('experience.range', { min: job.minExperience, max: job.maxExperience })
              )
            ) : (
              t('experience.na')
            )}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-primary">
              ₹{job.salary.toLocaleString('en-IN')}<span className="text-[10px] text-muted-foreground font-medium ml-1">/ {job.workType === 'permanent' ? 'month' : 'day'}</span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
