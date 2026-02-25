import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Trashed({ examResults, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'score', label: 'Score', width: '120px' },
    { key: 'deleted_at', label: 'Deleted At', width: '180px' },
  ];

  return (
    <AppLayout>
      <Head title="Trashed Exam Results" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trashed Exam Results</h1>
          <Link href={route('exam-results.index')}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <DataTable columns={columns} data={examResults.data} actions={[{ label: 'Restore', onClick: (item: any) => router.post(route('exam-results.restore', item.id)), variant: 'success' }]} pagination={examResults.meta} onPageChange={(page: number) => router.get(route('exam-results.trashed', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
