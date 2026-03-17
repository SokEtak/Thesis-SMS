import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { User } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  user: User;
}

export default function Show({ user }: Props) {
  const handleEdit = () => {
    router.get(route('users.edit', user.id));
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this user?')) {
      router.delete(route('users.destroy', user.id));
    }
  };

  const handleBack = () => {
    router.get(route('users.index'));
  };

  return (
    <AppLayout>
      <Head title={`User: ${user.name}`} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-600 mt-2">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>Back</Button>
            <Button onClick={() => router.get(route('users.create'))}>Create</Button>
            <Button variant="secondary" onClick={handleEdit}>Edit</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold text-gray-700">ID</dt>
              <dd className="text-gray-600">{user.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Name</dt>
              <dd className="text-gray-600">{user.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Email</dt>
              <dd className="text-gray-600">{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Created At</dt>
              <dd className="text-gray-600">{new Date(user.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Updated At</dt>
              <dd className="text-gray-600">{new Date(user.updated_at).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </AppLayout>
  );
}
