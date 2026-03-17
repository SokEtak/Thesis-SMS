import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { translateMessage } from '@/lib/i18n';
import { resolveAutoBreadcrumbs } from '@/lib/auto-breadcrumbs';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({
    children,
    breadcrumbs,
    ...props
}: AppLayoutProps) {
    const page = usePage<SharedData & Record<string, unknown>>();
    const fallbackTitle = useMemo(
        () =>
            resolveAutoBreadcrumbs(
                {
                    component: page.component,
                    props: page.props,
                    url: page.url,
                },
            ).at(-1)?.title ?? '',
        [page.component, page.props, page.url],
    );
    const translatedFallbackTitle = useMemo(
        () => translateMessage(fallbackTitle, page.props.i18n?.messages ?? {}),
        [fallbackTitle, page.props.i18n?.messages],
    );
    const [pageTitle, setPageTitle] = useState(fallbackTitle);

    useEffect(() => {
        setPageTitle(fallbackTitle);
    }, [fallbackTitle]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }

        const syncTitle = () => {
            const rawTitle = document.title.trim();
            const appName = import.meta.env.VITE_APP_NAME || 'Thesis SMS';
            const suffix = ` - ${appName}`;
            const nextTitle = rawTitle.endsWith(suffix)
                ? rawTitle.slice(0, -suffix.length).trim()
                : rawTitle;

            setPageTitle(
                !nextTitle || nextTitle === appName
                    ? fallbackTitle
                    : nextTitle,
            );
        };

        syncTitle();

        const titleElement = document.head.querySelector('title');
        if (!titleElement) {
            return undefined;
        }

        const observer = new MutationObserver(syncTitle);
        observer.observe(titleElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, [fallbackTitle, page.url]);

    const resolvedBreadcrumbs = useMemo(
        () =>
            breadcrumbs && breadcrumbs.length > 0
                ? breadcrumbs
                : resolveAutoBreadcrumbs(
                      {
                          component: page.component,
                          props: page.props,
                          url: page.url,
                      },
                      pageTitle === translatedFallbackTitle
                          ? fallbackTitle
                          : pageTitle,
                  ),
        [
            breadcrumbs,
            fallbackTitle,
            page.component,
            page.props,
            page.url,
            pageTitle,
            translatedFallbackTitle,
        ],
    );

    return (
        <AppLayoutTemplate breadcrumbs={resolvedBreadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
}
