import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Edit Subject</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.get(route('subjects.index'))}>Back</Button>
            <Button onClick={() => router.get(route('subjects.create'))}>Create</Button>
          </div>
        </div>

        <SubjectForm subject={subject} onSubmit={(data) => router.put(route('subjects.update', subject.id), data)} />
      </div>
    </AppLayout>
  );
}
