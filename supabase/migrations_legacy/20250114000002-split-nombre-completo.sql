-- Split nombre_completo into nombre and apellido fields
-- Add new columns for nombre and apellido
ALTER TABLE public.patients 
ADD COLUMN nombre text,
ADD COLUMN apellido text;

-- Migrate existing data from nombre_completo to new fields
UPDATE public.patients 
SET 
  nombre = COALESCE(split_part(nombre_completo, ' ', 1), ''),
  apellido = COALESCE(
    CASE 
      WHEN array_length(string_to_array(nombre_completo, ' '), 1) > 1 
      THEN array_to_string(
        (string_to_array(nombre_completo, ' '))[2:array_length(string_to_array(nombre_completo, ' '), 1)], 
        ' '
      )
      ELSE ''
    END, 
    ''
  );

-- Make the new fields required
ALTER TABLE public.patients 
ALTER COLUMN nombre SET NOT NULL,
ALTER COLUMN apellido SET NOT NULL;

-- Drop the old nombre_completo column
ALTER TABLE public.patients 
DROP COLUMN nombre_completo;