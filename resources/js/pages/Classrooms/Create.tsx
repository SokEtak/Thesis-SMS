import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ClassroomForm from './_ClassroomForm';
import { route } from '@/lib/route';

export default function Create() {
  const handleSubmit = (data: any) => {
    router.post(route('classrooms.store'), data);
  };

  return (
    <AppLayout>
      <Head title="Create Classroom" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Classroom</h1>
          <p className="text-gray-600 mt-2">Add a new classroom to the system</p>
        </div>

        <ClassroomForm onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
