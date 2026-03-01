import type { SearchSuggestion } from '@/components/LiveSearchInput';
import type { Subject } from '@/types/models';

export interface SubjectFormState {
  code: string;
  name: string;
}

export interface BatchCreateSubjectItemState {
  key: number;
  code: string;
  name: string;
}

export interface BatchEditSubjectItemState {
  id: number;
  code: string;
  name: string;
}

export interface SearchAlertState {
  term: string;
  count: number;
  matches: SearchSuggestion[];
}

export interface TablePaginationState {
  per_page: number;
  current_page: number;
  last_page: number;
  total: number;
}

export const SORTABLE_FIELDS = ['id', 'code', 'name', 'created_at'] as const;
export type SortBy = (typeof SORTABLE_FIELDS)[number];

export const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

export const toPositiveNumber = (value: unknown, fallback: number): number => {
  const number = Number(value);
  if (Number.isFinite(number) && number > 0) {
    return number;
  }

  return fallback;
};

export const normalizeSortBy = (value: unknown): SortBy => {
  if (typeof value === 'string' && SORTABLE_FIELDS.includes(value as SortBy)) {
    return value as SortBy;
  }

  return 'id';
};

export const normalizeFilterValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
};

export const subjectMatchesCase = (item: Subject, term: string): boolean => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    item.id,
    item.code,
    item.name,
    item.created_at,
    item.updated_at,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .some((value) => value.includes(normalized));
};
