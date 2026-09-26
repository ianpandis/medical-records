import { createContext, useContext, useEffect } from 'react';

// FormDialog provee el setter; el form de adentro reporta si tiene cambios sin guardar
export const DirtyFormContext = createContext<((dirty: boolean) => void) | null>(null);

export function useReportDirty(dirty: boolean) {
  const setDirty = useContext(DirtyFormContext);
  useEffect(() => {
    setDirty?.(dirty);
  }, [dirty, setDirty]);
  // Al desmontarse el form (diálogo cerrado) ya no hay nada que descartar
  useEffect(() => () => setDirty?.(false), [setDirty]);
}
