-- Add localidad field to patients table
ALTER TABLE public.patients 
ADD COLUMN localidad TEXT CHECK (localidad IN ('Del Viso', 'Garin', 'Maquinista Savio', 'Pilar') OR localidad IS NULL);