import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';

import { type SearchAlertState } from './classroom-index-types';

interface ClassroomSearchResultActionDialogProps {
  open: boolean;
  searchAlert: SearchAlertState;
  onOpenChange: (open: boolean) => void;
  onSelectMatch: (label: string) => void;
}

export default function ClassroomSearchResultActionDialog({
  open,
  searchAlert,
  onOpenChange,
  onSelectMatch,
}: ClassroomSearchResultActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search Result</DialogTitle>
          <DialogDescription>
            Results for "{searchAlert.term}"
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="size-4" />
          <AlertTitle>Matched rows on current page: {searchAlert.count}</AlertTitle>
          <AlertDescription>
            {searchAlert.matches.length > 0
              ? 'Top matching suggestions are listed below.'
              : 'No suggestion matched. Try another keyword.'}
          </AlertDescription>
        </Alert>

        {searchAlert.matches.length > 0 && (
          <div className="space-y-2">
            {searchAlert.matches.map((item) => (
              <button
                key={String(item.id)}
                type="button"
                className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => onSelectMatch(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
