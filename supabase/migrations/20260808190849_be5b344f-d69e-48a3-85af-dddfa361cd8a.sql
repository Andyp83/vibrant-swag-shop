CREATE POLICY "Anyone can upload quote artwork"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'quote-uploads');