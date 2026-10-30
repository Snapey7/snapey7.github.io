'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { createCatalogueUploadTarget, createMagazineIssue, moveCataloguePhoto, removeCataloguePhoto, removeCatalogueUploads, saveCatalogueMedia, updateCatalogue } from './actions';

type Catalogue = {
  id: string;
  title: string;
  description: string;
  product_type: 'model_catalogue' | 'magazine_edition';
  model_slug: string | null;
  status: 'draft' | 'published';
  member_media: { id: string; title: string; alt_text: string; preview_url: string; position: number }[];
};

export function CatalogueManager({ catalogues }: { catalogues: Catalogue[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(catalogues.map((item) => [item.id, item.description || ''])),
  );
  const [issueTitle, setIssueTitle] = useState('');
  const [issueMessage, setIssueMessage] = useState('');
  const [creatingIssue, setCreatingIssue] = useState(false);

  async function upload(catalogue: Catalogue, fileList: FileList | null) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!publicUrl || !publicKey) {
      setMessages((current) => ({ ...current, [catalogue.id]: 'Supabase is not configured for browser uploads.' }));
      return;
    }
    setBusyId(catalogue.id);
    setMessages((current) => ({ ...current, [catalogue.id]: 'Uploading private images…' }));
    const supabase = createBrowserClient(publicUrl, publicKey);
    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const target = await createCatalogueUploadTarget({
          catalogueId: catalogue.id,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        });
        if ('error' in target) throw new Error(target.error);
        const { error } = await supabase.storage.from('member-media')
          .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        uploadedPaths.push(target.path);
      }
      const saved = await saveCatalogueMedia(catalogue.id, uploadedPaths);
      if ('error' in saved) throw new Error(saved.error);
      setMessages((current) => ({ ...current, [catalogue.id]: saved.success }));
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length) await removeCatalogueUploads(catalogue.id, uploadedPaths).catch(() => undefined);
      setMessages((current) => ({
        ...current,
        [catalogue.id]: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function save(catalogue: Catalogue, publish: boolean) {
    setBusyId(catalogue.id);
    const result = await updateCatalogue({
      catalogueId: catalogue.id,
      description: descriptions[catalogue.id] ?? '',
      publish,
    });
    setMessages((current) => ({ ...current, [catalogue.id]: ('error' in result ? result.error : result.success) ?? 'Could not save this catalogue.' }));
    setBusyId(null);
    if (!('error' in result)) router.refresh();
  }

  async function removePhoto(catalogue: Catalogue, photo: Catalogue['member_media'][number]) {
    const isLastPhoto = catalogue.member_media.length === 1;
    const warning = isLastPhoto
      ? `Remove this last photo from “${catalogue.title}”? The catalogue will be unpublished, so customers can no longer buy it until you add photos and publish it again.`
      : `Permanently remove this photo from “${catalogue.title}”? It will disappear from the catalogue for everyone, including existing purchasers.`;
    if (!window.confirm(warning)) return;

    setBusyId(catalogue.id);
    setMessages((current) => ({ ...current, [catalogue.id]: 'Removing private photo…' }));
    try {
      const result = await removeCataloguePhoto(catalogue.id, photo.id);
      const message = 'error' in result
        ? result.error || 'Could not remove this photo.'
        : result.success || 'Photo removed.';
      setMessages((current) => ({ ...current, [catalogue.id]: message }));
      if (!('error' in result)) router.refresh();
    } catch {
      setMessages((current) => ({ ...current, [catalogue.id]: 'Could not remove this photo. Refresh the page and try again.' }));
    } finally {
      setBusyId(null);
    }
  }

  async function movePhoto(catalogue: Catalogue, photoId: string, direction: 'up' | 'down') {
    setBusyId(catalogue.id);
    setMessages((current) => ({ ...current, [catalogue.id]: 'Updating photo order…' }));
    try {
      const result = await moveCataloguePhoto(catalogue.id, photoId, direction);
      if ('error' in result) {
        setMessages((current) => ({ ...current, [catalogue.id]: result.error || 'Could not update photo order.' }));
      } else if (!result.moved) {
        setMessages((current) => ({ ...current, [catalogue.id]: 'That photo is already at the edge of the collection.' }));
      } else {
        setMessages((current) => ({ ...current, [catalogue.id]: 'Photo order updated.' }));
        router.refresh();
      }
    } catch {
      setMessages((current) => ({ ...current, [catalogue.id]: 'Could not change the photo order. Refresh and try again.' }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
    <form className="studio-new-product" action={async (formData) => {
      setCreatingIssue(true);
      const result = await createMagazineIssue(String(formData.get('issueTitle') || ''));
      setIssueMessage(('error' in result ? result.error : result.success) || 'Could not create issue.');
      if (!('error' in result)) {
        setIssueTitle('');
        router.refresh();
      }
      setCreatingIssue(false);
    }}>
      <label className="studio-field">
        <span>Create a new subscriber magazine issue</span>
        <input maxLength={160} name="issueTitle" onChange={(event) => setIssueTitle(event.target.value)} placeholder="Impura Vida Magazine — Edition 2" required value={issueTitle} />
      </label>
      <div className="studio-actions">
        <button className="studio-publish" disabled={creatingIssue} type="submit">{creatingIssue ? 'Creating…' : 'Create issue draft'}</button>
      </div>
      {issueMessage && <p className="studio-feedback" role="status">{issueMessage}</p>}
    </form>
    <div className="studio-catalogue-list">
      {catalogues.map((catalogue) => (
        <article className="studio-catalogue" key={catalogue.id}>
          <div className="studio-catalogue-heading">
            <div>
              <p className="eyebrow">{catalogue.product_type === 'magazine_edition' ? 'DIGITAL ISSUE · MEMBERS' : `MUSE · ${catalogue.model_slug}`}</p>
              <h2>{catalogue.title}</h2>
            </div>
            <span className={`studio-status ${catalogue.status}`}>{catalogue.status}</span>
          </div>
          <p className="studio-count">{catalogue.member_media.length} private image{catalogue.member_media.length === 1 ? '' : 's'}</p>
          {catalogue.member_media.length > 0 && <div className="studio-private-image-list" aria-label={`Private photos in ${catalogue.title}`}>
            {catalogue.member_media.map((photo, index) => <figure className="studio-private-image" key={photo.id}>
              {photo.preview_url ? <img src={photo.preview_url} alt={photo.alt_text || photo.title} loading="lazy" /> : <div className="studio-private-image-placeholder">Preview unavailable</div>}
              <figcaption>
                <span>{photo.title || photo.alt_text}</span>
                <div className="studio-private-image-actions">
                  <button aria-label={`Move ${photo.title || `photo ${index + 1}`} earlier`} disabled={busyId === catalogue.id || index === 0} onClick={() => void movePhoto(catalogue, photo.id, 'up')} type="button">↑</button>
                  <button aria-label={`Move ${photo.title || `photo ${index + 1}`} later`} disabled={busyId === catalogue.id || index === catalogue.member_media.length - 1} onClick={() => void movePhoto(catalogue, photo.id, 'down')} type="button">↓</button>
                  <button className="studio-private-image-remove" disabled={busyId === catalogue.id} onClick={() => void removePhoto(catalogue, photo)} type="button">
                    {busyId === catalogue.id ? 'Working…' : 'Remove photo'}
                  </button>
                </div>
              </figcaption>
            </figure>)}
          </div>}
          {catalogue.product_type === 'model_catalogue' && catalogue.status !== 'published' && (
            <p className="studio-feedback">To show the individual Buy Catalogue option on this muse page, upload at least one private photo and publish this catalogue.</p>
          )}
          <label className="studio-field">
            <span>Customer description</span>
            <textarea
              maxLength={2000}
              onChange={(event) => setDescriptions((current) => ({ ...current, [catalogue.id]: event.target.value }))}
              placeholder="A short description shown with this catalogue."
              rows={3}
              value={descriptions[catalogue.id] || ''}
            />
          </label>
          <label className="studio-field">
            <span>Add private photographs (JPEG, PNG, WebP or AVIF; up to 20 MB each)</span>
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busyId === catalogue.id}
              multiple
              onChange={(event) => {
                void upload(catalogue, event.currentTarget.files);
                event.currentTarget.value = '';
              }}
              type="file"
            />
          </label>
          <div className="studio-actions">
            <button disabled={busyId === catalogue.id} onClick={() => void save(catalogue, false)} type="button">
              Save draft
            </button>
            {catalogue.status === 'published' ? (
              <button disabled={busyId === catalogue.id} onClick={() => void save(catalogue, false)} type="button">
                Unpublish
              </button>
            ) : (
              <button className="studio-publish" disabled={busyId === catalogue.id} onClick={() => void save(catalogue, true)} type="button">
                Publish
              </button>
            )}
          </div>
          {messages[catalogue.id] && <p className="studio-feedback" role="status">{messages[catalogue.id]}</p>}
        </article>
      ))}
    </div>
    </>
  );
}
