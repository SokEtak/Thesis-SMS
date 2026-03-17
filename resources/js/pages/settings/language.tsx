import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/lib/i18n';
import { route } from '@/lib/route';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { FormEvent } from 'react';

export default function Language({
    selectedLocale,
}: {
    selectedLocale: string;
}) {
    const t = useTranslate();
    const { i18n } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Language settings'),
            href: route('language.edit'),
        },
    ];
    const { data, setData, put, processing } = useForm({
        locale: selectedLocale,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('language.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Language settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('Display language')}
                        description={t(
                            'Choose the language used across your account and shared interface text.',
                        )}
                    />

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-3">
                            {i18n.availableLocales.map((locale) => {
                                const isActive = data.locale === locale.code;
                                const description = t(
                                    locale.code === 'km'
                                        ? 'This language will be used in shared interface text and key settings screens.'
                                        : 'This language will be used in shared interface text and key settings screens.',
                                );

                                return (
                                    <button
                                        key={locale.code}
                                        type="button"
                                        onClick={() =>
                                            setData('locale', locale.code)
                                        }
                                        className={cn(
                                            'flex w-full items-start justify-between rounded-2xl border px-4 py-4 text-left transition-colors',
                                            isActive
                                                ? 'border-sky-400 bg-sky-50 shadow-sm dark:border-sky-500 dark:bg-sky-950/40'
                                                : 'border-border hover:border-sky-300 hover:bg-muted/60',
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                {locale.native}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {locale.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {description}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex size-8 items-center justify-center rounded-full border',
                                                isActive
                                                    ? 'border-sky-500 bg-sky-500 text-white'
                                                    : 'border-border text-transparent',
                                            )}
                                        >
                                            <Check className="size-4" />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <Button type="submit" disabled={processing}>
                            {t('Save language')}
                        </Button>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
