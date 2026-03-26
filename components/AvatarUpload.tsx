// =============================================================================
// AVATAR UPLOAD & CROP COMPONENT
// =============================================================================
//
// HOW IT WORKS (plain English):
//
// 1. USER PICKS A FILE
//    The hidden <input type="file"> opens the system file picker.
//    We read the chosen file into a "data URL" — a base64-encoded string
//    that the browser can display as an image without uploading anything yet.
//
// 2. CROP MODAL OPENS
//    react-easy-crop renders the image inside a draggable/zoomable viewport.
//    The user drags and zooms to frame their face inside a circular guide.
//    The library tracks the crop coordinates in PIXELS (x, y, width, height)
//    — this is the "croppedAreaPixels" value.
//
// 3. CANVAS CROP (getCroppedBlob)
//    When the user clicks "Save", we do the actual image manipulation:
//      a. Create an invisible <canvas> element (256 × 256 pixels).
//      b. Use ctx.drawImage() to copy ONLY the cropped rectangle from
//         the original image onto the canvas, scaling it to 256×256.
//      c. Export the canvas as a WebP Blob (a binary image file in memory).
//    This all happens in the browser — no server round-trip yet.
//
// 4. UPLOAD
//    The Blob is stuffed into a FormData object (like a regular file upload)
//    and POSTed to /api/avatar. The server stores it in Supabase Storage
//    and updates the user's profile row.
//
// KEY CONCEPTS:
//   - "Blob"    = a chunk of binary data (the image file) living in memory.
//   - "Canvas"  = an HTML element that lets you draw/manipulate pixels.
//   - "WebP"    = a modern image format ~30% smaller than JPEG at same quality.
//   - "Area"    = { x, y, width, height } — the rectangle to crop out.
// =============================================================================

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Cropper, { type Area } from 'react-easy-crop';

interface AvatarUploadProps {
  /** The URL of the user's current avatar (null if they haven't set one). */
  currentAvatarUrl: string | null;
  /** Called with the new public URL after a successful upload. */
  onUploadComplete: (url: string) => void;
}

/**
 * Takes the original image and the crop coordinates from react-easy-crop,
 * draws the cropped portion onto a 256×256 canvas, then exports it as a
 * WebP Blob (binary image data ready to upload).
 *
 * Step-by-step:
 *  1. Load the image into an HTMLImageElement (the browser's internal image
 *     object — same thing an <img> tag uses under the hood).
 *  2. Create a 256×256 <canvas> — think of it as a blank 256×256 pixel grid.
 *  3. ctx.drawImage() copies a rectangle from the source image onto the
 *     canvas. The arguments are:
 *       - source image
 *       - sx, sy          → top-left corner of the crop (pixels from original)
 *       - sWidth, sHeight → size of the crop rectangle (from react-easy-crop)
 *       - dx, dy          → where to start drawing on the canvas (0, 0)
 *       - dWidth, dHeight  → size on the canvas (256×256 = our output size)
 *     So if the user cropped a 800×800 area, it gets scaled down to 256×256.
 *  4. canvas.toBlob() encodes the pixel data as a WebP file at 85% quality.
 *     (WebP is ~30% smaller than JPEG for similar visual quality.)
 *
 * @param imageSrc  - A data URL (base64 string) of the original image.
 * @param crop      - { x, y, width, height } in pixels, from react-easy-crop.
 * @returns A Promise that resolves to a Blob (the cropped WebP image file).
 */
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  // Step 1: Load the image into a browser Image object
  const image = new window.Image();
  image.crossOrigin = 'anonymous'; // needed if image is from a different origin
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  // Step 2: Create a blank 256×256 canvas
  const canvas = document.createElement('canvas');
  const size = 256; // final avatar dimensions (256×256 px)
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Step 3: Draw the cropped portion of the original image, scaled to 256×256
  ctx.drawImage(
    image, // source image
    crop.x, // source X — left edge of the crop rectangle
    crop.y, // source Y — top edge of the crop rectangle
    crop.width, // source width — how many pixels wide to grab
    crop.height, // source height — how many pixels tall to grab
    0, // destination X on canvas (top-left corner)
    0, // destination Y on canvas
    size, // destination width  — stretch/shrink to 256
    size // destination height — stretch/shrink to 256
  );

  // Step 4: Convert the canvas pixels into a WebP Blob at 85% quality
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/webp', // output format
      0.85 // quality (0 = worst, 1 = best). 0.85 is a good balance.
    );
  });
}

export default function AvatarUpload({ currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
  // The data URL of the image the user selected (shown in the crop modal)
  const [preview, setPreview] = useState<string | null>(null);
  // Crop position — { x, y } offset controlled by dragging in the crop UI
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  // Zoom level — 1 = no zoom, 3 = max zoom in
  const [zoom, setZoom] = useState(1);
  // The final crop rectangle in pixels — set by react-easy-crop's onCropComplete
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  // Ref to the hidden file input so we can trigger it programmatically
  const fileInputRef = useRef<HTMLInputElement>(null);

  // react-easy-crop calls this every time the user drags or zooms.
  // We only care about croppedPixels (the exact pixel rectangle to cut out).
  // The first arg (croppedArea as %) is unused — hence the underscore.
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  /**
   * When the user picks a file:
   *  - Validate it's an image and under 5 MB.
   *  - Read it as a data URL (base64 string like "data:image/png;base64,iVBOR...")
   *    so we can display it in the crop modal without uploading yet.
   *  - FileReader is a browser API that reads files from disk into memory.
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file); // converts file → base64 data URL string
  };

  /**
   * The full upload pipeline:
   *  1. Crop the image on a canvas → get a WebP Blob (see getCroppedBlob).
   *  2. Wrap the Blob in a FormData — this mimics a regular <form> file upload.
   *  3. POST it to our /api/avatar route, which stores it in Supabase Storage.
   *  4. The API returns the public URL → we tell the parent component via
   *     onUploadComplete so it can update the displayed avatar immediately.
   */
  const handleUpload = async () => {
    if (!preview || !croppedArea) return;
    setUploading(true);
    setError('');

    try {
      // Crop on canvas → WebP Blob
      const blob = await getCroppedBlob(preview, croppedArea);

      // Wrap in FormData (same format a <form enctype="multipart/form-data"> uses)
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');

      // Send to our API route
      const res = await fetch('/api/avatar', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Upload failed');

      // Notify parent with the new public URL
      onUploadComplete(json.url);
      handleCancel();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* Current avatar / placeholder */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
        {currentAvatarUrl ? (
          <Image
            src={currentAvatarUrl}
            alt="Your avatar"
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">👤</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select avatar image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {currentAvatarUrl ? 'Change avatar' : 'Upload avatar'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Crop modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-md flex-col rounded-xl border border-border bg-background shadow-xl">
            <h3 className="px-4 pt-4 text-lg font-semibold text-foreground">Crop your avatar</h3>

            {/* Crop area */}
            <div className="relative mx-4 mt-4 aspect-square overflow-hidden rounded-lg bg-muted">
              {/*
                react-easy-crop props explained:
                - image:          the data URL of the selected image
                - crop:           current { x, y } pan position
                - zoom:           current zoom level (1–3)
                - aspect={1}:     forces a square crop (1:1 ratio)
                - cropShape:      "round" shows a circular guide
                - showGrid:       hides the rule-of-thirds grid
                - onCropChange:   fires on drag → updates pan position
                - onCropComplete: fires on drag/zoom end → gives us the
                                  final pixel coordinates of the crop
                - onZoomChange:   fires on scroll/pinch → updates zoom
              */}
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs text-muted-foreground">−</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Zoom"
              />
              <span className="text-xs text-muted-foreground">+</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !croppedArea}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
