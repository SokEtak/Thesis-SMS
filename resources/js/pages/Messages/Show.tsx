import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ message }: any) {
  return (
    <AppLayout>
      <Head title={message.subject} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{message.subject}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('messages.index'))}>Back</Button>
            <Button onClick={() => router.get(route('messages.edit', message.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('messages.destroy', message.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">From</dt><dd>{message.sender_id}</dd></div>
          <div><dt className="font-semibold">To</dt><dd>{message.receiver_id}</dd></div>
          <div><dt className="font-semibold">Date</dt><dd>{message.created_at}</dd></div>
          <div className="border-t pt-4"><dt className="font-semibold mb-2">Message</dt><dd className="whitespace-pre-wrap">{message.body}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
