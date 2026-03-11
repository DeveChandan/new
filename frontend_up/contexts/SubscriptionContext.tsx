'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

interface SubscriptionData {
    _id: string;
    planType: string;
    maxActiveJobs: number;
    maxDatabaseUnlocks: number;
    maxLocationChanges: number;
    databaseUnlocksUsed: number;
    locationChangesUsed: number;
    endDate: string;
    status: string;
    price: number;
    features: string[];
}

interface SubscriptionContextType {
    subscription: SubscriptionData | null;
    loading: boolean;
    refreshSubscription: () => Promise<void>;
    hasActiveSubscription: boolean;
    canUnlockWorker: boolean;
    canChangeLocation: boolean;
    canPostJob: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshSubscription = async () => {
        try {
            // Only fetch if user is authenticated
            if (!isAuthenticated()) {
                setSubscription(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            const data = await apiClient.getCurrentSubscription() as SubscriptionData;
            setSubscription(data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSubscription();
    }, []);

    const hasActiveSubscription = subscription !== null &&
        subscription.status === 'active' &&
        new Date(subscription.endDate) >= new Date();

    const canUnlockWorker = hasActiveSubscription &&
        subscription.databaseUnlocksUsed < subscription.maxDatabaseUnlocks;

    const canChangeLocation = hasActiveSubscription &&
        subscription.locationChangesUsed < subscription.maxLocationChanges;

    const canPostJob = hasActiveSubscription;

    return (
        <SubscriptionContext.Provider
            value={{
                subscription,
                loading,
                refreshSubscription,
                hasActiveSubscription,
                canUnlockWorker,
                canChangeLocation,
                canPostJob
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider');
    }
    return context;
};
