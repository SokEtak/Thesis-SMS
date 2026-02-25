import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SubjectForm from './_SubjectForm';
import { route } from '@/lib/route';

export default function Create() {
  return (
    <AppLayout>
      <Head title="Create Subject" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Subject</h1>
          <p className="text-gray-600 mt-2">Add a new subject to the curriculum</p>
        </div>

        <SubjectForm onSubmit={(data) => router.post(route('subjects.store'), data)} />
      </div>
    </AppLayout>
  );
}
