import LiveSearchInput, { type SearchSuggestion } from '@/components/LiveSearchInput';
import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import { type SortBy, type TablePaginationState } from './classroom-index-types';

interface ClassroomFilterActionPanelProps {
  searchValue: string;
  teacherFilterValue: string;
  teacherFilterOptions: SearchableSelectOption[];
  liveMatchCount: number;
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  pagination: TablePaginationState;
  activePerPage: number;
  activeTeacherCount: number;
  hasActiveFilter: boolean;
  onSearchChange: (value: string) => void;
  onTeacherFilterChange: (value: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onSearchSubmit: () => void;
  onReset: () => void;
  onSortByChange: (value: SortBy) => void;
  onSortDirChange: (value: 'asc' | 'desc') => void;
}

export default function ClassroomFilterActionPanel({
  searchValue,
  teacherFilterValue,
  teacherFilterOptions,
  liveMatchCount,
  suggestions,
  isLoadingSuggestions,
  sortBy,
  sortDir,
  pagination,
  activePerPage,
  activeTeacherCount,
  hasActiveFilter,
  onSearchChange,
  onTeacherFilterChange,
  onSelectSuggestion,
  onSearchSubmit,
  onReset,
  onSortByChange,
  onSortDirChange,
}: ClassroomFilterActionPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div className="space-y-3 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-background to-cyan-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-sky-700 dark:text-muted-foreground">
            Search & Discover
          </p>
          {(searchValue.trim().length > 0 || teacherFilterValue.trim().length > 0) && (
            <Badge variant="secondary">
              Live ({liveMatchCount})
            </Badge>
          )}
        </div>
        <LiveSearchInput
          value={searchValue}
          placeholder="Search class or teacher..."
          suggestions={suggestions}
          loading={isLoadingSuggestions}
          className="w-full"
          onChange={onSearchChange}
          onSelectSuggestion={onSelectSuggestion}
          onSubmit={onSearchSubmit}
        />
        <SearchableSelect
          value={teacherFilterValue}
          options={teacherFilterOptions}
          placeholder="Filter by teacher"
          searchPlaceholder="Search teacher..."
          clearLabel="All teachers"
          onChange={onTeacherFilterChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="size-9 border-sky-200/70 bg-white/80 p-0 hover:bg-sky-100/70 dark:border-border dark:bg-background dark:hover:bg-accent"
                aria-label="Search"
                onClick={onSearchSubmit}
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">Search</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="size-9 border-sky-200/70 bg-white/80 p-0 hover:bg-sky-100/70 dark:border-border dark:bg-background dark:hover:bg-accent"
                aria-label="Reset"
                onClick={onReset}
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">Reset</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-background dark:via-background dark:to-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpDown className="size-4" />
          Sort & Status
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Select
            value={sortBy}
            onValueChange={(nextValue) => onSortByChange(nextValue as SortBy)}
          >
            <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created At</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortDir}
            onValueChange={(nextValue) => onSortDirChange(nextValue === 'desc' ? 'desc' : 'asc')}
          >
            <SelectTrigger className="h-9 rounded-lg border border-input/80 bg-background/90 px-3 text-sm shadow-sm">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Total {pagination.total}</Badge>
          <Badge variant="outline">Page {pagination.current_page}/{pagination.last_page}</Badge>
          <Badge variant="outline">{activePerPage} per page</Badge>
          <Badge variant="outline">Teachers {activeTeacherCount}</Badge>
          <Badge variant="outline">{hasActiveFilter ? 'Filtered' : 'Default'}</Badge>
        </div>
      </div>
    </div>
  );
}
