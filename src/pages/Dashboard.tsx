import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatientData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X } from 'lucide-react';
import { PatientList } from '@/components/PatientList';
import { PatientForm } from '@/components/PatientForm';
import { FormDialog } from '@/components/FormDialog';
import { useToast } from '@/hooks/use-toast';
import { PageContent, PageHeader } from '@/components/AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { LOCALIDADES, OBRAS_SOCIALES, SORT_KEYS, sortPatients, type SortDir, type SortKey } from '@/lib/patient';
import { ListPagination } from '@/components/ListPagination';

// Radix Select no admite value=""; usamos un centinela para "todas"
const ALL = 'all';

const PAGE_SIZE = 50;

// Valor de la URL solo si es una opción válida (un ?obra= manual inválido no filtra todo a cero)
const oneOf = (options: readonly string[], value: string | null) =>
  value && options.includes(value) ? value : '';

const Dashboard = () => {
  const { toast } = useToast();
  const { data: patients = [], isPending: loading, isError } = usePatients();
  // Filtros en la URL (?q=&localidad=&obra=): sobreviven a entrar a un paciente y volver
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const localidadFilter = oneOf(LOCALIDADES, searchParams.get('localidad'));
  const obraSocialFilter = oneOf(OBRAS_SOCIALES, searchParams.get('obra'));
  const sortKey = (oneOf(SORT_KEYS, searchParams.get('orden')) || 'paciente') as SortKey;
  const sortDir: SortDir = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const [showAddPatient, setShowAddPatient] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isError) return;
    toast({
      title: "No se pudo cargar la lista de pacientes",
      description: "Revisa tu conexión y recarga la página.",
      variant: "destructive",
    });
  }, [isError, toast]);

  const filteredPatients = patients.filter(patient => {
    // Filtro por texto de búsqueda
    const matchesSearch = searchTerm === '' || 
      `${patient.apellido} ${patient.nombre}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.documento?.includes(searchTerm);
    
    // Filtro por localidad
    const matchesLocalidad = localidadFilter === '' || patient.localidad === localidadFilter;
    
    // Filtro por obra social
    const matchesObraSocial = obraSocialFilter === '' || patient.obra_social === obraSocialFilter;
    
    return matchesSearch && matchesLocalidad && matchesObraSocial;
  });

  // replace al tipear para no llenar el historial con cada tecla
  const setFilters = (changes: Partial<Record<'q' | 'localidad' | 'obra' | 'orden' | 'dir' | 'pagina', string>>, { replace = false } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Cualquier cambio de filtro u orden vuelve a la primera página
      if (!('pagina' in changes)) next.delete('pagina');
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace });
  };

  const sortedPatients = sortPatients(filteredPatients, sortKey, sortDir);
  const pageCount = Math.max(1, Math.ceil(sortedPatients.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(searchParams.get('pagina')) || 1), pageCount);
  const pagePatients = sortedPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Misma columna invierte la dirección; otra columna arranca ascendente
  const handleSort = (key: SortKey) => {
    const dir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';
    setFilters({ orden: key === 'paciente' ? '' : key, dir: dir === 'asc' ? '' : dir });
  };

  const handlePageChange = (nextPage: number) => {
    setFilters({ pagina: nextPage > 1 ? String(nextPage) : '' });
    listTopRef.current?.scrollIntoView({ block: 'start' });
  };

  const handlePatientAdded = () => {
    setShowAddPatient(false);
    toast({
      title: "Éxito",
      description: "Paciente agregado correctamente",
    });
  };

  const hasFilters = searchTerm !== '' || localidadFilter !== '' || obraSocialFilter !== '';

  return (
    <>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Pacientes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">Pacientes</h1>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {loading
                  ? 'Cargando pacientes…'
                  : hasFilters
                    ? `${filteredPatients.length} de ${patients.length} ${patients.length === 1 ? 'paciente' : 'pacientes'}`
                    : `${patients.length} ${patients.length === 1 ? 'paciente' : 'pacientes'}`}
              </p>
            </div>
            <FormDialog
              open={showAddPatient}
              onOpenChange={setShowAddPatient}
              title="Agregar nuevo paciente"
              trigger={
                <Button className="self-start sm:self-auto">
                  <Plus aria-hidden="true" />
                  Agregar paciente
                </Button>
              }
            >
              <PatientForm onSuccess={handlePatientAdded} />
            </FormDialog>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                name="q"
                aria-label="Buscar pacientes"
                placeholder="Buscar por nombre o documento…"
                value={searchTerm}
                onChange={(e) => setFilters({ q: e.target.value }, { replace: true })}
                className="pl-9"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex">
              <Select
                value={localidadFilter || ALL}
                onValueChange={(value) => setFilters({ localidad: value === ALL ? '' : value })}
              >
                <SelectTrigger aria-label="Filtrar por localidad" className="min-w-0 md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las localidades</SelectItem>
                  {LOCALIDADES.map((localidad) => (
                    <SelectItem key={localidad} value={localidad}>{localidad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={obraSocialFilter || ALL}
                onValueChange={(value) => setFilters({ obra: value === ALL ? '' : value })}
              >
                <SelectTrigger aria-label="Filtrar por obra social" className="min-w-0 md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas las obras sociales</SelectItem>
                  {OBRAS_SOCIALES.map((obraSocial) => (
                    <SelectItem key={obraSocial} value={obraSocial}>{obraSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={() => setFilters({ q: '', localidad: '', obra: '' })}
                className="self-start md:self-auto"
              >
                <X aria-hidden="true" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div ref={listTopRef} className="flex scroll-mt-20 flex-col gap-4">
            <PatientList
              patients={pagePatients}
              loading={loading}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <ListPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={sortedPatients.length}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </PageContent>
    </>
  );
};

export default Dashboard;