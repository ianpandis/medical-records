-- Add numero_afiliado and obra_social columns to patients table
ALTER TABLE public.patients 
ADD COLUMN numero_afiliado INTEGER,
ADD COLUMN obra_social TEXT CHECK (obra_social IN ('Pami', 'Ioma', 'Medife', 'Particular')); 