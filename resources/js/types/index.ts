import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { User } from './models';

export type { User, Classroom, Subject, Attendance, ExamResult, Homework, HomeworkSubmission, LeaveRequest, Message, Timetable } from './models';
export type { TeacherOption } from './models';

export interface Auth {
  user: User | null;
}

export interface FlashMessages {
  success?: string | null;
  error?: string | null;
  warning?: string | null;
  info?: string | null;
}

export interface LocaleOption {
  code: string;
  name: string;
  native: string;
}

export interface I18nData {
  locale: string;
  fallbackLocale: string;
  availableLocales: LocaleOption[];
  messages: Record<string, string>;
}

export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: NonNullable<InertiaLinkProps['href']>;
  icon?: LucideIcon | null;
  isActive?: boolean;
  children?: NavItem[];
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface SharedData {
  name: string;
  quote: { message: string; author: string };
  auth: Auth;
  i18n: I18nData;
  flash?: FlashMessages;
  sidebarOpen: boolean;
  [key: string]: unknown;
}
