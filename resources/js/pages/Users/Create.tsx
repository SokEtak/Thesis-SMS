import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import UserForm from './_UserForm';
import { User } from '@/types/models';
import { route } from '@/lib/route';

export default function Create() {
  const handleSubmit = (data: Partial<User>) => {
    router.post(route('users.store'), data);
  };

  return (
    <AppLayout>
      <Head title="Create User" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create User</h1>
          <p className="text-gray-600 mt-2">Add a new user to the system</p>
        </div>

        <UserForm onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
