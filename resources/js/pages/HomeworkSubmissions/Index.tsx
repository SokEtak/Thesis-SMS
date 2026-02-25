import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ homeworkSubmissions, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'homework_id', label: 'Homework', width: '150px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'submitted_at', label: 'Submitted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Homework Submissions" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Homework Submissions</h1>
          <div className="flex gap-2">
            <Link href={route('homework-submissions.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('homework-submissions.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={homeworkSubmissions.data} pagination={homeworkSubmissions.meta} onPageChange={(page) => router.get(route('homework-submissions.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
