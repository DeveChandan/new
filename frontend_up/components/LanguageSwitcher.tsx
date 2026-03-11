'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { ChangeEvent, useTransition } from 'react';

export default function LanguageSwitcher() {
    const t = useTranslations('LocaleSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <label className="relative text-foreground border border-border rounded-md">
            <p className="sr-only">{t('label')}</p>
            <select
                defaultValue={locale}
                className="appearance-none bg-background py-2 pl-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={onSelectChange}
                disabled={isPending}
            >
                <option value="en">{t('en')}</option>
                <option value="hi">{t('hi')}</option>
                <option value="bn">{t('bn')}</option>
                <option value="te">{t('te')}</option>
                <option value="ta">{t('ta')}</option>
                <option value="mr">{t('mr')}</option>
                <option value="gu">{t('gu')}</option>
                <option value="kn">{t('kn')}</option>
                <option value="ml">{t('ml')}</option>
                <option value="pa">{t('pa')}</option>
                <option value="or">{t('or')}</option>
                <option value="as">{t('as')}</option>
            </select>
            {/* Add a custom arrow for better styling */}
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </label>
    );
}
