'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { BustFactor, SpotFormData, SpotType, Difficulty, StreetFeature } from '@/types';
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

const BUST_FACTORS: { value: BustFactor; label: string }[] = [
  { value: 1, label: '1 - Low' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 - High' },
];

interface SpotFormProps {
  latitude: number;
  longitude: number;
  onSaved: () => void;
  onCancel: () => void;
  initialData?: any;
  mode?: 'popup' | 'overlay';
}

export default function SpotForm({
  latitude,
  longitude,
  onSaved,
  onCancel,
  initialData,
  mode = 'popup',
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
          bust_factor: initialData.bust_factor || 3,
        }
      : {
          name: '',
          description: '',
          address: '',
          spot_type: 'street',
          street_feature: null,
          difficulty: 'beginner',
          bust_factor: 3,
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

    if (formData.bust_factor < 1 || formData.bust_factor > 5) {
      setError('Bust factor must be between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const finalImageUrl = imageUrl ?? initialData?.image_url ?? null;
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
            image_url: finalImageUrl,
          }),
        });
      } else {
        // POST for new
        res = await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, latitude, longitude, image_url: finalImageUrl }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to save spot.');
        return;
      }

      toast.success(initialData ? 'Spot updated' : 'Spot added', {
        description: initialData
          ? 'Your changes were saved successfully.'
          : 'Your new spot was added successfully.',
      });

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
      className={`flex flex-col gap-2 rounded-md bg-[var(--background)] p-2 text-[var(--foreground)] sm:gap-2.5 sm:p-2.5 ${
        mode === 'overlay'
          ? 'w-full max-w-none shadow-none'
          : 'w-[min(18rem,calc(100vw-4.5rem))] shadow sm:w-[18rem]'
      }`}
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm">📍</span>
        <p className="text-sm font-bold sm:text-base" style={{ color: 'var(--foreground)' }}>
          {initialData ? 'Edit Skate Spot' : 'Add Skate Spot'}
        </p>
        <span
          className="ml-auto text-[10px] text-muted-foreground sm:text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>

      <input
        type="text"
        placeholder="Spot name *"
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        className="min-h-9 rounded-md border px-2.5 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
        style={{
          background: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
        }}
        maxLength={100}
        required
      />

      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        className="rounded-md border px-2.5 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:py-1.5"
        style={{
          background: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
        }}
        rows={1}
        maxLength={500}
      />

      <input
        type="text"
        placeholder="Address (optional)"
        value={formData.address}
        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
        className="min-h-9 rounded-md border px-2.5 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
        style={{
          background: 'var(--muted)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
        }}
        maxLength={200}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-1.5">
        <select
          value={formData.spot_type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              spot_type: e.target.value as SpotType,
              street_feature: e.target.value === 'street' ? prev.street_feature : null,
            }))
          }
          className="min-h-9 rounded-md border px-2 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
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
          className="min-h-9 rounded-md border px-2 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <select
          value={formData.bust_factor}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bust_factor: Number(e.target.value) as BustFactor }))
          }
          className="min-h-9 rounded-md border px-2 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
        >
          {BUST_FACTORS.map((factor) => (
            <option key={factor.value} value={factor.value}>
              Bust {factor.label}
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
          className="min-h-9 rounded-md border px-2 py-2 text-sm focus:border-blue-400 focus:bg-white focus:outline-none sm:min-h-0 sm:py-1.5"
          style={{
            background: 'var(--muted)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
        >
          <option value="">Feature...</option>
          {STREET_FEATURES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      )}

      <label
        className="flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-dashed px-2.5 py-2 text-xs hover:border-blue-400 hover:text-blue-500 sm:min-h-0 sm:py-1.5"
        style={{
          background: 'var(--muted)',
          color: 'var(--muted-foreground)',
          borderColor: 'var(--border)',
        }}
      >
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

      {error && (
        <p
          className="rounded px-2 py-0.5 text-xs"
          style={{ background: '#fee2e2', color: '#b91c1c' }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
        <button
          type="submit"
          disabled={submitting}
          onClick={(e) => e.stopPropagation()}
          className="min-h-9 flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="min-h-9 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 sm:min-h-0 sm:py-1.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
