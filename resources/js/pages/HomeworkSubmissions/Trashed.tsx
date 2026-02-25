import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ homeworkSubmissions, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'homework_id', label: 'Homework', width: '150px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Submissions" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Submissions</h1>
          <Link href={route('homework-submissions.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={homeworkSubmissions.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('homework-submissions.restore', item.id)), variant: 'success' }]} pagination={homeworkSubmissions.meta} onPageChange={(page: number) => router.get(route('homework-submissions.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
