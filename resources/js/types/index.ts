import type { User } from './models';

export type { User, Classroom, Subject, Attendance, ExamResult, Homework, HomeworkSubmission, LeaveRequest, Message, Timetable } from './models';
export type { TeacherOption } from './models';

export interface FlashMessages {
  success?: string | null;
  error?: string | null;
  warning?: string | null;
  info?: string | null;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
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
  auth: {
    user: User | null;
  };
  flash?: FlashMessages;
}
