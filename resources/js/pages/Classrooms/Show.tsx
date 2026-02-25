import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Classroom } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  classroom: Classroom;
}

export default function Show({ classroom }: Props) {
  return (
    <AppLayout>
      <Head title={`Classroom: ${classroom.name}`} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{classroom.name}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.get(route('classrooms.index'))}>Back</Button>
            <Button variant="secondary" onClick={() => router.get(route('classrooms.edit', classroom.id))}>Edit</Button>
            <Button variant="danger" onClick={() => {
              if (confirm('Are you sure?')) {
                router.delete(route('classrooms.destroy', classroom.id));
              }
            }}>Delete</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <dt className="font-semibold text-gray-700">Level</dt>
            <dd className="text-gray-600">{classroom.level}</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">Section</dt>
            <dd className="text-gray-600">{classroom.section}</dd>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
