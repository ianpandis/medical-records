-- Identificadores numéricos como texto: conservan ceros a la izquierda
-- (ej. número de trámite 00612345987) y no tienen límite de rango.
-- En la base real las columnas son BIGINT (las migraciones previas dicen INTEGER);
-- el USING ...::text funciona para ambos y conserva los datos existentes.
-- idx_patients_documento se reconstruye automáticamente con el nuevo tipo.
ALTER TABLE public.patients
  ALTER COLUMN documento TYPE text USING documento::text,
  ALTER COLUMN numero_tramite TYPE text USING numero_tramite::text,
  ALTER COLUMN numero_afiliado TYPE text USING numero_afiliado::text;
