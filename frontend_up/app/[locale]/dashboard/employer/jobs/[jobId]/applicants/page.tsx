"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, ArrowLeft, CheckCircle, XCircle, User, Mail, Phone } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs" // Import Tabs components
import { useTranslations } from 'next-intl'

export default function JobApplicantsPage() {
  const t = useTranslations('Dashboard.employer')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("candidate-applications") // New state for active tab

  const jobId = params.jobId as string;

  const fetchJobAndApplicants = async () => {
    try {
      setLoading(true)
      const jobData = await apiClient.getJobById(jobId)
      setJob(jobData)

      // Fetch applications for this job
      const allApplications = await apiClient.getApplicationsForJob(jobId);
      setApplicants(allApplications);

    } catch (err: any) {
      setError(err.message || "Failed to fetch job and applicants data.")
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
      fetchJobAndApplicants()
    }
  }, [user, authLoading, router, jobId])

  const handleHireWorker = async (workerId: string) => {
    if (window.confirm("Are you sure you want to hire this worker for this job?")) {
      try {
        await apiClient.hireWorkerForJob(jobId, workerId);
        fetchJobAndApplicants(); // Re-fetch data to update UI
      } catch (err: any) {
        setError(err.message || "Failed to hire worker.");
      }
    }
  };

  const handleRejectApplicant = async (applicantId: string) => {
    if (window.confirm("Are you sure you want to reject this applicant?")) {
      try {
        await apiClient.rejectApplicant(jobId, applicantId);
        fetchJobAndApplicants(); // Re-fetch data to update UI
      } catch (err: any) {
        setError(err.message || "Failed to reject applicant.");
      }
    }
  };

  // Filter applicants based on active tab
  const filteredApplicants = applicants.filter(app => {
    if (activeTab === "candidate-applications") {
      return ['pending', 'hired', 'rejected'].includes(app.status);
    } else if (activeTab === "hire-requests") {
      return ['offered', 'offerAccepted', 'offerRejected'].includes(app.status);
    }
    return true; // Should not happen
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">{error || "Job not found"}</p>
        <Link href="/dashboard/employer/jobs">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Jobs
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/employer/jobs">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Jobs
          </Button>
        </Link>

        <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-lg">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold text-foreground mb-2">Applicants for "{job.title}"</CardTitle>
            <p className="text-muted-foreground">Manage applications for this job posting.</p>
          </CardHeader>
          <CardContent className="px-0 pb-0 mt-4">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                {error}
              </div>
            )}

            <Tabs defaultValue="candidate-applications" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="candidate-applications">Candidate Applications</TabsTrigger>
                <TabsTrigger value="hire-requests">Hire Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="candidate-applications" className="mt-4">
                {filteredApplicants.length === 0 ? (
                  <p className="text-muted-foreground">No candidate applications for this job yet.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredApplicants.map((application: any) => (
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
                          <p className="flex items-center gap-1"><Mail className="w-4 h-4" /> {application.worker?.email}</p>
                          <p className="flex items-center gap-1"><Phone className="w-4 h-4" /> {application.worker?.mobile}</p>
                          <p className="flex items-center gap-1">
                            <User className="w-4 h-4" /> Role: {application.worker?.role}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.isApproved ? 'text-green-500' : 'text-red-500'}`} /> Approved: {application.worker?.isApproved ? 'Yes' : 'No'}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.availability === 'available' ? 'text-green-500' : 'text-red-500'}`} /> Availability: {application.worker?.availability}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link href={`/profile/${application.worker?._id}?jobId=${jobId}&context=applicant`}>
                            <Button variant="outline" size="sm" className="rounded-full">View Profile</Button>
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectApplicant(application.worker._id)}
                                className="rounded-full"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleHireWorker(application.worker._id)}
                                className="rounded-full"
                                disabled={application.worker?.availability === 'unavailable'}
                              >
                                Hire
                              </Button>
                            </>
                          )}
                          {application.status === 'offered' && (
                            <Button variant="secondary" size="sm" className="rounded-full" disabled>Offer Sent</Button>
                          )}
                          {application.status === 'hired' && (
                            <Button variant="default" size="sm" className="rounded-full" disabled>Hired</Button>
                          )}
                          {application.status === 'rejected' && (
                            <Button variant="destructive" size="sm" className="rounded-full" disabled>Rejected</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="hire-requests" className="mt-4">
                {filteredApplicants.length === 0 ? (
                  <p className="text-muted-foreground">No hire requests for this job yet.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredApplicants.map((application: any) => (
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
                          <p className="flex items-center gap-1"><Mail className="w-4 h-4" /> {application.worker?.email}</p>
                          <p className="flex items-center gap-1"><Phone className="w-4 h-4" /> {application.worker?.mobile}</p>
                          <p className="flex items-center gap-1">
                            <User className="w-4 h-4" /> Role: {application.worker?.role}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.isApproved ? 'text-green-500' : 'text-red-500'}`} /> Approved: {application.worker?.isApproved ? 'Yes' : 'No'}
                          </p>
                          <p className="flex items-center gap-1">
                            <CheckCircle className={`w-4 h-4 ${application.worker?.availability === 'available' ? 'text-green-500' : 'text-red-500'}`} /> Availability: {application.worker?.availability}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link href={`/profile/${application.worker?._id}?jobId=${jobId}&context=applicant`}>
                            <Button variant="outline" size="sm" className="rounded-full">View Profile</Button>
                          </Link>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectApplicant(application.worker._id)}
                                className="rounded-full"
                              >
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleHireWorker(application.worker._id)}
                                className="rounded-full"
                                disabled={application.worker?.availability === 'unavailable'}
                              >
                                Hire
                              </Button>
                            </>
                          )}
                          {application.status === 'offered' && (
                            <Button variant="secondary" size="sm" className="rounded-full" disabled>Offer Sent</Button>
                          )}
                          {application.status === 'hired' && (
                            <Button variant="default" size="sm" className="rounded-full" disabled>Hired</Button>
                          )}
                          {application.status === 'rejected' && (
                            <Button variant="destructive" size="sm" className="rounded-full" disabled>Rejected</Button>
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
