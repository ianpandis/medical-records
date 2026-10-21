import { Link } from 'react-router-dom';
import { CATALOGOS, type Catalogo } from '@/lib/catalogos';

// Usuario nuevo: las listas arrancan vacías hasta que las carga en Listas
export const ListaVaciaHint = ({ catalogo }: { catalogo: Catalogo }) => (
  <p className="text-sm text-muted-foreground">
    La lista de {CATALOGOS[catalogo].titulo.toLowerCase()} está vacía. Cargala en{' '}
    <Link to={`/listas#${catalogo}`} className="font-medium text-primary underline-offset-4 hover:underline">Listas</Link>.
  </p>
);
