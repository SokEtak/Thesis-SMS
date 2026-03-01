import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { route } from '@/lib/route';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookMarked, BookOpen, ClipboardCheck, Folder, LayoutGrid, School, Trash2, Users } from 'lucide-react';
import AppLogo from './app-logo';

const sidebarNavGroups: Array<{ label: string; items: NavItem[] }> = [
    {
        label: 'Core',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        label: 'Management',
        items: [
            {
                title: 'Users',
                href: route('users.index'),
                icon: Users,
                children: [
                    {
                        title: 'Trashed Users',
                        href: route('users.trashed'),
                        icon: Trash2,
                    },
                ],
            },
        ],
    },
    {
        label: 'Academic',
        items: [
            {
                title: 'Classrooms',
                href: route('classrooms.index'),
                icon: School,
                children: [
                    {
                        title: 'Trashed Classes',
                        href: route('classrooms.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Subjects',
                href: route('subjects.index'),
                icon: BookMarked,
                children: [
                    {
                        title: 'Trashed Subjects',
                        href: route('subjects.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Attendances',
                href: route('attendances.index'),
                icon: ClipboardCheck,
                children: [
                    {
                        title: 'Trashed Attendances',
                        href: route('attendances.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Exam Results',
                href: route('exam-results.index'),
                icon: BookOpen,
                children: [
                    {
                        title: 'Trashed Exam Results',
                        href: route('exam-results.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Homeworks',
                href: route('homeworks.index'),
                icon: Folder,
                children: [
                    {
                        title: 'Trashed Homeworks',
                        href: route('homeworks.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Homework Submissions',
                href: route('homework-submissions.index'),
                icon: ClipboardCheck,
                children: [
                    {
                        title: 'Trashed Submissions',
                        href: route('homework-submissions.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Leave Requests',
                href: route('leave-requests.index'),
                icon: BookMarked,
                children: [
                    {
                        title: 'Trashed Leave Requests',
                        href: route('leave-requests.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Messages',
                href: route('messages.index'),
                icon: Users,
                children: [
                    {
                        title: 'Trashed Messages',
                        href: route('messages.trashed'),
                        icon: Trash2,
                    },
                ],
            },
            {
                title: 'Timetables',
                href: route('timetables.index'),
                icon: School,
                children: [
                    {
                        title: 'Trashed Timetables',
                        href: route('timetables.trashed'),
                        icon: Trash2,
                    },
                ],
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border/70">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1">
                {sidebarNavGroups.map((group) => (
                    <NavMain key={group.label} label={group.label} items={group.items} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
