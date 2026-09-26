import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ObraSocialBadge } from '@/components/ObraSocialBadge';
import { EmptyValue } from '@/components/EmptyValue';
import { calcularEdad } from '@/lib/patient';
import type { Patient, SortDir, SortKey } from '@/lib/patient';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

const documentoLabel = (patient: Patient) =>
  patient.documento ? `${patient.tipo_documento ? `${patient.tipo_documento} ` : ''}${patient.documento}` : null;

export const PatientList = ({ patients, loading, sortKey, sortDir, onSort }: PatientListProps) => {
  const sortProps = { sortKey, sortDir, onSort };
  const navigate = useNavigate();
  // El detalle usa esto para volver a la lista con los mismos filtros
  const { search } = useLocation();
  const linkState = { listSearch: search };

  if (loading) {
    return (
      <Card className="overflow-hidden" aria-busy="true">
        <div className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="font-medium">No se encontraron pacientes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prueba con otra búsqueda o limpia los filtros.
        </p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop: tabla */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableHead column="paciente" className="pl-3" {...sortProps}>Paciente</SortableHead>
              <TableHead className="h-10">Documento</TableHead>
              <SortableHead column="obra" {...sortProps}>Obra social</SortableHead>
              <TableHead className="h-10">Localidad</TableHead>
              <SortableHead column="edad" align="right" {...sortProps}>Edad</SortableHead>
              <TableHead className="h-10">Teléfono</TableHead>
              <TableHead className="h-10 w-10"><span className="sr-only">Abrir</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.id}
                onClick={() => navigate(`/patient/${patient.id}`, { state: linkState })}
                className="group cursor-pointer"
              >
                <TableCell className="py-3 pl-5">
                  <Link
                    to={`/patient/${patient.id}`}
                    state={linkState}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium outline-none focus-visible:underline focus-visible:decoration-primary focus-visible:decoration-2 focus-visible:underline-offset-4"
                  >
                    {patient.apellido} {patient.nombre}
                  </Link>
                  {patient.email && (
                    <div className="max-w-[16rem] truncate text-xs text-muted-foreground">{patient.email}</div>
                  )}
                </TableCell>
                <TableCell className="py-3 tabular-nums">{documentoLabel(patient) ?? <EmptyValue />}</TableCell>
                <TableCell className="py-3">
                  {patient.obra_social ? <ObraSocialBadge obraSocial={patient.obra_social} /> : <EmptyValue />}
                </TableCell>
                <TableCell className="py-3">{patient.localidad ?? <EmptyValue />}</TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  {patient.fecha_nacimiento ? calcularEdad(patient.fecha_nacimiento) : <EmptyValue />}
                </TableCell>
                <TableCell className="py-3 tabular-nums">{patient.telefono ?? <EmptyValue />}</TableCell>
                <TableCell className="py-3 pr-4">
                  <ChevronRight
                    className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                    aria-hidden="true"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {patients.map((patient) => {
          const documento = documentoLabel(patient);
          return (
            <li key={patient.id}>
              <Link
                to={`/patient/${patient.id}`}
                state={linkState}
                className="block rounded-xl border bg-card p-4 outline-none transition-colors active:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{patient.apellido} {patient.nombre}</div>
                    {documento && (
                      <div className="mt-0.5 text-sm text-muted-foreground tabular-nums">{documento}</div>
                    )}
                  </div>
                  {patient.obra_social && <ObraSocialBadge obraSocial={patient.obra_social} />}
                </div>
                {(patient.fecha_nacimiento || patient.localidad || patient.telefono) && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
                    {patient.fecha_nacimiento && <span>{calcularEdad(patient.fecha_nacimiento)} años</span>}
                    {patient.localidad && <span>{patient.localidad}</span>}
                    {patient.telefono && <span>{patient.telefono}</span>}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
};

// Header ordenable: aria-sort en el <th> y el botón adentro
const SortableHead = ({
  column,
  align = 'left',
  className,
  sortKey,
  sortDir,
  onSort,
  children,
}: {
  column: SortKey;
  align?: 'left' | 'right';
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  children: ReactNode;
}) => {
  const active = sortKey === column;
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('h-10 px-2', align === 'right' && 'text-right', className)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(column)}
        className={cn(
          'h-8 gap-1 rounded-md px-2 font-medium',
          active ? 'text-foreground' : 'text-muted-foreground',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {children}
        <Icon className={cn('size-3.5', !active && 'opacity-50')} aria-hidden="true" />
      </Button>
    </TableHead>
  );
};
