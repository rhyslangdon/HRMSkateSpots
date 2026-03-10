'use client';

import { useState } from 'react';
import type { SpotFormData, SpotType, Difficulty, StreetFeature } from '@/types';
import { createClient } from '@/lib/supabase/client';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const SPOT_TYPES: { value: SpotType; label: string }[] = [
  { value: 'street', label: 'Street' },
  { value: 'park', label: 'Park' },
  { value: 'diy', label: 'DIY' },
  { value: 'transition', label: 'Transition' },
  { value: 'flatground', label: 'Flatground' },
  { value: 'other', label: 'Other' },
];

const STREET_FEATURES: { value: StreetFeature; label: string }[] = [
  { value: 'ledge', label: 'Ledge' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'handrail', label: 'Handrail' },
  { value: 'gap', label: 'Gap' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

interface SpotFormProps {
  latitude: number;
  longitude: number;
  onSaved: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function SpotForm({
  latitude,
  longitude,
  onSaved,
  onCancel,
  initialData,
}: SpotFormProps) {
  const [formData, setFormData] = useState<SpotFormData>(
    initialData
      ? {
          name: initialData.name || '',
          description: initialData.description || '',
          address: initialData.address || '',
          spot_type: initialData.spot_type || 'street',
          street_feature: initialData.street_feature || null,
          difficulty: initialData.difficulty || 'beginner',
        }
      : {
          name: '',
          description: '',
          address: '',
          spot_type: 'street',
          street_feature: null,
          difficulty: 'beginner',
        }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;
    const supabase = createClient();
    const ext = imageFile.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('spot-images').upload(path, imageFile);
    if (error) throw new Error('Image upload failed.');
    const { data: urlData } = supabase.storage.from('spot-images').getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (!formData.name.trim()) {
      setError('Spot name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      let res;
      if (initialData && initialData.id) {
        // PATCH for edit
        res = await fetch('/api/spots', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: initialData.id,
            ...formData,
            latitude,
            longitude,
            image_url: imageUrl,
          }),
        });
      } else {
        // POST for new
        res = await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, latitude, longitude, image_url: imageUrl }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to save spot.');
        return;
      }

      onSaved();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="flex w-56 flex-col gap-1.5 p-1"
    >
      <div className="flex items-center gap-1">
        <span className="text-xs">📍</span>
        <p className="text-xs font-bold text-gray-800">
          {initialData ? 'Edit Skate Spot' : 'Add Skate Spot'}
        </p>
        <span className="ml-auto text-[9px] text-gray-400">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>

      <input
        type="text"
        placeholder="Spot name *"
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        maxLength={100}
        required
      />

      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        rows={1}
        maxLength={500}
      />

      <input
        type="text"
        placeholder="Address (optional)"
        value={formData.address}
        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        maxLength={200}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={formData.spot_type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              spot_type: e.target.value as SpotType,
              street_feature: e.target.value === 'street' ? prev.street_feature : null,
            }))
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        >
          {SPOT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={formData.difficulty}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {formData.spot_type === 'street' && (
        <select
          value={formData.street_feature ?? ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              street_feature: (e.target.value || null) as StreetFeature | null,
            }))
          }
          className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
        >
          <option value="">Feature...</option>
          {STREET_FEATURES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      )}

      <label className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-[10px] text-gray-400 hover:border-blue-400 hover:text-blue-500">
        <span>{imageFile ? `📷 ${imageFile.name}` : '📷 Upload image...'}</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (file && file.size > MAX_IMAGE_SIZE) {
              setError('Image must be under 5MB.');
              e.target.value = '';
              setImageFile(null);
              return;
            }
            setError(null);
            setImageFile(file);
          }}
          className="hidden"
        />
      </label>

      {error && <p className="rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-600">{error}</p>}

      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={submitting}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 rounded-md bg-blue-600 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex-1 rounded-md border border-gray-200 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
