import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import ClassroomForm from './_ClassroomForm';
import { Classroom, TeacherOption } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  classroom: Classroom;
  teachers: TeacherOption[];
}

export default function Edit({ classroom, teachers }: Props) {
  const handleSubmit = (data: Partial<Classroom>) => {
    router.put(route('classrooms.update', classroom.id), data);
  };

  return (
    <AppLayout>
      <Head title={`Edit Classroom: ${classroom.name}`} />
      
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Edit Classroom</h1>
            <p className="text-gray-600 mt-2">Update classroom information</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('classrooms.index'))}>Back</Button>
            <Button onClick={() => router.get(route('classrooms.create'))}>Create</Button>
          </div>
        </div>

        <ClassroomForm classroom={classroom} teachers={teachers} onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
