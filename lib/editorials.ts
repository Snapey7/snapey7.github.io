import 'server-only';

import { editorials, type Editorial } from '@/lib/content';
import { createAdminClient } from '@/lib/supabase/admin';

type EditorialRow = {
  slug: string;
  title: string;
  location: string;
  model: string;
  deck: string;
  body: string[];
  photographer: string;
  release_date: string;
  status: 'draft' | 'published';
  editorial_images: {
    id: string;
    storage_path: string | null;
    public_url: string | null;
    alt_text: string;
    position: number;
  }[];
};

export async function getPublicEditorials(): Promise<Editorial[]> {
  try {
    const { data, error } = await createAdminClient().from('editorial_stories')
      .select('slug,title,location,model,deck,body,photographer,release_date,status,editorial_images(id,storage_path,public_url,alt_text,position,published)')
      .eq('status', 'published').eq('editorial_images.published', true);
    if (error || !data) return editorials;

    const published = new Map((data as EditorialRow[]).map((row) => [row.slug, row]));
    return editorials.map((base) => {
      const row = published.get(base.slug);
      if (!row) return base;
      const images = [...(row.editorial_images || [])]
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
        .map((item) => ({
          id: item.id,
          src: item.public_url || `/api/editorial-image/${item.id}`,
          alt: item.alt_text,
        }));
      const body = Array.isArray(row.body) && row.body.length ? row.body : base.body || [base.intro];
      return {
        ...base,
        title: row.title,
        location: row.location,
        model: row.model,
        cardDescription: row.deck,
        photographer: row.photographer,
        date: row.release_date,
        body,
        intro: body[0] || row.deck,
        image: images[0]?.src || base.image,
        gallery: images.slice(1),
      };
    });
  } catch {
    return editorials;
  }
}

export function editorialBody(editorial: Editorial) {
  return editorial.body?.length ? editorial.body : [editorial.intro];
}
