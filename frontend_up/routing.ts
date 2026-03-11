import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'],

    // Used when no locale matches
    defaultLocale: 'en'
});
