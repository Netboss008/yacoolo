import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateStreamForm {
  title: string;
  description: string;
  category: string;
  tags: string;
}

export default function CreateStream() {
  const router = useRouter();
  const [form, setForm] = useState<CreateStreamForm>({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(tag => tag.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Streams');
      }

      const stream = await response.json();
      router.push(`/stream/${stream.id}`);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Neuen Stream erstellen</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
            Titel
          </label>
          <input
            type="text"
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-primary-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
            Beschreibung
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-primary-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
            Kategorie
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-primary-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
          >
            <option value="">Kategorie auswählen</option>
            <option value="gaming">Gaming</option>
            <option value="music">Musik</option>
            <option value="art">Kunst</option>
            <option value="education">Bildung</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-white mb-2">
            Tags (mit Komma getrennt)
          </label>
          <input
            type="text"
            id="tags"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full bg-primary-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500"
            placeholder="z.B. gaming, entertainment, live"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Wird erstellt...' : 'Stream erstellen'}
        </button>
      </form>
    </div>
  );
} 