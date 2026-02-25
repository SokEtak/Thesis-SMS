import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { Classroom } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  classroom?: Classroom;
  onSubmit: (data: Partial<Classroom>) => void;
}

export default function ClassroomForm({ classroom, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: classroom?.name || '',
    level: classroom?.level || '',
    section: classroom?.section || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <TextInput
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <TextInput
        label="Level"
        name="level"
        value={formData.level}
        onChange={handleChange}
      />

      <TextInput
        label="Section"
        name="section"
        value={formData.section}
        onChange={handleChange}
      />

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
      </div>
    </form>
  );
}
