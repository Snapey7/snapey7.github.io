'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { createShopImageUploadTarget, createShopProduct, removeShopImage, removeUnusedShopUploads, saveShopImages, updateShopProduct } from './shop-actions';

type ShopProduct = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'coming_soon';
  shop_product_images: { id: string; storage_path: string; alt_text: string; position: number }[];
};

export function ShopProductManager({ products }: { products: ShopProduct[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(products.map((product) => [product.id, product.description || ''])),
  );
  const [newTitle, setNewTitle] = useState('');
  const [newPriceId, setNewPriceId] = useState('');
  const [newProductMessage, setNewProductMessage] = useState('');
  const [creating, setCreating] = useState(false);

  async function upload(product: ShopProduct, fileList: FileList | null) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setMessages((current) => ({ ...current, [product.id]: 'Supabase is not configured for browser uploads.' }));
      return;
    }
    setBusyId(product.id);
    setMessages((current) => ({ ...current, [product.id]: 'Uploading public shop photos…' }));
    const supabase = createBrowserClient(url, key);
    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const target = await createShopImageUploadTarget({
          productId: product.id,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        });
        if ('error' in target) throw new Error(target.error);
        const { error } = await supabase.storage.from('shop-product-images')
          .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        uploadedPaths.push(target.path);
      }
      const result = await saveShopImages(product.id, uploadedPaths);
      if ('error' in result) throw new Error(result.error);
      setMessages((current) => ({ ...current, [product.id]: result.success }));
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length) await removeUnusedShopUploads(product.id, uploadedPaths).catch(() => undefined);
      setMessages((current) => ({
        ...current,
        [product.id]: error instanceof Error ? error.message : 'Upload failed. Please try again.',
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(product: ShopProduct, imageId: string) {
    setBusyId(product.id);
    const result = await removeShopImage(product.id, imageId);
    setMessages((current) => ({ ...current, [product.id]: ('error' in result ? result.error : result.success) || '' }));
    setBusyId(null);
    if (!('error' in result)) router.refresh();
  }

  async function save(product: ShopProduct, status: ShopProduct['status']) {
    setBusyId(product.id);
    const result = await updateShopProduct({
      productId: product.id,
      description: descriptions[product.id] || '',
      status,
    });
    setMessages((current) => ({ ...current, [product.id]: ('error' in result ? result.error : result.success) || '' }));
    setBusyId(null);
    if (!('error' in result)) router.refresh();
  }

  return <>
    <form className="studio-new-product" action={async (formData) => {
      setCreating(true);
      const result = await createShopProduct({ title: String(formData.get('title') || ''), stripePriceId: String(formData.get('stripePriceId') || '') });
      setNewProductMessage(('error' in result ? result.error : result.success) || 'Could not add product.');
      if (!('error' in result)) {
        setNewTitle('');
        setNewPriceId('');
        router.refresh();
      }
      setCreating(false);
    }}>
      <label className="studio-field">
        <span>New physical product name</span>
        <input maxLength={160} name="title" onChange={(event) => setNewTitle(event.target.value)} placeholder="Edition 02 — Product name" required value={newTitle} />
      </label>
      <label className="studio-field">
        <span>One-time Stripe Price ID</span>
        <input name="stripePriceId" onChange={(event) => setNewPriceId(event.target.value)} placeholder="price_…" required value={newPriceId} />
      </label>
      <div className="studio-actions">
        <button className="studio-publish" disabled={creating} type="submit">{creating ? 'Adding…' : 'Add shop product'}</button>
      </div>
      {newProductMessage && <p className="studio-feedback" role="status">{newProductMessage}</p>}
    </form>
    <div className="studio-catalogue-list">
    {products.map((product) => <article className="studio-catalogue" key={product.id}>
      <div className="studio-catalogue-heading">
        <div>
          <p className="eyebrow">PHYSICAL SHOP PRODUCT</p>
          <h3>{product.title}</h3>
        </div>
        <span className={`studio-status ${product.status}`}>{product.status === 'coming_soon' ? 'Coming soon' : product.status}</span>
      </div>
      <p className="studio-count">{product.shop_product_images.length} public display photo{product.shop_product_images.length === 1 ? '' : 's'}</p>
      {product.shop_product_images.length > 0 && <div className="studio-shop-image-list">
        {product.shop_product_images.map((image) => <div className="studio-shop-image" key={image.id}>
          <img alt={image.alt_text} src={`${urlForStorage(image.storage_path)}`} />
          <button disabled={busyId === product.id} onClick={() => void remove(product, image.id)} type="button">Remove</button>
        </div>)}
      </div>}
      <label className="studio-field">
        <span>Shop description</span>
        <textarea maxLength={2000} onChange={(event) => setDescriptions((current) => ({ ...current, [product.id]: event.target.value }))}
          placeholder="Describe the physical item shown in the Shop." rows={3} value={descriptions[product.id] || ''} />
      </label>
      <label className="studio-field">
        <span>Upload public product photos (JPEG, PNG, WebP or AVIF; up to 20 MB each)</span>
        <input accept="image/jpeg,image/png,image/webp,image/avif" disabled={busyId === product.id} multiple
          onChange={(event) => { void upload(product, event.currentTarget.files); event.currentTarget.value = ''; }} type="file" />
      </label>
      <div className="studio-actions">
        <button disabled={busyId === product.id} onClick={() => void save(product, 'draft')} type="button">Save draft</button>
        {product.status !== 'coming_soon' && (
          <button disabled={busyId === product.id} onClick={() => void save(product, 'coming_soon')} type="button">Mark coming soon</button>
        )}
        {product.status !== 'published' && (
          <button className="studio-publish" disabled={busyId === product.id} onClick={() => void save(product, 'published')} type="button">Publish for sale</button>
        )}
      </div>
      {messages[product.id] && <p className="studio-feedback" role="status">{messages[product.id]}</p>}
    </article>)}
    </div>
  </>;
}

function urlForStorage(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base.replace(/\/$/, '')}/storage/v1/object/public/shop-product-images/${path.split('/').map(encodeURIComponent).join('/')}` : '';
}
