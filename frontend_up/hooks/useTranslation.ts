'use client';

import { useLocale } from 'next-intl';

/**
 * Hook to get the current locale for API requests
 * This hook integrates with next-intl to get the user's preferred language
 * and provides it for translation API calls
 */
export function useTranslationLocale() {
    const locale = useLocale();

    return {
        locale,
        isTranslationEnabled: locale !== 'en',
    };
}

/**
 * Hook to wrap API calls with automatic locale parameter
 * Usage: const { callWithLocale } = useApiWithLocale();
 * Then: callWithLocale((locale) => apiClient.getJobs({ ...params, locale }))
 */
export function useApiWithLocale() {
    const { locale } = useTranslationLocale();

    const callWithLocale = async <T,>(
        apiCall: (locale: string) => Promise<T>
    ): Promise<T> => {
        return apiCall(locale);
    };

    return {
        locale,
        callWithLocale,
    };
}
