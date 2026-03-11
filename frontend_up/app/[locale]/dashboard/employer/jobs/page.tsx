"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Plus, ArrowLeft, Search, MapPin, Users, Calendar, Briefcase, Eye, Edit, Trash2 } from "lucide-react"
import { useTranslations } from 'next-intl'
import UpgradePrompt from "@/components/UpgradePrompt"
import { toast } from "sonner"
import { Power, PowerOff } from "lucide-react"

export default function ManageJobsPage() {
  const t = useTranslations('Dashboard.employer')
  const tManage = useTranslations('Dashboard.employer.manageJobsPage')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Subscription limit state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<'databaseUnlocks' | 'activeJobs'>('activeJobs')
  const [limitData, setLimitData] = useState<{ limit: number; used: number; plan: string } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "employer")) {
      router.push("/auth/login")
      return
    }

    const fetchJobs = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getEmployerJobs()
        setJobs((data as any[]) || [])
      } catch (err: any) {
        setError(err.message || tManage('errorFetch'))
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user && user.role === "employer") {
      fetchJobs()
    }
  }, [user, authLoading, router])

  const handleToggleStatus = async (job: any) => {
    const isActive = ['open', 'in-progress'].includes(job.status);
    const newStatus = isActive ? 'closed' : 'open';
    const actionName = isActive ? "Deactivate" : "Activate";

    try {
      await apiClient.updateJob(job._id, { status: newStatus });

      // Update local state
      setJobs(prevJobs => prevJobs.map(j =>
        j._id === job._id ? { ...j, status: newStatus } : j
      ));

      toast.success(`Job ${isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      if (err.response?.data?.requiresJobClose || err.response?.data?.requiresUpgrade) {
        setUpgradeFeature('activeJobs');
        setLimitData({
          limit: err.response.data.maxActiveJobs || err.response.data.limit,
          used: err.response.data.activeJobsCount || err.response.data.used,
          plan: err.response.data.currentPlan
        });
        setShowUpgradePrompt(true);
      } else {
        toast.error(err.message || `Failed to ${actionName.toLowerCase()} job`);
      }
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/employer">
              <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-muted-foreground mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {tManage('backToDashboard')}
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{tManage('title')}</h1>
            <p className="text-muted-foreground">{tManage('subtitle')}</p>
          </div>
          <Link href="/jobs/create">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" />
              {t('postNewJob')}
            </Button>
          </Link>
        </div>

        {/* Quick Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/80 border-border/50 backdrop-blur-lg flex flex-col justify-center p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <h3 className="text-2xl font-bold">{jobs.length}</h3>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 backdrop-blur-lg flex flex-col justify-center p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
                <h3 className="text-2xl font-bold">{totalApplicants}</h3>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 backdrop-blur-lg p-6 shadow-sm flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search your jobs..."
                className="pl-10 w-full bg-background/50 border-input/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Card key={job._id} className="group bg-card/80 border-border/50 backdrop-blur-lg hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider mb-2">
                      {job.status || 'Active'}
                    </Badge>
                    {/* Future: Add menu for delete action */}
                  </div>
                  <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location?.address || "Location not specified"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-4 pb-4">
                  <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Applicants
                    </span>
                    <span className="font-bold text-foreground">{job.applicants?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>

                <CardFooter className="pt-0 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Link href={`/jobs/${job._id}`} className="w-full">
                      <Button variant="outline" className="w-full group-hover:border-primary/50">
                        <Eye className="w-4 h-4 mr-2" />
                        {tManage('view')}
                      </Button>
                    </Link>
                    <Link href={`/jobs/${job._id}/edit`} className="w-full">
                      <Button variant="outline" className="w-full group-hover:border-primary/50">
                        <Edit className="w-4 h-4 mr-2" />
                        {tManage('edit')}
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant={['open', 'in-progress'].includes(job.status) ? "destructive" : "default"}
                    className="w-full"
                    onClick={() => handleToggleStatus(job)}
                  >
                    {['open', 'in-progress'].includes(job.status) ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        Deactivate Job (Close)
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        Activate Job (Open)
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-3xl border border-border/50 border-dashed">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground">{tManage('noJobs')}</p>
              {searchTerm && <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms.</p>}
              <Link href="/jobs/create" className="mt-4">
                <Button variant="link" className="text-primary">Post a new job</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {
        showUpgradePrompt && limitData && (
          <UpgradePrompt
            open={showUpgradePrompt}
            onClose={() => setShowUpgradePrompt(false)}
            feature={upgradeFeature}
            limit={limitData.limit}
            used={limitData.used}
            currentPlan={limitData.plan}
          />
        )
      }
    </div >
  )
}
