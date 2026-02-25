import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

export default function Index({ examResults, query }: any) {
  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'student_id', label: 'Student', width: '150px' },
    { key: 'exam_id', label: 'Exam', width: '120px' },
    { key: 'score', label: 'Score', width: '120px' },
  ];

  return (
    <AppLayout>
      <Head title="Exam Results" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exam Results</h1>
          <div className="flex gap-2">
            <Link href={route('exam-results.trashed')}>
              <Button variant="outline">Trashed</Button>
            </Link>
            <Link href={route('exam-results.create')}>
              <Button>Create</Button>
            </Link>
          </div>
        </div>
        <DataTable columns={columns} data={examResults.data} pagination={examResults.meta} onPageChange={(page) => router.get(route('exam-results.index', { page, ...query }))} />
      </div>
    </AppLayout>
  );
}
