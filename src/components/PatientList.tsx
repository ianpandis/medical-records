import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@/pages/Dashboard';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onPatientUpdated: () => void;
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
              {patient.name} {patient.lastname}
            </CardTitle>
            <CardDescription>
              <Badge variant="outline">ID: {patient.document}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Born: {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</span>
              </div>
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{patient.address}</span>
                </div>
              )}
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate(`/patient/${patient.id}`)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};