'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Database, MapPin, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SubscriptionUsageCard() {
    const { subscription, loading } = useSubscription();
    const router = useRouter();
    const t = useTranslations('Dashboard.employer');

    if (loading) {
        return (
            <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground">
                        Subscription Usage
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <p className="text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (!subscription) {
        return (
            <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground">
                        No Active Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    <p className="text-muted-foreground mb-4">
                        Subscribe to a plan to start posting jobs and unlocking worker profiles.
                    </p>
                    <Button onClick={() => router.push('/subscriptions')} className="w-full">
                        View Plans
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const databaseUnlocksPercent = (subscription.databaseUnlocksUsed / subscription.maxDatabaseUnlocks) * 100;
    const locationChangesPercent = (subscription.locationChangesUsed / subscription.maxLocationChanges) * 100;
    const daysRemaining = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <Card className="p-4 sm:p-6 bg-card/80 border-border/50 backdrop-blur-lg">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-2xl font-semibold text-foreground">
                        Subscription Usage
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{daysRemaining} days left</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground capitalize mt-1">
                    {subscription.planType} Plan - ₹{subscription.price}
                </p>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-4">
                {/* Database Unlocks */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Database Unlocks</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {subscription.databaseUnlocksUsed} / {subscription.maxDatabaseUnlocks}
                        </span>
                    </div>
                    <Progress value={databaseUnlocksPercent} className="h-2" />
                    {databaseUnlocksPercent >= 80 && (
                        <p className="text-xs text-orange-500">
                            {databaseUnlocksPercent >= 100 ? 'Limit reached!' : 'Running low on unlocks'}
                        </p>
                    )}
                </div>

                {/* Location Changes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Location Changes</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {subscription.locationChangesUsed} / {subscription.maxLocationChanges}
                        </span>
                    </div>
                    <Progress value={locationChangesPercent} className="h-2" />
                </div>

                {/* Active Jobs */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Active Jobs</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Max {subscription.maxActiveJobs} at a time
                        </span>
                    </div>
                </div>

                {/* Upgrade Button */}
                {(databaseUnlocksPercent >= 80 || locationChangesPercent >= 80) && (
                    <Button
                        onClick={() => router.push('/subscriptions')}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Plan
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
