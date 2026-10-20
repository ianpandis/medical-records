-- Make patient fields optional except for nombre_completo
ALTER TABLE public.patients 
ALTER COLUMN documento DROP NOT NULL,
ALTER COLUMN tipo_documento DROP NOT NULL,
ALTER COLUMN numero_tramite DROP NOT NULL,
ALTER COLUMN fecha_nacimiento DROP NOT NULL; 