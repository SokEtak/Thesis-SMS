import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { MessageSquarePlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

interface UserOption {
  id: number;
  name: string;
  email?: string | null;
  avatar?: string | null;
}

interface Props {
  users: UserOption[];
}

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function Create({ users }: Props) {
  const { auth } = usePage<SharedData>().props;
  const authUser = auth.user;
  const getInitials = useInitials();
  const [receiverId, setReceiverId] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const receiverOptions = useMemo<SearchableSelectOption[]>(
    () => users
      .filter((item) => item.id !== authUser?.id)
      .map((item) => ({
        value: String(item.id),
        label: item.name,
        description: item.email ?? undefined,
      })),
    [authUser?.id, users],
  );

  const selectedRecipient = useMemo(
    () => users.find((item) => item.id === parseNullableId(receiverId)) ?? null,
    [receiverId, users],
  );

  const canSubmit = Boolean(authUser && parseNullableId(receiverId) && messageBody.trim().length > 0);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      receiver_id: parseNullableId(receiverId),
      message_body: messageBody.trim(),
    };

    if (!payload.receiver_id || payload.message_body.length === 0) {
      alert('Choose a recipient and write a message.');
      return;
    }

    router.post(route('messages.store'), payload, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title="New Message" />
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] tracking-[0.16em] uppercase">Direct Message</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">New Message</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Compose like a real chat. Sender and initial unread state are now derived automatically on the server.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => router.get(route('messages.index'))}>Back to Messages</Button>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-6 text-white shadow-lg">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">From</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="size-12 border border-white/20">
                  {authUser?.avatar ? <AvatarImage src={authUser.avatar} alt={authUser.name} /> : null}
                  <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">
                    {getInitials(authUser?.name ?? 'Me')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{authUser?.name ?? 'Current user'}</p>
                  <p className="text-xs text-slate-300">{authUser?.email ?? 'Signed-in account'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">State</p>
                <Badge className="border-emerald-300/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/15">
                  Unread on arrival
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                Recipients receive new messages as unread. There is no sender or state selector anymore.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm leading-6 text-slate-300">
              {selectedRecipient ? `You are sending this message to ${selectedRecipient.name}.` : 'Choose a recipient to begin the conversation.'}
            </div>
          </aside>

          <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label>To</Label>
              <SearchableSelect
                value={receiverId}
                options={receiverOptions}
                onChange={setReceiverId}
                placeholder="Choose recipient"
                searchPlaceholder="Search recipient..."
                clearable={false}
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Message</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecipient ? `Write to ${selectedRecipient.name}.` : 'Write your message.'}
                  </p>
                </div>
                <Badge variant="outline">{messageBody.trim().length} chars</Badge>
              </div>
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                className="mt-4 min-h-[260px] w-full resize-none border-0 bg-transparent text-sm leading-6 outline-none"
                placeholder={selectedRecipient ? `Write a message to ${selectedRecipient.name}` : 'Write your message'}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="max-w-md text-xs leading-5 text-muted-foreground">
                Messages are sent as {authUser?.name ?? 'your account'} and arrive unread for the recipient.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.get(route('messages.index'))}>Cancel</Button>
                <Button type="submit" disabled={!canSubmit}>
                  <MessageSquarePlus className="size-4" />
                  Send Message
                </Button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </AppLayout>
  );
}
