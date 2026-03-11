"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, Mail, Phone, Briefcase } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useTranslations } from 'next-intl'

export default function AllApplicantsPage() {
  const t = useTranslations('Dashboard.employer')
  const tApps = useTranslations('Dashboard.employer.applicantsPage')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("candidate-applications")

  const fetchAllApplications = async () => {
    try {
      setLoading(true)
      // Assuming a new API endpoint to fetch all applications for the employer
      const allApps = await apiClient.getAllApplicationsForEmployer();
      setApplications(allApps);
    } catch (err: any) {
      setError(err.message || tApps('errorFetch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "employer")) {
      router.push("/auth/login")
      return
    }

    if (!authLoading && user && user.role === "employer") {
      fetchAllApplications()
    }
  }, [user, authLoading, router])

  const handleHireWorker = async (jobId: string, workerId: string) => {
    if (window.confirm(t('alerts.confirmHire'))) {
      try {
        await apiClient.hireWorkerForJob(jobId, workerId);
        fetchAllApplications(); // Re-fetch data to update UI
      } catch (err: any) {
        setError(err.message || tApps('errorHire'));
      }
    }
  };

  const handleRejectApplicant = async (jobId: string, applicantId: string) => {
    if (window.confirm(t('alerts.confirmReject'))) {
      try {
        await apiClient.rejectApplicant(jobId, applicantId);
        fetchAllApplications(); // Re-fetch data to update UI
      } catch (err: any) {
        setError(err.message || tApps('errorReject'));
      }
    }
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === "candidate-applications") {
      return ['pending', 'hired', 'rejected'].includes(app.status);
    } else if (activeTab === "hire-requests") {
      return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/employer">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('manageJobsPage.backToDashboard')}
          </Button>
        </Link>

        <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold text-foreground mb-2">{tApps('title')}</CardTitle>
            <p className="text-muted-foreground">{tApps('subtitle')}</p>
          </CardHeader>
          <CardContent className="px-0 pb-0 mt-4">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                {error}
              </div>
            )}

            <Tabs defaultValue="candidate-applications" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="candidate-applications">{tApps('candidateApps')}</TabsTrigger>
                <TabsTrigger value="hire-requests">{tApps('hireRequests')}</TabsTrigger>
              </TabsList>
              <TabsContent value="candidate-applications" className="mt-4">
                {filteredApplications.length === 0 ? (
                  <p className="text-muted-foreground">{tApps('noCandidates')}</p>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application: any) => (
                      <Card key={application._id} className="p-4 border border-border/50 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-foreground">{application.worker?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${application.status === 'pending' ? 'bg-blue-500/20 text-blue-600' :
                            application.status === 'offered' ? 'bg-yellow-500/20 text-yellow-600' :
                              application.status === 'hired' ? 'bg-green-500/20 text-green-600' :
                                application.status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                                  'bg-gray-500/20 text-gray-600'
                            }`}>
                            {application.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {tApps('job', { title: application.job?.title })}</p>
                          <p className="flex items-center gap-1"><Mail className="w-4 h-4" /> {application.worker?.email}</p>
                          <p className="flex items-center gap-1"><Phone className="w-4 h-4" /> {application.worker?.mobile}</p>
                          <p className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {tApps('role', { role: application.worker?.role })}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.isApproved ? 'text-green-500' : 'text-red-500'}`} /> {tApps('approved', { status: application.worker?.isApproved ? 'Yes' : 'No' })}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.availability === 'available' ? 'text-green-500' : 'text-red-500'}`} /> {tApps('availability', { status: application.worker?.availability })}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link href={`/profile/${application.worker?._id}?jobId=${application.job._id}&context=applicant`}>
                            <Button variant="outline" size="sm" className="rounded-full">{t('recentApps.viewProfile')}</Button>
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectApplicant(application.job._id, application.worker._id)}
                                className="rounded-full"
                              >
                                {tCommon('buttons.reject')}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleHireWorker(application.job._id, application.worker._id)}
                                className="rounded-full"
                                disabled={application.worker?.availability === 'unavailable'}
                              >
                                {tCommon('buttons.hire')}
                              </Button>
                            </>
                          )}
                          {application.status === 'offered' && (
                            <Button variant="secondary" size="sm" className="rounded-full" disabled>{tApps('offerSent')}</Button>
                          )}
                          {application.status === 'hired' && (
                            <Button variant="default" size="sm" className="rounded-full" disabled>{tApps('hired')}</Button>
                          )}
                          {application.status === 'rejected' && (
                            <Button variant="destructive" size="sm" className="rounded-full" disabled>{tApps('rejected')}</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="hire-requests" className="mt-4">
                {filteredApplications.length === 0 ? (
                  <p className="text-muted-foreground">{tApps('noHireRequests')}</p>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application: any) => (
                      <Card key={application._id} className="p-4 border border-border/50 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-foreground">{application.worker?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${application.status === 'pending' ? 'bg-blue-500/20 text-blue-600' :
                            application.status === 'offered' ? 'bg-yellow-500/20 text-yellow-600' :
                              application.status === 'hired' ? 'bg-green-500/20 text-green-600' :
                                application.status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                                  'bg-gray-500/20 text-gray-600'
                            }`}>
                            {application.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {tApps('job', { title: application.job?.title })}</p>
                          <p className="flex items-center gap-1"><Mail className="w-4 h-4" /> {application.worker?.email}</p>
                          <p className="flex items-center gap-1"><Phone className="w-4 h-4" /> {application.worker?.mobile}</p>
                          <p className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {tApps('role', { role: application.worker?.role })}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.isApproved ? 'text-green-500' : 'text-red-500'}`} /> {tApps('approved', { status: application.worker?.isApproved ? 'Yes' : 'No' })}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.availability === 'available' ? 'text-green-500' : 'text-red-500'}`} /> {tApps('availability', { status: application.worker?.availability })}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link href={`/profile/${application.worker?._id}?jobId=${application.job._id}&context=applicant`}>
                            <Button variant="outline" size="sm" className="rounded-full">{t('recentApps.viewProfile')}</Button>
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectApplicant(application.job._id, application.worker._id)}
                                className="rounded-full"
                              >
                                {tCommon('buttons.reject')}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleHireWorker(application.job._id, application.worker._id)}
                                className="rounded-full"
                                disabled={application.worker?.availability === 'unavailable'}
                              >
                                {tCommon('buttons.hire')}
                              </Button>
                            </>
                          )}
                          {application.status === 'offered' && (
                            <Button variant="secondary" size="sm" className="rounded-full" disabled>{tApps('offerSent')}</Button>
                          )}
                          {application.status === 'hired' && (
                            <Button variant="default" size="sm" className="rounded-full" disabled>{tApps('hired')}</Button>
                          )}
                          {application.status === 'rejected' && (
                            <Button variant="destructive" size="sm" className="rounded-full" disabled>{tApps('rejected')}</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
