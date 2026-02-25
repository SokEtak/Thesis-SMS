import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Show({ homework }: any) {
  return (
    <AppLayout>
      <Head title={homework.title} />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{homework.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('homeworks.index'))}>Back</Button>
            <Button onClick={() => router.get(route('homeworks.edit', homework.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('homeworks.destroy', homework.id))}>Delete</Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Description</dt><dd>{homework.description}</dd></div>
          <div><dt className="font-semibold">Due Date</dt><dd>{homework.due_date}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
