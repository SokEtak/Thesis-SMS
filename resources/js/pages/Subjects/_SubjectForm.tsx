import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/Form/TextInput';
import { Subject } from '@/types/models';
import { route } from '@/lib/route';

interface Props {
  subject?: Subject;
  onSubmit: (data: Partial<Subject>) => void;
}

export default function SubjectForm({ subject, onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: subject?.name || '',
    code: subject?.code || '',
    description: subject?.description || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="bg-white rounded-lg shadow p-6 space-y-6">
      <TextInput label="Name" name="name" value={formData.name} onChange={handleChange} required />
      <TextInput label="Code" name="code" value={formData.code} onChange={handleChange} />
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 w-full border rounded p-2" rows={4} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
      </div>
    </form>
  );
}
