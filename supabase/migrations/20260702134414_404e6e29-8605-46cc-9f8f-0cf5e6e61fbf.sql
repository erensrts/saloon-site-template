-- Admin-only write access on the public "gallery" bucket.
-- Public SELECT is already granted by the bucket being public.

CREATE POLICY "Admins can upload gallery files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update gallery files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'gallery'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete gallery files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
