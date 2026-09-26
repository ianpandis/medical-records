// Marcador para campos sin cargar: guion visual y texto para lectores de pantalla
export const EmptyValue = () => (
  <>
    <span className="text-muted-foreground/60" aria-hidden="true">-</span>
    <span className="sr-only">Sin dato</span>
  </>
);
