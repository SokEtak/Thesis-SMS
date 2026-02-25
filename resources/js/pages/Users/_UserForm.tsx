import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { User } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  user?: User;
  onSubmit: (data: Partial<User>) => void;
}

export default function UserForm({ user, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <TextInput
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name?.[0]}
        required
      />

      <TextInput
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email?.[0]}
        required
      />

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
      </div>
    </form>
  );
}
