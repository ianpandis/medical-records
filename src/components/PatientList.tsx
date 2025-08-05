import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@/pages/Dashboard';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onPatientUpdated: () => void;
}

// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export const PatientList = ({ patients, loading, onPatientUpdated }: PatientListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No patients found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient) => (
        <Card key={patient.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">
              {patient.apellido} {patient.nombre}
            </CardTitle>
    
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
            {patient.documento && patient.tipo_documento && (
              <div className="flex items-center gap-2">
                <span>{patient.tipo_documento} - {patient.documento}</span>
              </div>
            )}
            {patient.numero_tramite && (
              <div className="flex items-center gap-2">
                <span>Número de tramite: {patient.numero_tramite}</span>
              </div>
            )}
            {patient.numero_afiliado && (
              <div className="flex items-center gap-2">
                <span>Número de afiliado: {patient.numero_afiliado}</span>
              </div>
            )}
            {patient.obra_social && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{patient.obra_social}</Badge>
              </div>
            )}
            {patient.fecha_nacimiento && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Fecha de nacimiento: {format(parseISO(patient.fecha_nacimiento), 'dd/MM/yyyy')}</span>
              </div>
            )}
            {patient.fecha_nacimiento && (
              <div className="flex items-center gap-2">
                <span className="ml-6 text-muted-foreground">Edad: {calcularEdad(patient.fecha_nacimiento)} años</span>
              </div>
            )}
              {patient.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.telefono}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.direccion && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{patient.direccion}</span>
                </div>
              )}
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate(`/patient/${patient.id}`)}
            >
              Ver Detalles
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};