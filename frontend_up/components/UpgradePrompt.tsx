'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UpgradePromptProps {
    open: boolean;
    onClose: () => void;
    feature: 'databaseUnlocks' | 'locationChanges' | 'activeJobs';
    currentPlan?: string;
    limit?: number;
    used?: number;
}

export default function UpgradePrompt({ open, onClose, feature, currentPlan, limit, used }: UpgradePromptProps) {
    const router = useRouter();
    const t = useTranslations('SubscriptionLimits');

    const featureMessages = {
        databaseUnlocks: {
            title: t('title'),
            description: t('description'),
            icon: <AlertCircle className="h-6 w-6 text-orange-500" />
        },
        locationChanges: {
            title: t('locationChangeTitle'),
            description: t('locationChangeDesc'),
            icon: <AlertCircle className="h-6 w-6 text-orange-500" />
        },
        activeJobs: {
            title: t('activeJobTitle'),
            description: t('activeJobDesc'),
            icon: <AlertCircle className="h-6 w-6 text-orange-500" />
        }
    };

    const message = featureMessages[feature];

    const handleUpgrade = () => {
        router.push('/subscriptions');
        onClose();
    };

    const handleViewJobs = () => {
        router.push('/dashboard/employer');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {message.icon}
                        <DialogTitle className="text-xl">{message.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        {message.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">{t('upgradeTitle')}</h4>
                            <p className="text-sm text-blue-700">
                                {t('upgradeDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                    {feature === 'activeJobs' ? (
                        <>
                            <Button variant="outline" onClick={onClose}>
                                {t('cancelJob')}
                            </Button>
                            <Button onClick={handleViewJobs}>
                                {t('viewJobs')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                {t('upgrade')}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
