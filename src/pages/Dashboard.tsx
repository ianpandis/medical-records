import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, LogOut, User, Filter, Users } from 'lucide-react';
import { PatientList } from '@/components/PatientList';
import { PatientForm } from '@/components/PatientForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PageContent, PageHeader } from '@/components/AppShell';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

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
  const { user, signOut } = useAuth();
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Gestión de Pacientes</CardTitle>
                  <CardDescription>
                    Busca pacientes existentes o agrega nuevos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}
                    </div>
                    {(searchTerm || localidadFilter || obraSocialFilter) && (
                      <div className="text-xs text-muted-foreground">
                        de {patients.length} total{patients.length !== 1 ? 'es' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barra de búsqueda y botón agregar */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar pacientes por nombre o documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Paciente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
                      </DialogHeader>
                      <PatientForm onSuccess={handlePatientAdded} />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Filtros */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Filtros</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="localidad-filter" className="text-sm">Localidad</Label>
                      <select
                        id="localidad-filter"
                        value={localidadFilter}
                        onChange={(e) => setLocalidadFilter(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Todas las localidades</option>
                        <option value="Del Viso">Del Viso</option>
                        <option value="Garin">Garin</option>
                        <option value="Maquinista Savio">Maquinista Savio</option>
                        <option value="Pilar">Pilar</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="obra-social-filter" className="text-sm">Obra Social</Label>
                      <select
                        id="obra-social-filter"
                        value={obraSocialFilter}
                        onChange={(e) => setObraSocialFilter(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Todas las obras sociales</option>
                        <option value="Pami">Pami</option>
                        <option value="Ioma">Ioma</option>
                        <option value="Medife">Medife</option>
                        <option value="Particular">Particular</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchTerm('');
                          setLocalidadFilter('');
                          setObraSocialFilter('');
                        }}
                        className="w-full h-9"
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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