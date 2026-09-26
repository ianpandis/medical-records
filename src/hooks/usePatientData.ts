import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toPatient, type Consultation } from '@/lib/patient';

// Todo lo de pacientes cuelga de ['patients'] para poder invalidarlo junto
export const queryKeys = {
  patients: ['patients'] as const,
  patientList: (userId: string | undefined) => ['patients', 'list', userId] as const,
  patient: (id: string | undefined) => ['patients', 'detail', id] as const,
  consultations: (patientId: string | undefined) => ['consultas', patientId] as const,
};

export function usePatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.patientList(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user!.id)
        .order('apellido', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toPatient);
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patient(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return toPatient(data);
    },
  });
}

export function useConsultations(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.consultations(patientId),
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('patient_id', patientId!)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Consultation[];
    },
  });
}

export function useSavePatient(patientId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patient: TablesInsert<'patients'>) => {
      const { error } = patientId
        ? await supabase.from('patients').update(patient).eq('id', patientId)
        : await supabase.from('patients').insert(patient);
      if (error) throw error;
    },
    // Se devuelve la promesa para que el diálogo se cierre con los datos ya actualizados
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patients }),
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    // Las consultas se borran en la base por ON DELETE CASCADE (consultas.patient_id),
    // así el borrado es atómico
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
    },
    // Solo la lista: el detalle sigue montado hasta navegar y refetchearlo daría "no encontrado"
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients', 'list'] }),
  });
}

export function useSaveConsultation(patientId: string, consultationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consultation: TablesInsert<'consultas'>) => {
      const { error } = consultationId
        ? await supabase.from('consultas').update(consultation).eq('id', consultationId)
        : await supabase.from('consultas').insert(consultation);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultations(patientId) }),
  });
}

export function useDeleteConsultation(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consultations(patientId) }),
  });
}
