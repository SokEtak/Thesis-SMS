import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ClassroomForm from './_ClassroomForm';
import { Classroom } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  classroom: Classroom;
}

export default function Edit({ classroom }: Props) {
  const handleSubmit = (data: any) => {
    router.put(route('classrooms.update', classroom.id), data);
  };

  return (
    <AppLayout>
      <Head title={`Edit Classroom: ${classroom.name}`} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Classroom</h1>
          <p className="text-gray-600 mt-2">Update classroom information</p>
        </div>

        <ClassroomForm classroom={classroom} onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
