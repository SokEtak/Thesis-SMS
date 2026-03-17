import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type ReplacementValue = string | number;

export function translateMessage(
    key: string,
    messages: Record<string, string>,
    replacements: Record<string, ReplacementValue> = {},
): string {
    const template = messages[key] ?? key;

    return Object.entries(replacements).reduce(
        (value, [replacementKey, replacementValue]) =>
            value.replaceAll(`:${replacementKey}`, String(replacementValue)),
        template,
    );
}

export function useTranslate() {
    const { i18n } = usePage<SharedData>().props;

    return (
        key: string,
        replacements: Record<string, ReplacementValue> = {},
    ) => translateMessage(key, i18n.messages, replacements);
}

export function useCurrentLocale(): string {
    return usePage<SharedData>().props.i18n.locale;
}
