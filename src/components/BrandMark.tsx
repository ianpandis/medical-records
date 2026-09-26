import { Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BrandMark = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn(
      'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
      className
    )}
  >
    <Stethoscope className="size-4" />
  </div>
);
