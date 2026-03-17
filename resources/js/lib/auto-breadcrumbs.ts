import { route } from '@/lib/route';
import type { BreadcrumbItem } from '@/types';

type PageProps = Record<string, unknown>;

interface AutoBreadcrumbPage {
    component: string;
    props: PageProps;
    url: string;
}

interface BreadcrumbSectionConfig {
    title: string;
    href: string;
    resolveTitle: (view: string, props: PageProps) => string;
}

const sectionConfigs: Record<string, BreadcrumbSectionConfig> = {
    dashboard: {
        title: 'Dashboard',
        href: '/dashboard',
        resolveTitle: () => 'Dashboard',
    },
    settings: {
        title: 'Settings',
        href: '/settings/profile',
        resolveTitle: (view) =>
            (
                {
                    profile: 'Profile settings',
                    password: 'Password settings',
                    appearance: 'Appearance settings',
                    'two-factor': 'Two-Factor Authentication',
                } as const
            )[view] ?? humanize(view),
    },
    Users: createResourceConfig({
        title: 'Users',
        href: route('users.index'),
        titles: {
            index: 'Users',
            create: 'Create User',
            trashed: 'Trashed Users',
            show: 'User Details',
            edit: 'Edit User',
        },
    }),
    Classrooms: createResourceConfig({
        title: 'Classrooms',
        href: route('classrooms.index'),
        titles: {
            index: 'Classrooms',
            create: 'Create Classroom',
            trashed: 'Trashed Classrooms',
            show: 'Classroom Details',
            edit: 'Edit Classroom',
        },
    }),
    Subjects: createResourceConfig({
        title: 'Subjects',
        href: route('subjects.index'),
        titles: {
            index: 'Subjects',
            create: 'Create Subject',
            trashed: 'Trashed Subjects',
            show: 'Subject Details',
            edit: 'Edit Subject',
        },
    }),
    Attendances: createResourceConfig({
        title: 'Attendances',
        href: route('attendances.index'),
        titles: {
            index: 'Attendances',
            create: 'Create Attendance',
            trashed: 'Trashed Attendances',
            show: 'Attendance Details',
            edit: 'Edit Attendance',
        },
    }),
    ExamResults: createResourceConfig({
        title: 'Exam Results',
        href: route('exam-results.index'),
        titles: {
            index: 'Exam Results',
            create: 'Record Exam Result',
            trashed: 'Trashed Exam Results',
            show: 'Exam Result Details',
            edit: 'Edit Exam Result',
        },
    }),
    Homeworks: createResourceConfig({
        title: 'Homeworks',
        href: route('homeworks.index'),
        titles: {
            index: 'Homeworks',
            create: 'Create Homework',
            trashed: 'Trashed Homeworks',
            show: 'Homework Details',
            edit: 'Edit Homework',
        },
    }),
    HomeworkSubmissions: createResourceConfig({
        title: 'Homework Submissions',
        href: route('homework-submissions.index'),
        titles: {
            index: 'Homework Submissions',
            create: 'Submit Homework',
            trashed: 'Trashed Homework Submissions',
            show: 'Submission Details',
            edit: 'Edit Submission',
        },
    }),
    LeaveRequests: createResourceConfig({
        title: 'Leave Requests',
        href: route('leave-requests.index'),
        titles: {
            index: 'Leave Requests',
            create: 'Create Leave Request',
            trashed: 'Trashed Leave Requests',
            show: 'Leave Request Details',
            edit: 'Edit Leave Request',
        },
    }),
    Messages: createResourceConfig({
        title: 'Messages',
        href: route('messages.index'),
        titles: {
            index: 'Messages',
            create: 'Create Message',
            trashed: 'Trashed Messages',
            show: 'Message Details',
            edit: 'Edit Message',
        },
    }),
    Timetables: createResourceConfig({
        title: 'Timetables',
        href: route('timetables.index'),
        titles: {
            index: 'Timetables',
            create: 'Create Timetable',
            trashed: 'Trashed Timetables',
            show: 'Timetable Details',
            edit: 'Edit Timetable',
        },
    }),
};

type ViewTitleResolver = string | ((props: PageProps) => string);

function createResourceConfig({
    title,
    href,
    titles,
}: {
    title: string;
    href: string;
    titles: {
        index: ViewTitleResolver;
        create?: ViewTitleResolver;
        edit?: ViewTitleResolver;
        show?: ViewTitleResolver;
        trashed?: ViewTitleResolver;
    };
}): BreadcrumbSectionConfig {
    return {
        title,
        href,
        resolveTitle: (view, props) => {
            const normalizedView = view.toLowerCase();
            const resolver = titles[normalizedView as keyof typeof titles] ?? titles.index;
            return typeof resolver === 'function' ? resolver(props) : resolver;
        },
    };
}

export function resolveAutoBreadcrumbs(
    page: AutoBreadcrumbPage,
    pageTitle?: string,
): BreadcrumbItem[] {
    const [sectionKey] = page.component.split('/');
    const section = sectionConfigs[sectionKey];
    const resolvedTitle = pageTitle?.trim() || resolveFallbackTitle(page);

    if (!section) {
        return resolvedTitle
            ? [{ title: resolvedTitle, href: normalizeUrl(page.url) }]
            : [];
    }

    if (!resolvedTitle || resolvedTitle === section.title) {
        return [{ title: section.title, href: section.href }];
    }

    return [
        { title: section.title, href: section.href },
        { title: resolvedTitle, href: normalizeUrl(page.url) },
    ];
}

function resolveFallbackTitle(page: AutoBreadcrumbPage): string {
    const [sectionKey, viewKey = 'Index'] = page.component.split('/');
    const section = sectionConfigs[sectionKey];

    if (section) {
        return section.resolveTitle(viewKey, page.props);
    }

    return humanize(viewKey === 'Index' ? sectionKey : viewKey);
}

function normalizeUrl(url: string): string {
    return url.split('?')[0] || '/';
}

function humanize(value: string): string {
    return value
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}
