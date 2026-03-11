"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/navigation";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, ArrowLeft, CheckCircle2, XCircle, MapPin, Clock, Calendar, Navigation, Camera, AlertCircle, Phone, Mail, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/navigation"
import dynamic from "next/dynamic"
import io from "socket.io-client"
import { useTranslations } from 'next-intl'

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const socket = io(API_ROOT_URL, { path: '/api/socket.io', withCredentials: true });

export default function HiredJobDetailPage() {
  const t = useTranslations('Dashboard.employer')
  const tDetails = useTranslations('Dashboard.employer.hiredJobDetailsPage')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [workerLocations, setWorkerLocations] = useState<any[]>([])
  const [workLogsByWorker, setWorkLogsByWorker] = useState<{ [key: string]: any[] }>({});
  const [workerRoutes, setWorkerRoutes] = useState<any>({});
  const [loading, setLoading] = useState(true)
  const [isWorklogLocked, setIsWorklogLocked] = useState(false);
  const [upgradePrice, setUpgradePrice] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("")

  const jobId = params.id as string;
  const selectedWorkerId = searchParams.get('workerId');

  const fetchJobAndWorkLogs = async () => {
    try {
      setLoading(true)
      const jobData: any = await apiClient.getJobById(jobId)
      setJob(jobData)

      if (jobData?.workers?.length > 0) {
        try {
          const allWorkLogs: any[] = (await apiClient.getWorkLogsByJob(jobData._id)) as any[];
          const logsByWorker: { [key: string]: any[] } = {};
          allWorkLogs.forEach((log: any) => {
            const workerId = log.worker && typeof log.worker === 'object' ? log.worker._id : log.worker;
            if (!logsByWorker[workerId]) {
              logsByWorker[workerId] = [];
            }
            logsByWorker[workerId].push(log);
          });

          for (const workerId in logsByWorker) {
            logsByWorker[workerId].sort((a, b) => {
              const dateA = new Date(a.workDate || a.createdAt).getTime();
              const dateB = new Date(b.workDate || b.createdAt).getTime();
              return dateB - dateA;
            });
          }
          setWorkLogsByWorker(logsByWorker);
          setIsWorklogLocked(false);
        } catch (logError: any) {
          // Check if error is 403 (Access Denied)
          if (logError.message.includes('403') || logError.message.includes('Worklog access denied')) {
            setIsWorklogLocked(true);
            setUpgradePrice(2499); // Hardcoded or parse from error message if available
          } else {
            console.error("Error fetching worklogs:", logError);
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockWorklogs = async () => {
    setPurchasing(true);
    try {
      const orderId = `ADDON_${Date.now()}`;
      const response = await apiClient.initiatePaytmPayment({
        amount: 2499,
        orderId,
        customerId: user?._id || '',
        email: user?.email,
        phone: user?.mobile,
        planId: 'worklog_access',
        platform: 'web'
      });

      if (response.success) {
        const payUrl = `${API_ROOT_URL}/payments/paytm/pay?txnToken=${response.txnToken}&orderId=${response.orderId}&mid=${response.mid}`;
        window.location.href = payUrl;
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (err: any) {
      console.error("Purchase failed:", err);
      setError(err.message || "Purchase initiation failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchJobAndWorkLogs()
    }
  }, [jobId, authLoading])

  useEffect(() => {
    if (job && selectedWorkerId) {
      const worker = job.workers.find((w: any) => w.workerId._id === selectedWorkerId)?.workerId;
      if (worker) {
        apiClient.getWorkerLatestLocation(worker._id, job._id)
          .then((latestLocation: any) => {
            if (latestLocation?.latitude && latestLocation.longitude) {
              setWorkerLocations([{
                lat: latestLocation.latitude,
                lng: latestLocation.longitude,
                popupText: `${worker.name}'s last known location`,
                workerId: worker._id,
              }]);
            }
          }).catch(err => console.error("Error fetching initial location:", err));

        apiClient.getWorkerRoute(worker._id, job._id)
          .then(route => {
            setWorkerRoutes({ [worker._id]: route });
          }).catch(err => console.error("Error fetching initial route:", err));
      }
    }
  }, [job, selectedWorkerId]);

  useEffect(() => {
    if (!authLoading && user && user.role === "employer" && job) {
      socket.on("connect", () => {
        socket.emit("joinJobRoom", job._id);
      });

      socket.on("workerLocationUpdated", (data) => {
        if (data.jobId === job._id && (!selectedWorkerId || data.workerId === selectedWorkerId)) {
          setWorkerLocations(prev => {
            const existingIndex = prev.findIndex(loc => loc.workerId === data.workerId);
            const newLocation = {
              lat: data.latitude,
              lng: data.longitude,
              popupText: `${data.workerName}'s live location`,
              workerId: data.workerId,
            };
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = newLocation;
              return updated;
            }
            return [...prev, newLocation];
          });

          setWorkerRoutes((prev: any) => ({
            ...prev,
            [data.workerId]: [...(prev[data.workerId] || []), { latitude: data.latitude, longitude: data.longitude, timestamp: data.timestamp }]
          }));
        }
      });

      return () => {
        socket.off("connect");
        socket.off("workerLocationUpdated");
        socket.emit("leaveJobRoom", job._id);
      };
    }
  }, [user, authLoading, job, selectedWorkerId]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/dashboard/employer/hired-jobs">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tDetails('backToHiredJobs')}
          </Button>
        </Link>
      </div>
    )
  }

  if (!job) {
    return null
  }

  const defaultMapCenter: [number, number] = [20.5937, 78.9629];

  const selectedWorker = selectedWorkerId
    ? job.workers.find((workerObj: any) => workerObj.workerId._id === selectedWorkerId)
    : (job.workers.length === 1 ? job.workers[0] : null); // Default to first worker if only one

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/dashboard/employer/hired-jobs">
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tDetails('backToHiredJobs')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground hidden sm:block">{job.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

          {/* Left Column: Worker Selection & Details */}
          <div className="space-y-6">

            {/* Worker List (If > 1) */}
            {job.workers.length > 1 && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{tDetails('selectWorker')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[200px] w-full pr-4">
                    {job.workers.map((workerObj: any) => {
                      const isSelected = selectedWorkerId === workerObj.workerId._id || (!selectedWorkerId && job.workers.length === 1);
                      return (
                        <Link key={workerObj.workerId._id} href={`/dashboard/employer/hired-jobs/${jobId}?workerId=${workerObj.workerId._id}`} className="block mb-2">
                          <Button variant={isSelected ? "secondary" : "ghost"} className="w-full justify-start h-auto py-3 px-4">
                            <Avatar className="w-8 h-8 mr-3">
                              <AvatarImage src={workerObj.workerId.profilePicture} />
                              <AvatarFallback>{workerObj.workerId.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start truncate">
                              <span className="font-medium truncate w-full text-left">{workerObj.workerId.name}</span>
                              <span className="text-xs text-muted-foreground truncate w-full text-left">{workerObj.workerId.mobile}</span>
                            </div>
                            {workerObj.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                          </Button>
                        </Link>
                      )
                    })}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Selected Worker Profile */}
            {selectedWorker && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-lg overflow-hidden sticky top-6">
                <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5"></div>
                <CardContent className="pt-0 relative px-6 pb-6">
                  <Avatar className="w-20 h-20 border-4 border-background absolute -top-10 shadow-md">
                    <AvatarImage src={selectedWorker.workerId.profilePicture} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{selectedWorker.workerId.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="mt-12 space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold truncate">{selectedWorker.workerId.name}</h2>
                      <Badge variant={selectedWorker.status === 'completed' ? 'default' : 'secondary'} className={selectedWorker.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {selectedWorker.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{selectedWorker.workerId.email}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      {tDetails('mobile', { mobile: selectedWorker.workerId.mobile })}
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Current Job Status</h3>
                    {(() => {
                      const workerLogs = workLogsByWorker[selectedWorker.workerId._id] || [];
                      const today = new Date().toDateString();
                      const todayLog = workerLogs.find(log => new Date(log.workDate).toDateString() === today);

                      if (!todayLog) {
                        return (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{tDetails('notStarted')}</p>
                          </div>
                        )
                      }

                      // Blur logic for current status if locked? 
                      // User only said "unlock the view of worker worklogs". 
                      // The current status usually comes from worklogs too.
                      // If worklogs are empty/failed due to 403, we won't have todayLog.
                      // So render "Access Restricted" or something if locked.

                      if (isWorklogLocked) {
                        return (
                          <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 text-center">
                            <p className="text-sm text-muted-foreground">Status Hidden</p>
                          </div>
                        )
                      }

                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Start Time</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">
                              {todayLog.startTime ? new Date(todayLog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </p>
                          </div>
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">End Time</p>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
                              {todayLog.endTime ? new Date(todayLog.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Map & Activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Map Section */}
            {selectedWorker && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Live Tracking
                    </CardTitle>
                    <CardDescription>Real-time location updates for {selectedWorker.workerId.name}</CardDescription>
                  </div>
                  {/* Hide button if locked */}
                  {!isWorklogLocked && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      const worker = selectedWorker.workerId; // Since selectedWorker is derived
                      if (worker && job.location?.coordinates) {
                        const latestLocation: any = await apiClient.getWorkerLatestLocation(worker._id, job._id);
                        if (latestLocation) {
                          const route = await apiClient.calculateRoute(latestLocation.latitude, latestLocation.longitude, job.location.coordinates[1], job.location.coordinates[0]);
                          setWorkerRoutes({ [worker._id]: route });
                        }
                      }
                    }}>
                      <Navigation className="w-4 h-4 mr-2" />
                      {tDetails('viewFullRoute')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] w-full bg-muted/20 relative">
                    {/* If locked, show overlay on map too? User said "unlock the view of worker worklogs". 
                         Usually live tracking is part of premium/add-on value. 
                         Let's lock it too for consistency if we didn't get worklogs. 
                         But api.ts `getWorkerLatestLocation` isn't gated yet. 
                         For now, I'll just focus on worklogs as requested. */}
                    {workerLocations.length > 0 && workerLocations.some(loc => loc.workerId === selectedWorker.workerId._id) ? (
                      <Map
                        key={JSON.stringify(workerRoutes)}
                        locations={workerLocations.filter(loc => loc.workerId === selectedWorker.workerId._id)}
                        routes={workerRoutes}
                        center={
                          workerLocations.find(loc => loc.workerId === selectedWorker.workerId._id)
                            ? [
                              workerLocations.find(loc => loc.workerId === selectedWorker.workerId._id).lat,
                              workerLocations.find(loc => loc.workerId === selectedWorker.workerId._id).lng,
                            ]
                            : defaultMapCenter
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <MapPin className="w-10 h-10 mb-2 opacity-20" />
                        <p>{tDetails('locationNotAvailable')}</p>
                        <p className="text-xs mt-1 max-w-xs">{tDetails('mapDescription')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            {selectedWorker && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-lg relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Work Verification Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isWorklogLocked ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Unlock Work Logs</h3>
                        <p className="text-muted-foreground max-w-md mb-6">
                          View detailed work history, attendance verification, and daily progress tracking.
                        </p>
                        <Button size="lg" onClick={handleUnlockWorklogs} disabled={purchasing} className="font-bold relative overflow-hidden group">
                          <span className="relative z-10 flex items-center gap-2">
                            {purchasing && <Loader2 className="w-4 h-4 animate-spin" />}
                            Unlock Now for ₹2499/mo
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                          Already included in <span className="font-semibold text-primary">Premium Plan</span>
                        </p>
                      </div>
                      {/* Fake placeholder content behind blur */}
                      <div className="w-full space-y-4 opacity-20 blur-sm pointer-events-none">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-muted rounded-lg w-full" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      {(() => {
                        const workerLogs = workLogsByWorker[selectedWorker.workerId._id] || [];
                        if (workerLogs.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <Calendar className="w-10 h-10 mb-2 opacity-20" />
                              <p>No work logs found for this worker.</p>
                            </div>
                          )
                        }
                        return (
                          <div className="space-y-8 pl-2">
                            {workerLogs.map((log, index) => (
                              <div key={log._id} className="relative pl-6 pb-6 border-l border-border hover:border-primary/50 transition-colors last:pb-0 last:border-0">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />

                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">
                                      {new Date(log.workDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className={`text-xs ${log.status === 'completed' ? 'border-green-500/30 text-green-600 bg-green-500/5' : 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5'}`}>
                                        {log.status}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {log.hoursWorked ? `${log.hoursWorked.toFixed(1)} hrs` : 'In Progress'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                  {/* Start Details */}
                                  <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Start Shift</span>
                                      {log.startTime && <span className="text-xs font-mono">{new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <div className={`flex items-center gap-1.5 ${log.startOtpVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {log.startOtpVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        OTP
                                      </div>
                                      <div className={`flex items-center gap-1.5 ${log.startPhoto ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {log.startPhoto ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        Photo
                                      </div>
                                    </div>
                                    {log.startOtp && (
                                      <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20">
                                        <p className="text-xs text-muted-foreground mb-1">Start OTP:</p>
                                        <p className="text-lg font-mono font-bold text-primary tracking-wider">{log.startOtp}</p>
                                      </div>
                                    )}
                                    {log.startPhoto && (
                                      <div className="mt-3 relative rounded-md border border-border/50 aspect-video bg-muted/20 overflow-hidden">
                                        <img src={log.startPhoto} alt="Start" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-[10px] text-white font-bold rounded backdrop-blur-sm uppercase">Start Photo</div>
                                      </div>
                                    )}
                                  </div>
                                  {/* End Details */}
                                  <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">End Shift</span>
                                      {log.endTime ? <span className="text-xs font-mono">{new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-xs italic text-muted-foreground">--:--</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <div className={`flex items-center gap-1.5 ${log.endOtpVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {log.endOtpVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        OTP
                                      </div>
                                      <div className={`flex items-center gap-1.5 ${log.endPhoto ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {log.endPhoto ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        Photo
                                      </div>
                                    </div>
                                    {log.endOtp && (
                                      <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                                        <p className="text-xs text-muted-foreground mb-1">End OTP:</p>
                                        <p className="text-lg font-mono font-bold text-destructive tracking-wider">{log.endOtp}</p>
                                      </div>
                                    )}
                                    {log.endPhoto && (
                                      <div className="mt-3 relative rounded-md border border-border/50 aspect-video bg-muted/20 overflow-hidden">
                                        <img src={log.endPhoto} alt="End" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-[10px] text-white font-bold rounded backdrop-blur-sm uppercase">End Photo</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
