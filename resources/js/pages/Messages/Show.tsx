import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type Message } from '@/types/models';
import { Head, router } from '@inertiajs/react';

interface MessageWithRelations extends Message {
  sender?: { id: number; name: string; email?: string | null } | null;
  receiver?: { id: number; name: string; email?: string | null } | null;
}

interface Props {
  message: MessageWithRelations;
}

export default function Show({ message }: Props) {
  const senderName = message.sender_name ?? message.sender?.name ?? `#${message.sender_id}`;
  const receiverName = message.receiver_name ?? message.receiver?.name ?? `#${message.receiver_id}`;

  return (
    <AppLayout>
      <Head title={`Message #${message.id}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Message #{message.id}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('messages.index'))}>Back</Button>
            <Button variant="outline" onClick={() => router.get(route('messages.edit', message.id))}>Edit</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm(`Delete message #${message.id}?`)) {
                  return;
                }
                router.delete(route('messages.destroy', message.id));
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Sender</p>
              <p className="font-medium">{senderName}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Receiver</p>
              <p className="font-medium">{receiverName}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Read State</p>
              <Badge variant="outline">{message.is_read ? 'Read' : 'Unread'}</Badge>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="font-medium">{message.created_at ?? '-'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Message Body</p>
            <p className="whitespace-pre-wrap text-sm">{message.message_body ?? '-'}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
