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
import { useTranslate } from '@/lib/i18n';
import { route } from '@/lib/route';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookMarked, BookOpen, ClipboardCheck, Folder, LayoutGrid, School, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const t = useTranslate();
    const sidebarNavGroups: Array<{ label: string; items: NavItem[] }> = [
        {
            label: t('Core'),
            items: [
                {
                    title: t('Dashboard'),
                    href: dashboard(),
                    icon: LayoutGrid,
                },
            ],
        },
        {
            label: t('Management'),
            items: [
                {
                    title: t('Users'),
                    href: route('users.index'),
                    icon: Users,
                },
            ],
        },
        {
            label: t('Academic'),
            items: [
                {
                    title: t('Classrooms'),
                    href: route('classrooms.index'),
                    icon: School,
                },
                {
                    title: t('Subjects'),
                    href: route('subjects.index'),
                    icon: BookMarked,
                },
                {
                    title: t('Attendances'),
                    href: route('attendances.index'),
                    icon: ClipboardCheck,
                },
                {
                    title: t('Exam Results'),
                    href: route('exam-results.index'),
                    icon: BookOpen,
                },
                {
                    title: t('Homeworks'),
                    href: route('homeworks.index'),
                    icon: Folder,
                },
                {
                    title: t('Timetables'),
                    href: route('timetables.index'),
                    icon: School,
                },
            ],
        },
    ];

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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
