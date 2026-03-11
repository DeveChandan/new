"use client"

import { Link } from "@/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Briefcase, IndianRupee, Sparkles, Building2, ArrowRight, Users, Clock, ChartBar } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Badge } from "@/components/ui/badge"

interface CompactJobCardProps {
    job: any;
    isRecommended?: boolean;
}

export function CompactJobCard({ job, isRecommended = false }: CompactJobCardProps) {
    const tCard = useTranslations('JobCard')
    const tCommon = useTranslations('Common')
    const tJobs = useTranslations('Jobs')

    return (
        <Link href={`/jobs/${job._id}`} className="block h-full group">
            <Card className={`h-full relative overflow-hidden border transition-all duration-500 rounded-[2rem] bg-card/40 backdrop-blur-xl
        ${isRecommended
                    ? 'border-primary/30 shadow-xl shadow-primary/5 hover:border-primary/60 hover:shadow-primary/20 hover:-translate-y-2'
                    : 'border-border/40 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5'
                }
      `}>
                {/* Background Glow for Recommended */}
                {isRecommended && (
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
                )}
                {/* Decorator for Recommended */}
                {isRecommended && (
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity z-10">
                        <Sparkles className="w-4 h-4 text-primary fill-primary/10" />
                    </div>
                )}

                <div className="p-4 space-y-3">
                    <div className="space-y-2 pr-6">
                        <h3 className="font-extrabold text-lg sm:text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 tracking-tight">
                            {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="truncate">
                                {job.employer?.companyName || job.employer?.name || tCard('company')}
                            </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Salary */}
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors duration-300">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                <IndianRupee className="w-3 h-3 text-primary" />
                                {tCommon('labels.salary')}
                            </div>
                            <span className="text-sm font-bold text-foreground truncate">
                                ₹{job.salary.toLocaleString('en-IN')}
                                <span className="text-[10px] text-muted-foreground font-medium ml-1">
                                    / {job.workType === 'permanent' ? 'month' : 'day'}
                                </span>
                            </span>
                        </div>
                        {/* Location */}
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors duration-300">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                <MapPin className="w-3 h-3 text-primary" />
                                {tCommon('labels.location')}
                            </div>
                            <span className="text-sm font-bold text-foreground truncate">
                                {job.location?.address
                                    ? job.location.address.split(',')[0].trim()
                                    : tCard('remote')}
                            </span>
                        </div>
                        {/* Experience */}
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors duration-300">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                <ChartBar className="w-3 h-3 text-primary" />
                                {tCommon('labels.experience')}
                            </div>
                            <span className="text-sm font-bold text-foreground truncate">
                                {job.minExperience === 0 && job.maxExperience === 0
                                    ? tCard('freshers')
                                    : tCard('experience.range', { min: job.minExperience, max: job.maxExperience })}
                            </span>
                        </div>
                        {/* Openings */}
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-muted/30 border border-border/50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors duration-300">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                <Users className="w-3 h-3 text-primary" />
                                {tJobs('details.openings')}
                            </div>
                            <span className="text-sm font-bold text-foreground truncate">{job.totalOpenings || 1}</span>
                        </div>
                    </div>

                    {/* Applicants Count (if available) */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{tCard('applicants', { count: job.applicants?.length || 0 })}</span>
                    </div>

                    {/* Footer: Tags & Action */}
                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/30">
                        <Badge variant="outline" className={`text-[10px] font-bold h-6 px-3 rounded-full border-primary/20 ${job.workType === "permanent" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                            }`}>
                            {tCard(job.workType)}
                        </Badge>

                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold md:opacity-0 md:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                            {tCommon('buttons.viewDetails')}
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link >
    )
}
