-- Raise the per-object upload cap for catalogue, editorial, and shop images.
-- Supabase's project-wide Storage limit must also be set to at least 200 MB.
update storage.buckets
set file_size_limit = 209715200
where id in ('member-media', 'editorial-media', 'shop-product-images');
