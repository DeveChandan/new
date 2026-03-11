"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { Loader2, Search, ArrowLeft, MapPin, Star, IndianRupee, Menu, X, LogOut, Briefcase } from "lucide-react"
import { Link } from "@/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react"; // Import Filter icon

import { useTranslations } from 'next-intl';
import { workerTypeSkills } from "@/lib/worker-data";

export default function HireTalentPage() {
  const t = useTranslations('Dashboard.employer')
  const tHire = useTranslations('Dashboard.employer.hireTalentPage')
  const tCommon = useTranslations('Common')
  const tWT = useTranslations('WorkerTypes');
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkerType, setSelectedWorkerType] = useState<string>("") // State for worker type
  const [location, setLocation] = useState("")
  const [availability, setAvailability] = useState("") // 'available' or 'unavailable'
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false) // State for mobile nav

  // New State for Job-Based Recommendations
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(""); // Default to empty string (no selection)

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }


  const fetchWorkers = async () => {
    try {
      setLoading(true)

      // If no job selected and no search params, don't fetch (keep blank)
      if (!selectedJobId && !searchTerm && !location && !availability && !selectedWorkerType) {
        setWorkers([]);
        setLoading(false);
        return;
      }

      const params = {
        keyword: searchTerm || undefined,
        workerType: selectedWorkerType || undefined,
        location: location || undefined,
        availability: availability || undefined,
        jobId: (selectedJobId && selectedJobId !== 'all') ? selectedJobId : undefined,
      }

      const fetchedWorkers = await apiClient.searchWorkers(params);
      setWorkers(fetchedWorkers as any[]);
    } catch (err: any) {
      setError(err.message || tHire('errorFetch'));
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch Employer's Jobs for Recommendations ON MOUNT
    if (!authLoading && user && user.role === "employer") {
      apiClient.getEmployerJobs().then((res: any) => {
        const jobList = Array.isArray(res) ? res : (res.jobs || []);
        // Filter for active jobs, sort by creation date desc (newest first)
        const activeJobs = jobList
          .filter((j: any) => j.status === 'open' || j.status === 'in-progress')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setJobs(activeJobs);

        // Auto-select the latest job if available
        if (activeJobs.length > 0) {
          setSelectedJobId(activeJobs[0]._id);
        } else {
          // If no jobs, ensure we don't select anything (will show blank/empty state)
          setSelectedJobId("");
        }
      }).catch(err => console.error("Error fetching jobs:", err));
    }
  }, [user, authLoading]) // Run once on load (dependent on user auth)

  // Separate effect to trigger fetch when filters/job changes
  useEffect(() => {
    if (!authLoading && user && user.role === "employer") {
      const timeoutId = setTimeout(() => {
        fetchWorkers();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedJobId, searchTerm, selectedWorkerType, location, availability]);

  const handleWorkerTypeChange = (value: string) => {
    setSelectedWorkerType(value)
  }

  const handleResetFilters = () => {
    setSearchTerm("")
    setSelectedWorkerType("")
    setLocation("")
    setAvailability("")
  }

  // Reusable Filter Content
  const renderFilterContent = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">{tHire('workerType')}</p>
        <Select onValueChange={handleWorkerTypeChange} value={selectedWorkerType}>
          <SelectTrigger className="w-full rounded-full bg-input/50 border-border text-foreground placeholder:text-muted-foreground">
            <SelectValue placeholder={tHire('selectWorkerType')} />
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
        <p className="text-sm font-medium mb-2">{tHire('location')}</p>
        <Input
          placeholder={tHire('locationPlaceholder')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">{tHire('availability')}</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={availability === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAvailability('available')}
            className="rounded-full flex-grow text-xs sm:text-sm"
          >
            {tHire('available')}
          </Button>
          <Button
            variant={availability === 'unavailable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAvailability('unavailable')}
            className="rounded-full flex-grow text-xs sm:text-sm"
          >
            {tHire('unavailable')}
          </Button>
          <Button
            variant={availability === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAvailability('')}
            className="rounded-full flex-grow text-xs sm:text-sm"
          >
            {tHire('any')}
          </Button>
        </div>
      </div>
      <Button onClick={handleResetFilters} variant="outline" className="w-full rounded-full mt-2">{tHire('resetFilters')}</Button>
    </div>
  );


  if (authLoading) { // Only show full-screen loader for authLoading
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/employer" className="flex items-center gap-2 text-foreground hover:text-primary transition w-fit">
            <Button variant="ghost" size="icon" className="sm:hidden rounded-full">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">{tHire('backToDashboard')}</span>
            </Button>
            <Button variant="ghost" className="hidden sm:flex items-center gap-2 rounded-full">
              <ArrowLeft className="w-4 h-4" />
              {tHire('backToDashboard')}
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate max-w-[200px] sm:max-w-none">{tHire('title')}</h1> {/* Page Title */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="rounded-full">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="rounded-full"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu (Slider) */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 sm:hidden"
          onClick={() => setIsMobileNavOpen(false)} // Close when clicking outside
        >
          <div
            className={`fixed right-0 top-0 h-full w-3/4 bg-background shadow-lg p-4 transform transition-transform duration-300 ease-in-out backdrop-blur-md ${isMobileNavOpen ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start rounded-md px-2">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 rounded-md px-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Smart Recommendations Section */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary fill-primary" />
              {tHire('smartRecommendations')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{tHire('selectJob')}</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select
                value={selectedJobId}
                onValueChange={(val) => {
                  setSelectedJobId(val);
                  // Optionally reset other filters when selecting a job to avoid confusion
                  if (val !== 'all') {
                    setSearchTerm("");
                    setSelectedWorkerType("");
                    setLocation("");
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[300px] bg-background">
                  <SelectValue placeholder={tHire('selectJobPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tHire('clearSelection')}</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job._id} value={job._id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedJobId && selectedJobId !== 'all' && (
                <div className="text-sm text-primary font-medium animate-in fade-in slide-in-from-left-4">
                  ✨ {tHire('recommendationMode')}
                  <p className="text-xs text-muted-foreground font-normal mt-1">{tHire('recommendationDescription')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Helper message if list is blank because no job selected */}
        {!selectedJobId && !searchTerm && !selectedWorkerType && workers.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
            <p className="mb-2">Select a job above or use filters to find workers.</p>
            <p className="text-sm">Post a new job to verify your recommendations automatically.</p>
          </div>
        )}

        <div className="flex gap-2 items-center w-full mb-8">
          <Input
            placeholder={tHire('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground rounded-full flex-grow h-11"
          />

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden rounded-full h-11 w-11 shrink-0">
                <Filter className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle>{tHire('filters')}</SheetTitle>
              </SheetHeader>
              {renderFilterContent()}
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <Card className="bg-card/80 border-border/50 backdrop-blur-lg sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">{tHire('filters')}</h3>
                {renderFilterContent()}
              </CardContent>
            </Card>
          </div>

          {/* Workers List */}
          <div className="lg:col-span-3 space-y-6 relative min-h-[200px]">
            {loading && ( // Show circular loader when loading
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {workers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(worker => {
                  return (
                    <Card key={worker._id} className="transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg bg-card/80 border-border/50 backdrop-blur-lg overflow-hidden h-full">
                      <CardContent className="flex flex-col p-6 h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <img src={worker.profilePicture || '/placeholder-user.jpg'} alt={worker.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/50 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-lg font-bold text-foreground truncate">{worker.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{worker.workerType?.join(', ') || tHire('noSkills')}</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm flex-grow">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <IndianRupee className="w-4 h-4 text-primary shrink-0" />
                            <span>{worker.hourlyRate ? tHire('hourlyRateValue', { rate: worker.hourlyRate }) : tHire('notSpecified')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">{worker.locationName || worker.location?.address || (typeof worker.location === 'string' ? worker.location : null) || tHire('notSpecified')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Star className="w-4 h-4 text-primary shrink-0" />
                            <span>{worker.rating ? `${worker.rating.toFixed(1)} (${worker.reviews?.length || 0})` : tHire('noReviews')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="w-4 h-4 text-primary shrink-0" />
                            <span>{worker.experience ? `${worker.experience} years` : tHire('notSpecified')}</span>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center pt-4 border-t border-border/50">
                          <p className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${worker.availability === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {worker.availability}
                          </p>
                          <Link href={`/profile/${worker._id}`}>
                            <Button variant="default" size="sm" className="rounded-full px-4">{tHire('viewProfile')}</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-card/50 rounded-3xl border border-border/50 border-dashed">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground">{tHire('noWorkers')}</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
                <Button variant="link" onClick={handleResetFilters} className="mt-4 text-primary">Clear all filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
