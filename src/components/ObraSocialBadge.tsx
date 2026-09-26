import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { obraSocialTint } from '@/lib/patient';
import type { Patient } from '@/lib/patient';

export const ObraSocialBadge = ({ obraSocial }: { obraSocial: NonNullable<Patient['obra_social']> }) => (
  <Badge
    variant="outline"
    translate="no"
    className={cn('border-transparent font-medium', obraSocialTint[obraSocial])}
  >
    {obraSocial}
  </Badge>
);
