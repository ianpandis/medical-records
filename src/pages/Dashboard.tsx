import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatientData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X } from 'lucide-react';
import { PatientList } from '@/components/PatientList';
import { PatientForm } from '@/components/PatientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PageContent, PageHeader } from '@/components/AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { LOCALIDADES, OBRAS_SOCIALES } from '@/lib/patient';

// Radix Select no admite value=""; usamos un centinela para "todas"
const ALL = 'all';

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
  const [showAddPatient, setShowAddPatient] = useState(false);

  useEffect(() => {
    if (!isError) return;
    toast({
      title: "Error",
      description: "No se pudo cargar la lista de pacientes",
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
  const setFilters = (changes: Partial<Record<'q' | 'localidad' | 'obra', string>>, { replace = false } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace });
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
            <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
              <DialogTrigger asChild>
                <Button className="self-start sm:self-auto">
                  <Plus aria-hidden="true" />
                  Agregar paciente
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-2xl overflow-y-auto overscroll-contain">
                <DialogHeader>
                  <DialogTitle>Agregar nuevo paciente</DialogTitle>
                </DialogHeader>
                <PatientForm onSuccess={handlePatientAdded} />
              </DialogContent>
            </Dialog>
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

          <PatientList 
            patients={filteredPatients} 
            loading={loading}
          />
        </div>
      </PageContent>
    </>
  );
};

export default Dashboard;