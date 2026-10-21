import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { tintClass } from '@/lib/catalogos';
import { useCatalogo } from '@/hooks/useCatalogos';

export const ObraSocialBadge = ({ obraSocial }: { obraSocial: string }) => {
  // Color elegido en Listas; mientras carga (o si no está) va neutro
  const { data: obrasSociales } = useCatalogo('obras_sociales');
  const color = obrasSociales?.find((opcion) => opcion.nombre === obraSocial)?.color;
  return (
    <Badge
      variant="outline"
      translate="no"
      className={cn('border-transparent font-medium', color ? tintClass[color] : 'bg-secondary text-secondary-foreground')}
    >
      {obraSocial}
    </Badge>
  );
};
