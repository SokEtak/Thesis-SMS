import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BookMarked,
    BookOpen,
    ClipboardCheck,
    Clock3,
    Database,
    Folder,
    Minus,
    School,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const t = useTranslate();
    const { overview, resources, generated_at: generatedAt } = usePage<DashboardPageProps>().props;
    const resourceEntries = Object.entries(resources) as Array<[ResourceKey, ResourceSummary]>;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Dashboard')} />
            <div className="space-y-6 p-4 md:p-6">
                <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/70 to-teal-50/80 shadow-md shadow-slate-200/60 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:shadow-none">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />
                    <div className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-900/20" />
                    <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-900/20" />

                    <div className="relative grid gap-5 p-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                        <div className="space-y-3">
                            <Badge variant="outline" className="rounded-full border-sky-200 bg-white/80 px-3 py-1 text-[11px] tracking-[0.12em] uppercase text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <Sparkles className="mr-1 size-3.5" />
                                {t('Insights Workspace')}
                            </Badge>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl dark:text-slate-100">
                                {t('Dashboard Overview')}
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base dark:text-slate-300">
                                {t('Monitor academic and operational resources in one place with live totals, trend signals, and quick navigation.')}
                            </p>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                                <Clock3 className="size-3.5" />
                                {t('Updated :time', { time: formatDateTime(generatedAt) })}
                            </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {resourceEntries.map(([resourceKey]) => {
                                const meta = resourceMeta[resourceKey];
                                const Icon = meta.icon;

                                return (
                                    <Button
                                        key={`${resourceKey}-quick-open`}
                                        asChild
                                        variant="outline"
                                        className={cn(
                                            'h-auto justify-between rounded-xl border bg-white/90 px-3 py-2 text-left shadow-sm dark:bg-slate-900/80',
                                            meta.quickActionBorder,
                                        )}
                                    >
                                        <Link href={route(meta.indexRoute)} prefetch>
                                            <span className="flex items-center gap-2">
                                                <Icon className={cn('size-4', meta.iconTone)} />
                                                <span className="text-sm font-medium">{t(meta.label)}</span>
                                            </span>
                                            <ArrowRight className="size-4 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                );
                            })}
                            {resourceEntries.map(([resourceKey]) => {
                                const meta = resourceMeta[resourceKey];

                                return (
                                    <Button
                                        key={`${resourceKey}-quick-trash`}
                                        asChild
                                        variant="outline"
                                        className="h-auto justify-between rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                                    >
                                        <Link href={route(meta.trashedRoute)} prefetch>
                                            <span className="flex items-center gap-2">
                                                <Trash2 className="size-4 text-rose-500 dark:text-rose-400" />
                                                <span className="text-sm font-medium">{t('Trashed :resource', { resource: t(meta.label) })}</span>
                                            </span>
                                            <ArrowRight className="size-4 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label={t('Total Records')}
                        value={overview.total_records}
                        caption={t('Across all tracked resources')}
                        icon={Database}
                        iconClass="text-sky-600 dark:text-sky-300"
                        cardClass="border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-background dark:border-slate-700 dark:from-slate-900"
                    />
                    <MetricCard
                        label={t('Active Records')}
                        value={overview.active_records}
                        caption={t(':percent% active integrity', { percent: overview.active_ratio.toFixed(1) })}
                        icon={Sparkles}
                        iconClass="text-emerald-600 dark:text-emerald-300"
                        cardClass="border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-background dark:border-slate-700 dark:from-slate-900"
                    />
                    <MetricCard
                        label={t('Trashed Records')}
                        value={overview.trashed_records}
                        caption={t('Soft deleted entries')}
                        icon={Trash2}
                        iconClass="text-rose-600 dark:text-rose-300"
                        cardClass="border-rose-200/70 bg-gradient-to-br from-rose-50/90 to-background dark:border-slate-700 dark:from-slate-900"
                    />
                    <MetricCard
                        label={t('Created (7 Days)')}
                        value={overview.created_last_7_days}
                        caption={t('New records this week')}
                        icon={ArrowUpRight}
                        iconClass="text-violet-600 dark:text-violet-300"
                        cardClass="border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-background dark:border-slate-700 dark:from-slate-900"
                    />
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    {resourceEntries.map(([resourceKey, summary]) => {
                        const meta = resourceMeta[resourceKey];
                        const trend = summary.trend;
                        const TrendIcon = trend.direction === 'up'
                            ? ArrowUpRight
                            : trend.direction === 'down'
                                ? ArrowDownRight
                                : Minus;
                        const trendTone = trend.direction === 'up'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800'
                            : trend.direction === 'down'
                                ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/30 dark:border-rose-800'
                                : 'text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700';

                        return (
                            <Card
                                key={resourceKey}
                                className={cn(
                                    'gap-0 overflow-hidden border shadow-sm',
                                    meta.resourceCardClass,
                                )}
                            >
                                <CardHeader className="space-y-3 pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base font-semibold">{t(meta.label)}</CardTitle>
                                            <CardDescription>{t(meta.description)}</CardDescription>
                                        </div>
                                        <span className={cn('inline-flex size-9 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-900', meta.iconContainerClass)}>
                                            <meta.icon className={cn('size-4', meta.iconTone)} />
                                        </span>
                                    </div>
                                    {summary.can_view ? (
                                        <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', trendTone)}>
                                            <TrendIcon className="size-3.5" />
                                            {formatTrendLabel(trend, t)}
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="w-fit rounded-full">{t('No access')}</Badge>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-4 pb-5">
                                    {summary.can_view ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                                                    <p className="text-xs font-medium text-muted-foreground">{t('Total')}</p>
                                                    <p className="mt-1 text-xl font-semibold">{formatNumber(summary.total)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                                                    <p className="text-xs font-medium text-muted-foreground">{t('Trashed')}</p>
                                                    <p className="mt-1 text-xl font-semibold">{formatNumber(summary.trashed)}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground">{t('7-Day Activity')}</p>
                                                <TrendBars series={summary.series} barClass={meta.barTone} />
                                            </div>

                                            {meta.statItems.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {meta.statItems.map((item) => (
                                                        <div
                                                            key={`${resourceKey}-${item.key}`}
                                                            className="rounded-lg border border-slate-200/70 bg-white/75 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/70"
                                                        >
                                                            <p className="text-muted-foreground">{t(item.label)}</p>
                                                            <p className="mt-1 font-semibold">{formatNumber(summary.stats[item.key] ?? 0)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button asChild size="sm" className="flex-1">
                                                    <Link href={route(meta.indexRoute)} prefetch>
                                                        {t('Open :resource', { resource: t(meta.label) })}
                                                    </Link>
                                                </Button>
                                                <Button asChild size="sm" variant="outline" className="flex-1">
                                                    <Link href={route(meta.trashedRoute)} prefetch>
                                                        {t('View Trashed')}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 p-4 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
                                            {t('You do not currently have permission to view this resource.')}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    {resourceEntries.map(([resourceKey, summary]) => {
                        const meta = resourceMeta[resourceKey];

                        return (
                            <Card key={`${resourceKey}-recent`} className="gap-0 border border-slate-200/80 dark:border-slate-700/70">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">{t(':resource Recent', { resource: t(meta.label) })}</CardTitle>
                                            <CardDescription>{t('Latest entries')}</CardDescription>
                                        </div>
                                        <meta.icon className={cn('size-4', meta.iconTone)} />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 pb-5">
                                    {!summary.can_view && (
                                        <div className="rounded-lg border border-dashed border-slate-300/80 bg-slate-50/60 px-3 py-3 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
                                            {t('No access for this section.')}
                                        </div>
                                    )}
                                    {summary.can_view && summary.recent.length === 0 && (
                                        <div className="rounded-lg border border-dashed border-slate-300/80 bg-slate-50/60 px-3 py-3 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
                                            {t('No records yet.')}
                                        </div>
                                    )}
                                    {summary.can_view && summary.recent.map((item) => (
                                        <div
                                            key={`${resourceKey}-recent-${item.id}`}
                                            className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-800"
                                        >
                                            <p className="truncate text-sm font-medium">{item.title}</p>
                                            <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(item.created_at)}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            </div>
        </AppLayout>
    );
}

type TrendDirection = 'up' | 'down' | 'flat';

interface TrendSummary {
    direction: TrendDirection;
    percent: number;
}

interface SeriesPoint {
    date: string;
    label: string;
    value: number;
}

interface RecentItem {
    id: number;
    title: string;
    subtitle: string;
    created_at: string | null;
}

interface ResourceSummary {
    can_view: boolean;
    total: number;
    trashed: number;
    created_last_7_days: number;
    created_previous_7_days: number;
    trend: TrendSummary;
    series: SeriesPoint[];
    stats: Record<string, number>;
    recent: RecentItem[];
}

interface DashboardOverview {
    total_records: number;
    active_records: number;
    trashed_records: number;
    created_last_7_days: number;
    active_ratio: number;
}

interface DashboardPageProps {
    generated_at: string;
    overview: DashboardOverview;
    resources: {
        users: ResourceSummary;
        classrooms: ResourceSummary;
        subjects: ResourceSummary;
        attendances: ResourceSummary;
        exam_results: ResourceSummary;
        homeworks: ResourceSummary;
        homework_submissions: ResourceSummary;
        leave_requests: ResourceSummary;
        messages: ResourceSummary;
        timetables: ResourceSummary;
    };
}

type ResourceKey = keyof DashboardPageProps['resources'];

interface ResourceMeta {
    label: string;
    shortLabel: string;
    description: string;
    icon: LucideIcon;
    indexRoute: string;
    trashedRoute: string;
    iconTone: string;
    iconContainerClass: string;
    resourceCardClass: string;
    quickActionBorder: string;
    barTone: string;
    statItems: Array<{ key: string; label: string }>;
}

const resourceMeta: Record<ResourceKey, ResourceMeta> = {
    users: {
        label: 'Users',
        shortLabel: 'Users',
        description: 'People, roles, and linked profiles',
        icon: Users,
        indexRoute: 'users.index',
        trashedRoute: 'users.trashed',
        iconTone: 'text-sky-600 dark:text-sky-300',
        iconContainerClass: 'border-sky-200/70 dark:border-slate-700',
        resourceCardClass: 'border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-sky-200/80 dark:border-slate-700',
        barTone: 'bg-sky-500/85 dark:bg-sky-400/85',
        statItems: [
            { key: 'students', label: 'Students' },
            { key: 'teachers', label: 'Teachers' },
        ],
    },
    classrooms: {
        label: 'Classrooms',
        shortLabel: 'Classes',
        description: 'Class structure and teacher assignment',
        icon: School,
        indexRoute: 'classrooms.index',
        trashedRoute: 'classrooms.trashed',
        iconTone: 'text-emerald-600 dark:text-emerald-300',
        iconContainerClass: 'border-emerald-200/70 dark:border-slate-700',
        resourceCardClass: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-emerald-200/80 dark:border-slate-700',
        barTone: 'bg-emerald-500/85 dark:bg-emerald-400/85',
        statItems: [
            { key: 'assigned_teachers', label: 'With Teacher' },
            { key: 'without_teacher', label: 'No Teacher' },
        ],
    },
    subjects: {
        label: 'Subjects',
        shortLabel: 'Subjects',
        description: 'Learning catalog and subject coding',
        icon: BookMarked,
        indexRoute: 'subjects.index',
        trashedRoute: 'subjects.trashed',
        iconTone: 'text-violet-600 dark:text-violet-300',
        iconContainerClass: 'border-violet-200/70 dark:border-slate-700',
        resourceCardClass: 'border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-violet-200/80 dark:border-slate-700',
        barTone: 'bg-violet-500/85 dark:bg-violet-400/85',
        statItems: [
            { key: 'with_code', label: 'With Code' },
            { key: 'without_code', label: 'No Code' },
        ],
    },
    attendances: {
        label: 'Attendances',
        shortLabel: 'Attendances',
        description: 'Daily student attendance records',
        icon: ClipboardCheck,
        indexRoute: 'attendances.index',
        trashedRoute: 'attendances.trashed',
        iconTone: 'text-amber-600 dark:text-amber-300',
        iconContainerClass: 'border-amber-200/70 dark:border-slate-700',
        resourceCardClass: 'border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-amber-200/80 dark:border-slate-700',
        barTone: 'bg-amber-500/85 dark:bg-amber-400/85',
        statItems: [
            { key: 'present', label: 'Present' },
            { key: 'absent', label: 'Absent' },
            { key: 'late', label: 'Late' },
        ],
    },
    exam_results: {
        label: 'Exam Results',
        shortLabel: 'Exam Results',
        description: 'Student performance and exam records',
        icon: BookOpen,
        indexRoute: 'exam-results.index',
        trashedRoute: 'exam-results.trashed',
        iconTone: 'text-indigo-600 dark:text-indigo-300',
        iconContainerClass: 'border-indigo-200/70 dark:border-slate-700',
        resourceCardClass: 'border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-indigo-200/80 dark:border-slate-700',
        barTone: 'bg-indigo-500/85 dark:bg-indigo-400/85',
        statItems: [
            { key: 'final', label: 'Final' },
            { key: 'draft', label: 'Draft' },
            { key: 'average_score', label: 'Avg Score' },
        ],
    },
    homeworks: {
        label: 'Homeworks',
        shortLabel: 'Homeworks',
        description: 'Assignment publishing and deadlines',
        icon: Folder,
        indexRoute: 'homeworks.index',
        trashedRoute: 'homeworks.trashed',
        iconTone: 'text-cyan-600 dark:text-cyan-300',
        iconContainerClass: 'border-cyan-200/70 dark:border-slate-700',
        resourceCardClass: 'border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-cyan-200/80 dark:border-slate-700',
        barTone: 'bg-cyan-500/85 dark:bg-cyan-400/85',
        statItems: [
            { key: 'with_deadline', label: 'With Deadline' },
            { key: 'without_deadline', label: 'No Deadline' },
        ],
    },
    homework_submissions: {
        label: 'Homework Submissions',
        shortLabel: 'Submissions',
        description: 'Student submission and scoring pipeline',
        icon: ClipboardCheck,
        indexRoute: 'homework-submissions.index',
        trashedRoute: 'homework-submissions.trashed',
        iconTone: 'text-emerald-600 dark:text-emerald-300',
        iconContainerClass: 'border-emerald-200/70 dark:border-slate-700',
        resourceCardClass: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-emerald-200/80 dark:border-slate-700',
        barTone: 'bg-emerald-500/85 dark:bg-emerald-400/85',
        statItems: [
            { key: 'scored', label: 'Scored' },
            { key: 'unscored', label: 'Unscored' },
        ],
    },
    leave_requests: {
        label: 'Leave Requests',
        shortLabel: 'Leave',
        description: 'Absence request approvals and status',
        icon: BookMarked,
        indexRoute: 'leave-requests.index',
        trashedRoute: 'leave-requests.trashed',
        iconTone: 'text-amber-600 dark:text-amber-300',
        iconContainerClass: 'border-amber-200/70 dark:border-slate-700',
        resourceCardClass: 'border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-amber-200/80 dark:border-slate-700',
        barTone: 'bg-amber-500/85 dark:bg-amber-400/85',
        statItems: [
            { key: 'approved', label: 'Approved' },
            { key: 'pending', label: 'Pending' },
            { key: 'rejected', label: 'Rejected' },
        ],
    },
    messages: {
        label: 'Messages',
        shortLabel: 'Messages',
        description: 'Communication logs and read states',
        icon: Users,
        indexRoute: 'messages.index',
        trashedRoute: 'messages.trashed',
        iconTone: 'text-rose-600 dark:text-rose-300',
        iconContainerClass: 'border-rose-200/70 dark:border-slate-700',
        resourceCardClass: 'border-rose-200/70 bg-gradient-to-br from-rose-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-rose-200/80 dark:border-slate-700',
        barTone: 'bg-rose-500/85 dark:bg-rose-400/85',
        statItems: [
            { key: 'read', label: 'Read' },
            { key: 'unread', label: 'Unread' },
        ],
    },
    timetables: {
        label: 'Timetables',
        shortLabel: 'Timetables',
        description: 'Class schedule planning and tracking',
        icon: School,
        indexRoute: 'timetables.index',
        trashedRoute: 'timetables.trashed',
        iconTone: 'text-sky-600 dark:text-sky-300',
        iconContainerClass: 'border-sky-200/70 dark:border-slate-700',
        resourceCardClass: 'border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-white to-white dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        quickActionBorder: 'border-sky-200/80 dark:border-slate-700',
        barTone: 'bg-sky-500/85 dark:bg-sky-400/85',
        statItems: [
            { key: 'weekdays', label: 'Weekdays' },
            { key: 'weekend', label: 'Weekend' },
        ],
    },
};

function MetricCard({
    label,
    value,
    caption,
    icon: Icon,
    iconClass,
    cardClass,
}: {
    label: string;
    value: number;
    caption: string;
    icon: LucideIcon;
    iconClass: string;
    cardClass: string;
}) {
    return (
        <Card className={cn('gap-0 overflow-hidden border py-0', cardClass)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.11em] uppercase text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-semibold">{formatNumber(value)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                    </div>
                    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/85 dark:border-slate-700 dark:bg-slate-900/70">
                        <Icon className={cn('size-4', iconClass)} />
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function TrendBars({ series, barClass }: { series: SeriesPoint[]; barClass: string }) {
    const maxValue = Math.max(...series.map((item) => item.value), 1);

    return (
        <div className="space-y-2">
            <div className="flex h-14 items-end gap-1.5">
                {series.map((point) => {
                    const heightPercent = point.value === 0
                        ? 16
                        : Math.max(20, Math.round((point.value / maxValue) * 100));

                    return (
                        <div key={`${point.date}-bar`} className="flex flex-1 items-end">
                            <div
                                className={cn('w-full rounded-sm transition-all', barClass)}
                                style={{ height: `${heightPercent}%` }}
                                title={`${point.label}: ${point.value}`}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {series.map((point) => (
                    <span key={`${point.date}-label`}>{point.label}</span>
                ))}
            </div>
        </div>
    );
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed);
}

function formatTrendLabel(
    trend: TrendSummary,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): string {
    if (trend.direction === 'flat') {
        return t('No change vs previous 7 days');
    }

    return trend.direction === 'up'
        ? t('Increase of :percent% vs previous 7 days', { percent: trend.percent })
        : t('Decrease of :percent% vs previous 7 days', { percent: trend.percent });
}
