-- Índice sobre consultas.patient_id: lo usa el detalle del paciente (consultas de un paciente)
-- y el borrado en cascada de un paciente. Está en el schema inicial pero faltaba en la base
-- original; en un proyecto nuevo no hace nada.
create index if not exists consultas_patient_id_idx on public.consultas (patient_id);
