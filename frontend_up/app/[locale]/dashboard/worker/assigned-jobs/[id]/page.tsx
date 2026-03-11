"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ArrowLeft, MapPin, Briefcase, Building2, Star, Loader2, MessageSquare, Menu, X, LogOut, Clock, Send, Camera, XCircle, User, CheckCircle } from "lucide-react"
import GeoPhotoCapture from "@/components/GeoPhotoCapture"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import dynamic from 'next/dynamic'; // Ensure dynamic is imported
import { useTranslations } from 'next-intl'
import { NotificationBell } from "@/components/NotificationBell"
import LanguageSwitcher from "@/components/LanguageSwitcher"

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <p>Loading map...</p> // Optional: Add a loading state
});

export default function AssignedJobDetailsPage() {
  const t = useTranslations('Dashboard.worker')
  const tDetails = useTranslations('Dashboard.worker.assignedJobDetails')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [workLog, setWorkLog] = useState<any>(null)
  const [allWorkLogs, setAllWorkLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [enteredOtp, setEnteredOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")
  const [showGeoPhotoCapture, setShowGeoPhotoCapture] = useState(false)
  const [photoUploadType, setPhotoUploadType] = useState<"start" | "end" | null>(null)
  const [photoUploadError, setPhotoUploadError] = useState("")
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false)

  // New state for map and route
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [workerCurrentLocation, setWorkerCurrentLocation] = useState<{ lat: number; lng: number; } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number; }>>([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const jobId = params.id as string;

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const fetchWorkLogData = async () => {
    if (!user) return;
    try {
      const workLogData = (await apiClient.getWorkLogByJob(jobId)) as any
      setWorkLog(workLogData)
      if (workLogData?.startTime && !workLogData.endTime) {
        setIsTimerRunning(true)
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setWorkLog(null);
      } else {
        setError(err.message || "Failed to fetch work log.")
      }
    }
  }

  const fetchAllWorkLogs = async () => {
    if (!user) return;
    try {
      const allLogsData = (await apiClient.getWorkLogsForWorker()) as any;
      const jobLogs = allLogsData.filter((log: any) => log.job._id === jobId);
      setAllWorkLogs(jobLogs);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    }
  }

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "worker")) {
      router.push("/auth/login")
      return
    }

    const fetchDetails = async () => {
      try {
        setLoading(true)
        const jobData = (await apiClient.getJobById(jobId)) as any
        setJob(jobData)
        console.log("Fetched Job Data:", jobData); // ADD THIS
        console.log("Job Location Coordinates:", jobData?.location?.coordinates); // ADD THIS
        console.log("Job Status:", jobData?.status); // ADD THIS
        await fetchWorkLogData();
        await fetchAllWorkLogs();
      } catch (err: any) {
        setError(err.message || "Failed to fetch job details.")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user && user.role === "worker") {
      fetchDetails()
    }
  }, [user, authLoading, router, jobId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && workLog?.startTime) {
      interval = setInterval(() => {
        const startTime = new Date(workLog.startTime).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimer(elapsed);
      }, 1000);
    } else {
      if (workLog?.startTime && workLog?.endTime) {
        const startTime = new Date(workLog.startTime).getTime();
        const endTime = new Date(workLog.endTime).getTime();
        setTimer(Math.floor((endTime - startTime) / 1000));
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, workLog?.startTime, workLog?.endTime]);

  useEffect(() => {
    let watchId: number;

    const sendLocationUpdate = async (position: GeolocationPosition) => {
      setWorkerCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); // Store current location
      console.log("Worker Current Location Updated:", { lat: position.coords.latitude, lng: position.coords.longitude }); // ADD THIS
      if (user && job && user._id && job.geoTaggingRequired) {
        try {
          await apiClient.updateWorkerLocation(
            user._id,
            jobId,
            position.coords.latitude,
            position.coords.longitude
          );
        } catch (err) {
          console.error("Failed to update worker live location:", err);
        }
      }
    };

    if (user && user.role === 'worker' && typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        sendLocationUpdate,
        (error) => console.error("Geolocation watch error:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 60000,
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user, job, jobId]);

  const handleGenerateOtp = async (type: "start" | "end") => {
    setOtpLoading(true)
    setOtpError("")
    setOtpSuccess("") // Clear success message
    setPhotoUploadSuccess("")
    setEnteredOtp("")
    try {
      if (!user) throw new Error("User not found");

      if (type === 'start') {
        await apiClient.generateStartWorkOtp(jobId, user._id);
        await fetchAllWorkLogs();
        await fetchWorkLogData();
      } else {
        await apiClient.generateEndWorkOtp(jobId, user._id);
        await fetchWorkLogData();
      }
    } catch (err: any) {
      setOtpError(err.message || `Failed to generate ${type} OTP.`);
    } finally {
      setOtpLoading(false);
    }
  }

  const handleVerifyOtpClick = async (type: "start" | "end") => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess(""); // Clear success message
    setPhotoUploadSuccess("");
    try {
      if (!user) throw new Error("User not found");
      if (!enteredOtp || enteredOtp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP.")
      }

      let response;
      if (type === 'start') {
        response = await apiClient.verifyStartWorkOtp(jobId, user._id, {
          otp: enteredOtp,
        });
      } else {
        response = await apiClient.verifyEndWorkOtp(jobId, user._id, {
          otp: enteredOtp,
        });
      }

      setOtpSuccess((response as any).message || "OTP verified successfully!"); // Set success message
      setEnteredOtp("");
      await fetchWorkLogData();

    } catch (err: any) {
      setOtpError(err.message || `Failed to verify ${type} OTP.`);
    } finally {
      setOtpLoading(false);
    }
  }

  const handlePhotoUpload = async (photoUrl: string, latitude: number, longitude: number, addressName: string | null, type: "start" | "end") => {
    setPhotoUploadError("")
    setPhotoUploadSuccess("")
    setPhotoUploadLoading(true); // Use new state
    try {
      if (!user) throw new Error("User not found");

      await apiClient.updateWorkLogPhoto(jobId, user._id, {
        type,
        photoUrl,
        latitude: String(latitude),
        longitude: String(longitude),
        address: addressName,
      });

      setShowGeoPhotoCapture(false);
      setPhotoUploadType(null);
      setPhotoUploadSuccess("Photo uploaded and work log updated successfully!");

      await fetchWorkLogData();
      await fetchAllWorkLogs();

      if (type === 'end') {
        setIsTimerRunning(false);
      }

    } catch (err: any) {
      setPhotoUploadError(err.message || "Failed to upload photo and update work log.");
    } finally {
      setPhotoUploadLoading(false); // Use new state
    }
  }

  const handleViewRoute = async () => {
    console.log("handleViewRoute called"); // ADD THIS
    if (!workerCurrentLocation || !job?.location?.coordinates?.[1] || !job?.location?.coordinates?.[0]) {
      setError("Worker's current location or job location not available.");
      return;
    }

    setFetchingRoute(true);
    setError("");
    try {
      const route = await apiClient.calculateRoute( // Changed to calculateRoute
        workerCurrentLocation.lat,
        workerCurrentLocation.lng,
        job.location.coordinates[1], // Job Latitude
        job.location.coordinates[0]  // Job Longitude
      );
      console.log("Route fetched from API:", route);
      setRouteCoordinates(route);
      setShowRouteMap(true);
    } catch (err: any) {
      console.error("Error fetching route:", err);
      setError(err.message || "Failed to fetch route.");
    } finally {
      setFetchingRoute(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  const handleContactEmployer = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const conversation = (await apiClient.createConversation(user._id, job.employer._id)) as any;
      router.push(`/messages?conversationId=${conversation._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to initiate conversation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return null
  }

  // Drive the main UI using EXACTLY today's active or completed worklog (no fallback to yesterday's logic which blocks new days)
  const displayWorkLog = workLog;

  const isAllDoneToday = displayWorkLog?.startPhoto && displayWorkLog?.endPhoto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* ... Navigation remains same ... */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/worker" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                {tDetails('backToDashboard')}
              </span>
              <span className="text-lg font-black text-foreground leading-none">
                Job Interface
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-muted font-bold rounded-xl px-6">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 border-border/50 bg-background text-foreground rounded-xl font-bold px-6 h-11 hover:bg-muted transition-all"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('navigation.logout')}
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <NotificationBell />
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl sm:hidden border-border/50"
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
            <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto font-bold">
                <User className="w-5 h-5 mr-3" />
                {tCommon('navigation.profile')}
              </Button>
            </Link>
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-sm font-bold text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl py-6 h-auto"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {tCommon('navigation.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">
                  Assigned Project
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${job.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                  {job.status}
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-none">
                {job.title}
              </h1>
              <p className="text-xl font-bold text-muted-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {job.employer?.companyName || job.employer?.name || "Company"}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {workerCurrentLocation && job?.location?.coordinates?.[1] && job?.location?.coordinates?.[0] && (job.status === 'open' || job.status === 'in-progress') && (
                <Button
                  onClick={handleViewRoute}
                  disabled={fetchingRoute}
                  className="rounded-2xl font-black bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/20 px-8 h-14 text-lg transition-all active:scale-95 flex items-center gap-3"
                >
                  {fetchingRoute ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapPin className="w-6 h-6" />}
                  {tDetails('viewRoute')}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Location Row - Full Width */}
            <div className="p-6 bg-card/40 border border-border/50 rounded-3xl backdrop-blur-sm space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Site Location</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{job.location?.address || "Location TBA"}</span>
              </p>
            </div>

            {/* Compensation and Work Type Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-card/40 border border-border/50 rounded-3xl backdrop-blur-sm space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compensation</p>
                <p className="text-2xl font-black text-primary">₹{job.salary.toLocaleString('en-IN')}<span className="text-sm font-bold text-muted-foreground ml-1">/ {job.workType === 'permanent' ? 'month' : 'day'}</span></p>
              </div>
              <div className="p-6 bg-card/40 border border-border/50 rounded-3xl backdrop-blur-sm space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Work Type</p>
                <p className="text-2xl font-black text-foreground">{job.workType}</p>
              </div>
            </div>
          </div>
        </div>

        {showRouteMap && routeCoordinates.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-0 bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden border-2 border-primary/10">
              <div className="h-[400px] w-full">
                <Map
                  center={[job.location.coordinates[1], job.location.coordinates[0]]}
                  locations={[
                    { lat: job.location.coordinates[1], lng: job.location.coordinates[0], popupText: job.title },
                    { lat: workerCurrentLocation?.lat || 0, lng: workerCurrentLocation?.lng || 0, popupText: "Your Location" }
                  ]}
                  routes={{
                    workerRoute: routeCoordinates.map(coord => ({
                      latitude: coord.latitude,
                      longitude: coord.longitude,
                      timestamp: ""
                    }))
                  }}
                  zoom={14}
                />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {job && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader className="p-8 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-foreground mb-1">
                        {tDetails('workVerification')}
                      </CardTitle>
                      <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Process Logs & Evidence
                      </CardDescription>
                    </div>
                    {isAllDoneToday && (
                      <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-2 animate-pulse">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-black text-green-500 uppercase tracking-wider">All Done for Today</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {otpError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                      {otpError}
                    </div>
                  )}
                  {otpSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                      {otpSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Start Work Section */}
                    <div className={`p-6 border rounded-3xl space-y-4 transition-all ${displayWorkLog?.startPhoto ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/20 border-border/50 hover:border-primary/20'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${displayWorkLog?.startPhoto ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{tDetails('startWork')}</h3>
                        </div>
                        {displayWorkLog?.startPhoto && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>

                      {displayWorkLog?.startPhoto ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Start OTP and photo uploaded successfully</p>
                          </div>
                          <div className="relative group">
                            <div className="aspect-video relative rounded-xl overflow-hidden border-2 border-background shadow-sm">
                              <img src={displayWorkLog.startPhoto} alt="Start" className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                  {new Date(displayWorkLog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <a
                                  href={displayWorkLog.startPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-1.5 bg-white text-black text-xs font-black rounded-lg hover:bg-white/90 transition-colors uppercase tracking-widest"
                                >
                                  View Photo
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {job?.otpVerificationRequired ? (
                            (!workLog || !workLog.startOtpVerified) ? (
                              <div className="space-y-4">
                                {!workLog?.startOtp ? (
                                  <Button
                                    onClick={() => handleGenerateOtp('start')}
                                    disabled={otpLoading}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                                  >
                                    {otpLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : tDetails('generateStartOTP')}
                                  </Button>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-center text-xs font-bold uppercase tracking-wider">
                                      {tDetails('otpGenerated')}
                                    </div>
                                    <div className="flex gap-2">
                                      <Input
                                        type="text"
                                        placeholder="000000"
                                        value={enteredOtp}
                                        onChange={(e) => setEnteredOtp(e.target.value)}
                                        maxLength={6}
                                        className="flex-1 h-12 bg-background border-border/50 text-foreground text-center text-lg font-black tracking-widest rounded-xl focus:ring-primary/20"
                                      />
                                      <Button
                                        onClick={() => handleVerifyOtpClick('start')}
                                        disabled={otpLoading || enteredOtp.length !== 6}
                                        className="h-12 px-6 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl active:scale-95 transition-all"
                                      >
                                        {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Button
                                onClick={() => {
                                  setShowGeoPhotoCapture(true);
                                  setPhotoUploadType('start');
                                }}
                                disabled={photoUploadLoading}
                                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                              >
                                {photoUploadLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
                                {tDetails('uploadStartPhoto')}
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={() => {
                                setShowGeoPhotoCapture(true);
                                setPhotoUploadType('start');
                              }}
                              disabled={photoUploadLoading}
                              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                              {photoUploadLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
                              {tDetails('uploadStartPhoto')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* End Work Section */}
                    <div className={`p-6 border rounded-3xl space-y-4 transition-all ${displayWorkLog?.endPhoto ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/20 border-border/50 hover:border-primary/20'} ${!displayWorkLog?.startPhoto && !workLog?.startPhoto ? 'opacity-50 grayscale select-none cursor-not-allowed' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${displayWorkLog?.endPhoto ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            <XCircle className="w-4 h-4" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{tDetails('endWork')}</h3>
                        </div>
                        {displayWorkLog?.endPhoto && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>

                      {!displayWorkLog?.startPhoto && !workLog?.startPhoto ? (
                        <div className="py-10 text-center bg-background/50 rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center gap-2">
                          <Clock className="w-6 h-6 text-muted-foreground/30" />
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Awaiting Start Process</p>
                        </div>
                      ) : displayWorkLog?.endPhoto ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">End OTP and photo uploaded successfully</p>
                          </div>
                          <div className="relative group">
                            <div className="aspect-video relative rounded-xl overflow-hidden border-2 border-background shadow-sm">
                              <img src={displayWorkLog.endPhoto} alt="End" className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                  {new Date(displayWorkLog.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <a
                                  href={displayWorkLog.endPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-1.5 bg-white text-black text-xs font-black rounded-lg hover:bg-white/90 transition-colors uppercase tracking-widest"
                                >
                                  View Photo
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {!workLog?.endOtpVerified ? (
                            <div className="space-y-4">
                              {!workLog?.endOtp ? (
                                <Button
                                  onClick={() => handleGenerateOtp('end')}
                                  disabled={otpLoading}
                                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                                >
                                  {otpLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : tDetails('generateEndOTP')}
                                </Button>
                              ) : (
                                <div className="space-y-3">
                                  <div className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-center text-xs font-bold uppercase tracking-wider">
                                    {tDetails('otpGenerated')}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="000000"
                                      value={enteredOtp}
                                      onChange={(e) => setEnteredOtp(e.target.value)}
                                      maxLength={6}
                                      className="flex-1 h-12 bg-background border-border/50 text-foreground text-center text-lg font-black tracking-widest rounded-xl focus:ring-primary/20"
                                    />
                                    <Button
                                      onClick={() => handleVerifyOtpClick('end')}
                                      disabled={otpLoading || enteredOtp.length !== 6}
                                      className="h-12 px-6 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl active:scale-95 transition-all"
                                    >
                                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setShowGeoPhotoCapture(true);
                                setPhotoUploadType('end');
                              }}
                              disabled={photoUploadLoading}
                              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                              {photoUploadLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
                              {tDetails('uploadEndPhoto')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {showGeoPhotoCapture && photoUploadType && (
                    <div className="animate-in zoom-in-95 duration-300">
                      <GeoPhotoCapture
                        key={photoUploadType}
                        jobId={jobId}
                        type={photoUploadType}
                        onPhotoUpload={handlePhotoUpload}
                        onCancel={() => setShowGeoPhotoCapture(false)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-xl font-bold tracking-tight">{tCommon('labels.description')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-muted-foreground leading-relaxed font-medium">{job.description}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-xl font-bold tracking-tight">{tDetails('employerDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border border-primary/20 shadow-lg shadow-primary/5">
                    {job.employer?.name?.[0] || "E"}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-black text-foreground">{job.employer?.name || job.employer?.companyName}</h3>
                    {job.employer?.rating && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(job.employer.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground">({job.employer.rating})</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleContactEmployer}
                  className="w-full h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Employer
                </Button>
              </CardContent>
            </Card>

            {(isTimerRunning || (workLog?.startTime && workLog?.endTime)) && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden border-2 border-primary/10">
                <CardHeader className="p-8 border-b border-border/50 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Work Session
                    </CardTitle>
                    {isTimerRunning && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-10 text-center space-y-4">
                  <div className="text-6xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm">
                    {formatTime(timer)}
                  </div>
                  <div className="space-y-1">
                    {workLog?.startTime && (
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Started: {new Date(workLog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {workLog?.endTime && (
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Ended: {new Date(workLog.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {allWorkLogs.length > 0 && (
              <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader className="p-8 border-b border-border/50 bg-muted/30">
                  <CardTitle className="text-xl font-bold tracking-tight">{tDetails('workSchedule')} (This Month)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {allWorkLogs.filter(log => {
                      const logDate = new Date(log.workDate);
                      const now = new Date();
                      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                    }).slice(0, 3).map((log, index) => {
                      const isToday = new Date(log.workDate).toDateString() === new Date().toDateString();
                      return (
                        <div key={log._id} className={`p-4 rounded-2xl flex items-center justify-between gap-4 transition-all ${isToday ? 'bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5' : 'bg-muted/50 border border-transparent'}`}>
                          <div className="min-w-0">
                            <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>Day {index + 1}</p>
                            <p className="text-sm font-bold truncate">
                              {new Date(log.workDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${log.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            log.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              log.status === 'incomplete' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-muted text-muted-foreground/50 border-border/50'}`}>
                            {log.status}
                          </span>
                        </div>
                      );
                    })}

                    {allWorkLogs.filter(log => {
                      const logDate = new Date(log.workDate);
                      const now = new Date();
                      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                    }).length > 3 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border/50 hover:bg-muted/50 transition-all mt-2">
                              {tCommon('buttons.viewAll')} ({allWorkLogs.filter(log => {
                                const logDate = new Date(log.workDate);
                                const now = new Date();
                                return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                              }).length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md rounded-[2rem] border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
                            <DialogHeader className="p-8 pb-4 border-b border-border/50">
                              <DialogTitle className="text-2xl font-black tracking-tight">{tDetails('workSchedule')} (This Month)</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] p-8 pt-4">
                              <div className="space-y-3">
                                {allWorkLogs.filter(log => {
                                  const logDate = new Date(log.workDate);
                                  const now = new Date();
                                  return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                                }).map((log, index) => {
                                  const isToday = new Date(log.workDate).toDateString() === new Date().toDateString();
                                  return (
                                    <div key={log._id} className={`p-4 rounded-2xl flex items-center justify-between gap-4 transition-all ${isToday ? 'bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5' : 'bg-muted/30 border border-transparent hover:bg-muted/50'}`}>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>Day {index + 1}</p>
                                        <p className="text-sm font-bold truncate">
                                          {new Date(log.workDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                      </div>
                                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${log.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        log.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                          log.status === 'incomplete' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-muted text-muted-foreground/50 border-border/50'}`}>
                                        {log.status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div >
  )
}
