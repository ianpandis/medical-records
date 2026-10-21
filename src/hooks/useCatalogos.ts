import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Catalogo, Opcion } from '@/lib/catalogos';

const catalogoKey = (catalogo: Catalogo, userId: string | undefined) => ['catalogos', catalogo, userId] as const;

export function useCatalogo(catalogo: Catalogo) {
  const { user } = useAuth();
  return useQuery({
    queryKey: catalogoKey(catalogo, user?.id),
    enabled: !!user?.id,
    // Cambian poco y las usan muchos componentes a la vez (un badge por fila)
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(catalogo)
        .select('*')
        .eq('user_id', user!.id)
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Opcion[];
    },
  });
}

type CambiosOpcion = Partial<Pick<Opcion, 'nombre' | 'orden' | 'activo' | 'color'>>;

export function useGuardarOpcion(catalogo: Catalogo) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cambios }: { id?: string; cambios: CambiosOpcion }) => {
      // Las tres tablas comparten columnas salvo color (solo obras_sociales); con la unión
      // de tablas TypeScript no resuelve el tipo de update/insert
      const tabla = supabase.from(catalogo as 'obras_sociales');
      const { error } = id
        ? await tabla.update(cambios).eq('id', id)
        : await tabla.insert({ nombre: '', ...cambios, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, { cambios }) => {
      // Un renombre se propaga en la base (ON UPDATE CASCADE) a pacientes y consultas
      if (cambios.nombre !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['consultas'] });
      }
      return queryClient.invalidateQueries({ queryKey: ['catalogos', catalogo] });
    },
  });
}

// Guarda la lista en el orden recibido (1, 2, 3…); solo actualiza las que cambian de lugar
export function useOrdenarOpciones(catalogo: Catalogo) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opciones: Opcion[]) => {
      const results = await Promise.all(
        opciones
          .map((opcion, i) => ({ opcion, orden: i + 1 }))
          .filter(({ opcion, orden }) => opcion.orden !== orden)
          .map(({ opcion, orden }) => supabase.from(catalogo).update({ orden }).eq('id', opcion.id)),
      );
      const error = results.find((result) => result.error)?.error;
      if (error) throw error;
    },
    // Se muestra el orden nuevo sin esperar a la base
    onMutate: (opciones) => {
      queryClient.setQueryData(catalogoKey(catalogo, user?.id), opciones.map((opcion, i) => ({ ...opcion, orden: i + 1 })));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['catalogos', catalogo] }),
  });
}

export function useBorrarOpcion(catalogo: Catalogo) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(catalogo).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalogos', catalogo] }),
  });
}

// Códigos de Postgres que la pantalla de listas traduce a mensajes
export const errorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : undefined;
export const YA_EXISTE = '23505';
export const EN_USO = '23503';
