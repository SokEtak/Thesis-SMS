import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SubjectForm from './_SubjectForm';
import { Subject } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  subject: Subject;
}

export default function Edit({ subject }: Props) {
  return (
    <AppLayout>
      <Head title={`Edit Subject: ${subject.name}`} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Subject</h1>
        </div>

        <SubjectForm subject={subject} onSubmit={(data) => router.put(route('subjects.update', subject.id), data)} />
      </div>
    </AppLayout>
  );
}
