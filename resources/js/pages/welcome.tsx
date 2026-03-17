import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslate } from '@/lib/i18n';
import { ArrowRight, BookMarked, ClipboardCheck, School, ShieldCheck } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth, name } = usePage<SharedData>().props;
    const t = useTranslate();
    const highlights = [
        {
            title: t('Track attendance'),
            description: t(
                'Monitor attendance, assignments, timetables, and exam progress with records your team can trust.',
            ),
            icon: ClipboardCheck,
        },
        {
            title: t('Classrooms'),
            description: t(
                'Homework, attendance, classroom structure, exam tracking, and school communication are coordinated in one secure workspace.',
            ),
            icon: School,
        },
        {
            title: t('Track performance'),
            description: t(
                'Use one connected system for results, homework, and student follow-up.',
            ),
            icon: BookMarked,
        },
        {
            title: t('Language'),
            description: t(
                'English and Khmer can be managed from the settings area for staff accounts.',
            ),
            icon: ShieldCheck,
        },
    ];

    return (
        <>
            <Head title={t('Welcome')}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-2 rounded-full border border-[#19140035] px-5 py-2 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                {t('Dashboard')}
                                <ArrowRight className="size-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-full border border-transparent px-5 py-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    {t('Log in')}
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-full border border-[#19140035] px-5 py-2 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        {t('Register')}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <section className="space-y-6 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                                {t('School Management System')}
                            </div>

                            <div className="space-y-4">
                                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 dark:text-white lg:text-5xl">
                                    {t(
                                        'Run classes, attendance, results, homework, and communication from one place.',
                                    )}
                                </h1>
                                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                                    {t(
                                        'Thesis SMS helps school teams keep student records current, coordinate classrooms, and share updates with confidence.',
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                    >
                                        {t('Dashboard')}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        >
                                            {t('Log in')}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
                                            >
                                                {t('Register')}
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        10+
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('Core modules')}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        2
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('Supported languages')}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                        {name}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {t('School operations made clear and connected.')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4">
                            {highlights.map(({ title, description, icon: Icon }) => (
                                <article
                                    key={title}
                                    className="rounded-[1.75rem] border border-black/5 bg-white/70 p-5 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.5)] backdrop-blur dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                        <Icon className="size-5" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {description}
                                    </p>
                                </article>
                            ))}
                        </section>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
