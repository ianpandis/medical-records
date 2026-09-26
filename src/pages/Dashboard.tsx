import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
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

export interface Patient {
  id: string;
  documento: number | null;
  tipo_documento: 'DNI' | 'LE' | 'LC' | null;
  numero_tramite: number | null;
  numero_afiliado: number | null;
  obra_social: 'Pami' | 'Ioma' | 'Medife' | 'Particular' | null;
  localidad: 'Del Viso' | 'Garin' | 'Maquinista Savio' | 'Pilar' | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [localidadFilter, setLocalidadFilter] = useState<string>('');
  const [obraSocialFilter, setObraSocialFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('apellido', { ascending: true });

      if (error) throw error;
      setPatients((data || []) as Patient[]);
    } catch (error) {
      console.error('Error trayendo pacientes:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la lista de pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    // Filtro por texto de búsqueda
    const matchesSearch = searchTerm === '' || 
      `${patient.apellido} ${patient.nombre}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.documento?.toString().includes(searchTerm);
    
    // Filtro por localidad
    const matchesLocalidad = localidadFilter === '' || patient.localidad === localidadFilter;
    
    // Filtro por obra social
    const matchesObraSocial = obraSocialFilter === '' || patient.obra_social === obraSocialFilter;
    
    return matchesSearch && matchesLocalidad && matchesObraSocial;
  });

  const handlePatientAdded = () => {
    fetchPatients();
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
              <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
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
                aria-label="Buscar pacientes"
                placeholder="Buscar por nombre o documento…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-card pl-9"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex">
              <Select
                value={localidadFilter || ALL}
                onValueChange={(value) => setLocalidadFilter(value === ALL ? '' : value)}
              >
                <SelectTrigger aria-label="Filtrar por localidad" className="bg-card md:w-48">
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
                onValueChange={(value) => setObraSocialFilter(value === ALL ? '' : value)}
              >
                <SelectTrigger aria-label="Filtrar por obra social" className="bg-card md:w-48">
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
                onClick={() => {
                  setSearchTerm('');
                  setLocalidadFilter('');
                  setObraSocialFilter('');
                }}
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
            onPatientUpdated={fetchPatients}
          />
        </div>
      </PageContent>
    </>
  );
};

export default Dashboard;