import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/lib/i18n';
import { Info } from 'lucide-react';

import { type SearchAlertState } from './subject-index-types';

interface SubjectSearchResultActionDialogProps {
  open: boolean;
  searchAlert: SearchAlertState;
  onOpenChange: (open: boolean) => void;
  onSelectMatch: (label: string) => void;
}

export default function SubjectSearchResultActionDialog({
  open,
  searchAlert,
  onOpenChange,
  onSelectMatch,
}: SubjectSearchResultActionDialogProps) {
  const t = useTranslate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Search Result')}</DialogTitle>
          <DialogDescription>
            {t('Results for ":term"', { term: searchAlert.term })}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="size-4" />
          <AlertTitle>{t('Matched rows on current page: :count', { count: searchAlert.count })}</AlertTitle>
          <AlertDescription>
            {searchAlert.matches.length > 0
              ? t('Top matching suggestions are listed below.')
              : t('No suggestion matched. Try another keyword.')}
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
