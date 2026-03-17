import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Subject } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  subject: Subject;
}

export default function Show({ subject }: Props) {
  return (
    <AppLayout>
      <Head title={`Subject: ${subject.name}`} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{subject.name}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('subjects.index'))}>Back</Button>
            <Button onClick={() => router.get(route('subjects.create'))}>Create</Button>
            <Button onClick={() => router.get(route('subjects.edit', subject.id))}>Edit</Button>
            <Button variant="danger" onClick={() => confirm('Delete?') && router.delete(route('subjects.destroy', subject.id))}>Delete</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div><dt className="font-semibold">Code</dt><dd>{subject.code}</dd></div>
          <div><dt className="font-semibold">Description</dt><dd>{subject.description || 'N/A'}</dd></div>
        </div>
      </div>
    </AppLayout>
  );
}
