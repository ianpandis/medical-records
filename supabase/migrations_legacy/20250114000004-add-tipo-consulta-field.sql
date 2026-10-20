-- Add tipo field to consultas table
ALTER TABLE public.consultas 
ADD COLUMN tipo TEXT CHECK (tipo IN ('Primer Consulta', 'Segunda Consulta', 'Domicilio', 'Espontanea') OR tipo IS NULL);