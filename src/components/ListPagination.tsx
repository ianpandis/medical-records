import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const ListPagination = ({ page, pageSize, total, onPageChange }: ListPaginationProps) => {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground tabular-nums">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline" aria-current="page">
          Página {page} de {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Página siguiente"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
