import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn, resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

const normalizePath = (url: string): string => {
    try {
        const parsedUrl = new URL(url, window.location.origin);
        const pathname = parsedUrl.pathname || '/';
        return pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
    } catch {
        const pathname = url.split('?')[0]?.split('#')[0] || '/';
        const prefixed = pathname.startsWith('/') ? pathname : `/${pathname}`;
        return prefixed !== '/' ? prefixed.replace(/\/+$/, '') : '/';
    }
};

const isPathWithin = (currentPath: string, basePath: string): boolean => {
    if (basePath === '/') {
        return currentPath === '/';
    }

    return currentPath === basePath || currentPath.startsWith(`${basePath}/`);
};

const getItemActivity = (item: NavItem, currentPath: string, depth = 0): { self: boolean; hasActiveChild: boolean } => {
    const itemPath = normalizePath(resolveUrl(item.href));
    const selfActive = depth === 0
        ? isPathWithin(currentPath, itemPath)
        : currentPath === itemPath;

    if (!item.children || item.children.length === 0) {
        return {
            self: selfActive,
            hasActiveChild: false,
        };
    }

    const hasActiveChild = item.children.some((child) => {
        const childActivity = getItemActivity(child, currentPath, depth + 1);
        return childActivity.self || childActivity.hasActiveChild;
    });

    return {
        self: hasActiveChild ? false : selfActive,
        hasActiveChild,
    };
};

const iconTonePalette = [
    {
        inactive: 'text-sky-500/85 dark:text-sky-400/85',
        active: 'text-sky-700 dark:text-sky-300',
        childInactive: '!text-sky-500/70 dark:!text-sky-400/75',
        childActive: '!text-sky-700 dark:!text-sky-300',
    },
    {
        inactive: 'text-emerald-500/85 dark:text-emerald-400/85',
        active: 'text-emerald-700 dark:text-emerald-300',
        childInactive: '!text-emerald-500/70 dark:!text-emerald-400/75',
        childActive: '!text-emerald-700 dark:!text-emerald-300',
    },
    {
        inactive: 'text-amber-500/85 dark:text-amber-400/85',
        active: 'text-amber-700 dark:text-amber-300',
        childInactive: '!text-amber-500/70 dark:!text-amber-400/75',
        childActive: '!text-amber-700 dark:!text-amber-300',
    },
    {
        inactive: 'text-violet-500/85 dark:text-violet-400/85',
        active: 'text-violet-700 dark:text-violet-300',
        childInactive: '!text-violet-500/70 dark:!text-violet-400/75',
        childActive: '!text-violet-700 dark:!text-violet-300',
    },
    {
        inactive: 'text-rose-500/85 dark:text-rose-400/85',
        active: 'text-rose-700 dark:text-rose-300',
        childInactive: '!text-rose-500/70 dark:!text-rose-400/75',
        childActive: '!text-rose-700 dark:!text-rose-300',
    },
    {
        inactive: 'text-cyan-500/85 dark:text-cyan-400/85',
        active: 'text-cyan-700 dark:text-cyan-300',
        childInactive: '!text-cyan-500/70 dark:!text-cyan-400/75',
        childActive: '!text-cyan-700 dark:!text-cyan-300',
    },
];

const hashString = (value: string): number => {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
};

const getIconToneClass = (seed: string, isActive: boolean, isChild = false): string => {
    const palette = iconTonePalette[hashString(seed) % iconTonePalette.length];

    if (isChild) {
        return isActive ? palette.childActive : palette.childInactive;
    }

    return isActive ? palette.active : palette.inactive;
};

export function NavMain({
    items = [],
    label = 'Platform',
}: {
    items: NavItem[];
    label?: string;
}) {
    const page = usePage();
    const currentPath = normalizePath(page.url);
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const itemActivity = getItemActivity(item, currentPath);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={itemActivity.self}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && (
                                        <item.icon
                                            className={cn(
                                                'size-4 transition-colors duration-200',
                                                getIconToneClass(item.title, itemActivity.self),
                                            )}
                                        />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            {item.children && item.children.length > 0 && (
                                <SidebarMenuSub>
                                    {item.children.map((child) => {
                                        const childActivity = getItemActivity(child, currentPath, 1);

                                        return (
                                            <SidebarMenuSubItem key={`${item.title}-${child.title}`}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={childActivity.self}
                                                >
                                                    <Link href={child.href} prefetch>
                                                        {child.icon && (
                                                            <child.icon
                                                                className={cn(
                                                                    'size-4 transition-colors duration-200',
                                                                    getIconToneClass(`${item.title}:${child.title}`, childActivity.self, true),
                                                                )}
                                                            />
                                                        )}
                                                        <span>{child.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        );
                                    })}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
