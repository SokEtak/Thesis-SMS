import SearchableSelect, { type SearchableSelectOption } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route';
import { type Message } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

interface UserOption {
  id: number;
  name: string;
  email?: string | null;
}

interface Props {
  message: Message;
  users: UserOption[];
}

const parseNullableId = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function Edit({ message, users }: Props) {
  const [senderId, setSenderId] = useState(message.sender_id ? String(message.sender_id) : '');
  const [receiverId, setReceiverId] = useState(message.receiver_id ? String(message.receiver_id) : '');
  const [messageBody, setMessageBody] = useState(message.message_body ?? '');
  const [isRead, setIsRead] = useState<'1' | '0'>(message.is_read ? '1' : '0');

  const userOptions = useMemo<SearchableSelectOption[]>(
    () => users.map((item) => ({
      value: String(item.id),
      label: item.name,
      description: item.email ?? undefined,
    })),
    [users],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      sender_id: parseNullableId(senderId),
      receiver_id: parseNullableId(receiverId),
      message_body: messageBody.trim() === '' ? null : messageBody.trim(),
      is_read: isRead === '1',
    };

    if (!payload.sender_id || !payload.receiver_id) {
      alert('Sender and receiver are required.');
      return;
    }

    router.put(route('messages.update', message.id), payload, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title={`Edit Message #${message.id}`} />
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Message</h1>
            <p className="text-sm text-muted-foreground">Update message fields with current schema bindings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('messages.index'))}>Back</Button>
            <Button onClick={() => router.get(route('messages.create'))}>Create</Button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sender</Label>
              <SearchableSelect
                value={senderId}
                options={userOptions}
                onChange={setSenderId}
                placeholder="Select sender"
                searchPlaceholder="Search sender..."
                clearable={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Receiver</Label>
              <SearchableSelect
                value={receiverId}
                options={userOptions}
                onChange={setReceiverId}
                placeholder="Select receiver"
                searchPlaceholder="Search receiver..."
                clearable={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              className="min-h-[140px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder="Write message body"
            />
          </div>

          <div className="space-y-2">
            <Label>Read State</Label>
            <SearchableSelect
              value={isRead}
              options={[
                { value: '0', label: 'Unread' },
                { value: '1', label: 'Read' },
              ]}
              onChange={(value) => setIsRead(value === '1' ? '1' : '0')}
              placeholder="Select state"
              searchPlaceholder="Search state..."
              clearable={false}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.get(route('messages.index'))}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
