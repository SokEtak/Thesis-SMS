import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ClassroomForm from './_ClassroomForm';
import { route } from '@/lib/route';
import { Classroom, TeacherOption } from '@/types/models';

interface Props {
  teachers: TeacherOption[];
}

export default function Create({ teachers }: Props) {
  const handleSubmit = (data: Partial<Classroom>) => {
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

        <ClassroomForm teachers={teachers} onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
