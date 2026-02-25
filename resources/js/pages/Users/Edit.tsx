import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import UserForm from './_UserForm';
import { User } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  user: User;
}

export default function Edit({ user }: Props) {
  const handleSubmit = (data: Partial<User>) => {
    router.put(route('users.update', user.id), data);
  };

  return (
    <AppLayout>
      <Head title={`Edit User: ${user.name}`} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-gray-600 mt-2">Update user information</p>
        </div>

        <UserForm user={user} onSubmit={handleSubmit} />
      </div>
    </AppLayout>
  );
}
