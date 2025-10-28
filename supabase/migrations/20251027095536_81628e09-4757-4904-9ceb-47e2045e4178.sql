-- Change image_url from text to text array to support multiple images
ALTER TABLE public.items 
ALTER COLUMN image_url TYPE text[] USING 
  CASE 
    WHEN image_url IS NULL THEN NULL
    WHEN image_url = '' THEN NULL
    ELSE ARRAY[image_url]
  END;