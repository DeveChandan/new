"use client"

import { useState, useEffect } from "react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Briefcase, Loader2, LogOut, CheckCircle, Menu, X, XCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from 'next-intl'

interface SubscriptionPlan {
  planKey: string;
  name: string;
  price: number;
  features: string[];
  unavailableFeatures?: string[];
}

export default function SubscriptionsPage() {
  const t = useTranslations('Subscriptions')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  // No auth redirect — page is publicly viewable

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true)
        // Plans are public — always fetch
        const plansData = await apiClient.getSubscriptionPlans()
        setPlans(plansData as SubscriptionPlan[])

        // Current subscription requires auth — only fetch for logged-in employers
        if (user && user.role === "employer") {
          try {
            const subscriptionData = await apiClient.getCurrentSubscription()
            setCurrentSubscription(subscriptionData)
          } catch {
            // Silently ignore — user may not have a subscription yet
          }
        }
      } catch (err: any) {
        setError(err.message || t('errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [user])

  const handleSubscribe = async (planKey: string) => {
    // If not logged in, redirect to the new public checkout page
    if (!user) {
      router.push(`/checkout?plan=${planKey}`)
      return
    }
    if (user.role !== "employer") {
      setError("Only employers can subscribe to plans.")
      return
    }

    setError("")
    setSuccessMessage("")
    setSubscribing(true)
    try {
      const selectedPlanData = plans.find(p => p.planKey === planKey);
      const amount = selectedPlanData?.price || 0;

      // Free plan — activate directly without payment
      if (amount === 0 || planKey === 'free') {
        await apiClient.createSubscription(planKey as "free" | "basic" | "pro" | "premium");
        setSuccessMessage("Free plan activated successfully! You can now post jobs.");
        // Refresh subscription data
        const subscriptionData = await apiClient.getCurrentSubscription();
        setCurrentSubscription(subscriptionData);
        setSubscribing(false);
        return;
      }

      // Redirect to checkout page for paid plans
      router.push(`/checkout?plan=${planKey}`);
    } catch (err: any) {
      setError(err.message || t('errors.subscribeFailed'))
      setSubscribing(false)
    }
  }


  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const isEmployer = user && user.role === "employer"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href={user?.role === 'employer' ? '/dashboard/employer' : (user ? '/jobs' : '/')} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent tracking-tight">
              {tCommon('appName')}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Desktop Navigation for logged-in users */}
                <div className="hidden sm:flex items-center gap-4">
                  <Link href="/profile">
                    <Button variant="ghost" className="text-foreground hover:bg-accent rounded-full">
                      {tCommon('navigation.profile')}
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent text-foreground rounded-full"
                  >
                    <LogOut className="w-4 h-4" />
                    {tCommon('buttons.logout')}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full sm:hidden"
                  onClick={() => setIsMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-3">
                <Link href="/">
                  <Button variant="ghost" className="gap-2 px-2 sm:px-4">
                    <ArrowLeft className="w-4 h-4 hidden sm:block" /> Home
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 sm:px-6 text-xs sm:text-sm">
                    Login to Subscribe
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu (Slider) */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-white/40 z-50 sm:hidden"
          onClick={() => setIsMobileNavOpen(false)} // Close when clicking outside
        >
          <div
            className={`fixed left-0 top-0 h-full w-3/4 bg-background/88 shadow-lg p-4 transform transition-transform duration-300 ease-in-out backdrop-blur-md ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
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
            <div className="space-y-2">
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-md">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start flex items-center gap-2 text-foreground hover:bg-primary/10 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {/* Current Subscription Info — only show for logged-in employers */}
        {!loading && isEmployer && currentSubscription && (
          <Card className="mb-8 p-6 bg-primary/10 border-primary/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Current Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  {plans.find(p => p.planKey === currentSubscription.plan)?.name || currentSubscription.plan} -
                  <span className="ml-1">
                    {currentSubscription.status === 'active' ? '✓ Active' : currentSubscription.status}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Database Unlocks</p>
                <p className="text-lg font-bold text-primary">
                  {currentSubscription.databaseUnlocksUsed || 0} / {currentSubscription.maxDatabaseUnlocks || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(currentSubscription.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 bg-card/80 border-border/50 backdrop-blur-lg flex flex-col">
                <Skeleton className="h-8 w-2/4 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <Skeleton className="h-12 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-10 w-full mt-8" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan) => {
              const isSubscriptionActive = currentSubscription && currentSubscription.status === 'active' && new Date(currentSubscription.endDate) >= new Date();
              const isCurrentPlan = isEmployer && isSubscriptionActive && currentSubscription.plan === plan.planKey;
              const isRecommended = !isCurrentPlan && plan.planKey === 'pro'; // Recommend Pro plan

              const planLevels: Record<string, number> = { free: 0, basic: 1, pro: 2, premium: 3 };

              const currentLevel = (isEmployer && isSubscriptionActive) ? (planLevels[currentSubscription.plan] || 0) : -1;
              const thisLevel = planLevels[plan.planKey] || 0;

              // Add-on logic
              const isAddon = plan.planKey === 'worklog_access';
              const isUpgrade = !isAddon && (!isEmployer || thisLevel > currentLevel);
              const isDowngrade = !isAddon && (isEmployer && isSubscriptionActive && thisLevel < currentLevel);
              const isPremium = currentLevel === 3;
              const hasActiveAddon = currentSubscription && currentSubscription.worklogAccessExpiry && new Date(currentSubscription.worklogAccessExpiry) > new Date();

              const isAddonDisabled = isAddon && (isPremium || hasActiveAddon);
              const shouldHighlightButton = isUpgrade || (isAddon && !isAddonDisabled);

              return (
                <Card
                  key={plan.name}
                  className={`p-6 bg-card/80 border-border/50 backdrop-blur-lg flex flex-col hover:shadow-lg transition-shadow relative ${isCurrentPlan || (isAddon && hasActiveAddon) ? 'border-green-500 border-2 bg-green-500/5' :
                    plan.planKey === 'premium' ? 'border-primary border-2' : ''
                    }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{t('currentPlan')}</div>
                  )}
                  {isAddon && hasActiveAddon && !isPremium && (
                    <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Active</div>
                  )}
                  {!isCurrentPlan && !isAddon && isRecommended && (
                    <div className="absolute -top-3 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</div>
                  )}
                  {!isCurrentPlan && !isAddon && !isRecommended && plan.planKey === 'premium' && (
                    <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{t('popular')}</div>
                  )}
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-3xl font-bold text-foreground">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 flex-1 flex flex-col justify-between">
                    <div className="mb-6">
                      <p className="text-5xl font-bold text-primary mb-4">₹{plan.price}<span className="text-lg text-muted-foreground">{isAddon ? '' : t('perMonth')}</span></p>
                      <ul className="space-y-2 text-muted-foreground">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> {feature}</li>
                        ))}
                        {plan.unavailableFeatures?.map((feature) => (
                          <li key={feature} className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" /> {feature}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(plan.planKey)}
                      disabled={subscribing || isCurrentPlan || isDowngrade || isAddonDisabled}
                      variant={isCurrentPlan || (isAddon && hasActiveAddon) ? "outline" : shouldHighlightButton ? "default" : "secondary"}
                      className={`w-full rounded-full ${shouldHighlightButton ? 'bg-primary hover:bg-primary/90' : ''}`}
                    >
                      {subscribing && currentSubscription?.plan !== plan.planKey ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('subscribing')}
                        </>
                      ) : isAddon ? (
                        isPremium ? "Included in Premium" : (hasActiveAddon ? "Add-on Active" : (!user ? "Get Started" : "Purchase Add-on"))
                      ) : isCurrentPlan ? (
                        t('currentPlan')
                      ) : !user ? (
                        "Get Started"
                      ) : isUpgrade ? (
                        "Upgrade Plan"
                      ) : (
                        "Downgrade (Not Available)"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

