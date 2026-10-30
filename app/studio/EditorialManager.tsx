'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { Editorial } from '@/lib/content';
import { createEditorialUploadTarget, removeEditorialUpload, saveEditorialPhoto, updateEditorial } from './actions';

type ManagedEditorial = Editorial & {
  status: 'draft' | 'published';
  images: { id: string; storage_path: string | null; preview_url: string; alt_text: string }[];
};

type Fields = {
  title: string;
  location: string;
  model: string;
  deck: string;
  body: string;
  photographer: string;
  releaseDate: string;
};

function initialFields(item: ManagedEditorial): Fields {
  return {
    title: item.title,
    location: item.location,
    model: item.model,
    deck: item.cardDescription,
    body: item.body?.join('\n\n') || item.intro,
    photographer: item.photographer,
    releaseDate: item.date,
  };
}

export function EditorialManager({ editorials }: { editorials: ManagedEditorial[] }) {
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, Fields>>(
    Object.fromEntries(editorials.map((item) => [item.slug, initialFields(item)])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [altText, setAltText] = useState<Record<string, string>>({});

  function update(slug: string, key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [slug]: { ...(current[slug] || {}), [key]: value } }));
  }

  async function save(item: ManagedEditorial) {
    const value = fields[item.slug] || initialFields(item);
    setBusy(item.slug);
    const result = await updateEditorial({ slug: item.slug, ...value });
    setMessages((current) => ({ ...current, [item.slug]: ('error' in result ? result.error : result.success) || 'Could not save this editorial.' }));
    setBusy(null);
    if (!('error' in result)) router.refresh();
  }

  async function upload(item: ManagedEditorial, file: File | undefined) {
    if (!file) return;
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!publicUrl || !publicKey) {
      setMessages((current) => ({ ...current, [item.slug]: 'Supabase is not configured for browser uploads.' }));
      return;
    }
    setBusy(item.slug);
    setMessages((current) => ({ ...current, [item.slug]: 'Uploading image to private storage…' }));
    let uploadedPath = '';
    try {
      const target = await createEditorialUploadTarget({ slug: item.slug, fileName: file.name, contentType: file.type, size: file.size });
      if ('error' in target) throw new Error(target.error);
      const supabase = createBrowserClient(publicUrl, publicKey);
      const { error } = await supabase.storage.from('editorial-media')
        .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      uploadedPath = target.path;
      const result = await saveEditorialPhoto(item.slug, uploadedPath, altText[item.slug] || '');
      if ('error' in result) throw new Error(result.error);
      setMessages((current) => ({ ...current, [item.slug]: result.success }));
      router.refresh();
    } catch (error) {
      if (uploadedPath) await removeEditorialUpload(item.slug, uploadedPath).catch(() => undefined);
      setMessages((current) => ({ ...current, [item.slug]: error instanceof Error ? error.message : 'Image upload failed.' }));
    } finally {
      setBusy(null);
    }
  }

  async function removePhoto(item: ManagedEditorial, photo: ManagedEditorial['images'][number]) {
    if (!photo.storage_path || !window.confirm(`Permanently delete this uploaded image from “${item.title}”?`)) return;
    setBusy(item.slug);
    setMessages((current) => ({ ...current, [item.slug]: 'Removing image…' }));
    try {
      const result = await removeEditorialUpload(item.slug, photo.storage_path);
      setMessages((current) => ({ ...current, [item.slug]: ('error' in result ? result.error : result.success) || 'Could not remove the image.' }));
      if (!('error' in result)) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return <div className="studio-editorial-list">
    {editorials.map((item) => {
      const value = fields[item.slug] || initialFields(item);
      return <article className="studio-catalogue studio-editorial" key={item.slug}>
        <div className="studio-catalogue-heading">
          <div><p className="eyebrow">PUBLIC EDITORIAL · {item.slug}</p><h3>{item.title}</h3></div>
          <span className={`studio-status ${item.status}`}>{item.status}</span>
        </div>
        {item.images.length > 0 && <div className="studio-editorial-image-list">
          {item.images.map((photo) => <figure className="studio-editorial-image" key={photo.id}>
            {photo.preview_url ? <img src={photo.preview_url} alt={photo.alt_text} loading="lazy" /> : <div className="studio-private-image-placeholder">Preview unavailable</div>}
            {photo.storage_path && <figcaption><span>{photo.alt_text}</span><button disabled={busy === item.slug} onClick={() => void removePhoto(item, photo)} type="button">Remove uploaded image</button></figcaption>}
          </figure>)}
        </div>}
        <div className="studio-editorial-fields">
          <label className="studio-field"><span>Story title</span><input maxLength={180} onChange={(event) => update(item.slug, 'title', event.target.value)} value={value.title} /></label>
          <label className="studio-field"><span>Short introduction</span><textarea maxLength={400} onChange={(event) => update(item.slug, 'deck', event.target.value)} rows={2} value={value.deck} /></label>
          <label className="studio-field studio-editorial-body-field"><span>Story text · leave a blank line between paragraphs</span><textarea maxLength={16000} onChange={(event) => update(item.slug, 'body', event.target.value)} rows={10} value={value.body} /></label>
          <label className="studio-field"><span>Location</span><input maxLength={120} onChange={(event) => update(item.slug, 'location', event.target.value)} value={value.location} /></label>
          <label className="studio-field"><span>Featuring</span><input maxLength={120} onChange={(event) => update(item.slug, 'model', event.target.value)} value={value.model} /></label>
          <label className="studio-field"><span>Photography by</span><input maxLength={120} onChange={(event) => update(item.slug, 'photographer', event.target.value)} value={value.photographer} /></label>
          <label className="studio-field"><span>Release date</span><input maxLength={80} onChange={(event) => update(item.slug, 'releaseDate', event.target.value)} placeholder="Optional" value={value.releaseDate} /></label>
          <label className="studio-field"><span>Image description for accessibility</span><input maxLength={300} onChange={(event) => setAltText((current) => ({ ...current, [item.slug]: event.target.value }))} placeholder="Describe the photograph" value={altText[item.slug] || ''} /></label>
          <label className="studio-field"><span>Upload public editorial photographs (JPEG, PNG, WebP or AVIF; up to 20 MB each)</span><input accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy === item.slug} onChange={(event) => { void upload(item, event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} type="file" /></label>
        </div>
        <div className="studio-actions">
          <button className="studio-publish" disabled={busy === item.slug} onClick={() => void save(item)} type="button">{busy === item.slug ? 'Working…' : 'Save and publish'}</button>
        </div>
        {messages[item.slug] && <p className="studio-feedback" role="status">{messages[item.slug]}</p>}
      </article>;
    })}
  </div>;
}
