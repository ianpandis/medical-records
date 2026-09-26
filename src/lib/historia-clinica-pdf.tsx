import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { calcularEdad, type Consultation, type Patient } from '@/lib/patient';

// Se importa con import() desde PatientDetail: @react-pdf/renderer pesa y solo hace falta al descargar.
// Helvetica (fuente estándar de PDF) cubre acentos y ñ sin tener que embeber una fuente.

const INK = '#0a2540';
const MUTED = '#64748d';
const HAIRLINE = '#e5edf5';
const ACCENT = '#533afd';

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontFamily: 'Helvetica', fontSize: 10, color: INK },
  eyebrow: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  subtitle: { color: MUTED, marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: HAIRLINE },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  item: { width: '50%', marginBottom: 10, paddingRight: 12 },
  label: { fontSize: 8, color: MUTED, marginBottom: 2 },
  empty: { color: MUTED },
  consulta: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: HAIRLINE },
  consultaHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  consultaFecha: { fontFamily: 'Helvetica-Bold' },
  consultaTipo: { color: MUTED, marginLeft: 8 },
  // lineHeight solo acá y en pt: heredado desde page react-pdf no dibuja el pie y encima el título;
  // sin unidad (1.4) sale ~2,5× y un número a secas (14) cuelga el render (@react-pdf/renderer 4.9)
  notas: { lineHeight: '14pt' },
  footer: { position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: MUTED },
});

const fecha = (value: string) => format(parseISO(value), 'dd/MM/yyyy');

const Dato = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <View style={styles.item}>
    <Text style={styles.label}>{label}</Text>
    <Text style={value ? undefined : styles.empty}>{value || '—'}</Text>
  </View>
);

const HistoriaClinica = ({ patient, consultations, generado }: { patient: Patient; consultations: Consultation[]; generado: Date }) => {
  const nombre = `${patient.apellido} ${patient.nombre}`;
  return (
    <Document title={`Historia clínica - ${nombre}`} language="es">
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Historia clínica</Text>
        <Text style={styles.title}>{nombre}</Text>
        {patient.documento && (
          <Text style={styles.subtitle}>{patient.tipo_documento ?? 'Doc.'} {patient.documento}</Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del paciente</Text>
          <View style={styles.grid}>
            <Dato
              label="Fecha de nacimiento"
              value={patient.fecha_nacimiento && `${fecha(patient.fecha_nacimiento)} · ${calcularEdad(patient.fecha_nacimiento)} años`}
            />
            <Dato label="Obra social" value={patient.obra_social} />
            <Dato label="Número de afiliado" value={patient.numero_afiliado} />
            <Dato label="Número de trámite" value={patient.numero_tramite} />
            <Dato label="Teléfono" value={patient.telefono} />
            <Dato label="Email" value={patient.email} />
            <Dato label="Localidad" value={patient.localidad} />
            <Dato label="Dirección" value={patient.direccion} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Consultas ({consultations.length})
          </Text>
          {consultations.length === 0 ? (
            <Text style={[styles.empty, { marginTop: 10 }]}>Sin consultas registradas.</Text>
          ) : (
            consultations.map((consulta) => (
              <View key={consulta.id} style={styles.consulta}>
                {/* Una consulta larga se parte entre páginas; minPresenceAhead evita dejar la fecha sola al pie */}
                <View style={styles.consultaHeader} minPresenceAhead={28}>
                  <Text style={styles.consultaFecha}>{fecha(consulta.fecha)}</Text>
                  {consulta.tipo && <Text style={styles.consultaTipo}>{consulta.tipo}</Text>}
                </View>
                <Text style={styles.notas}>{consulta.notas}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>{nombre} · Generado el {format(generado, "dd/MM/yyyy 'a las' HH:mm")}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

// Nombre de archivo sin acentos ni espacios: historia-clinica-aguirre-marta-2026-09-25.pdf
function nombreArchivo(patient: Patient, generado: Date) {
  const slug = `${patient.apellido} ${patient.nombre}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `historia-clinica-${slug}-${format(generado, 'yyyy-MM-dd')}.pdf`;
}

export async function descargarHistoriaClinica(patient: Patient, consultations: Consultation[]) {
  const generado = new Date();
  const blob = await pdf(<HistoriaClinica patient={patient} consultations={consultations} generado={generado} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo(patient, generado);
  link.click();
  // Se libera después: revocar en el mismo tick puede cortar la descarga en algunos navegadores
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
