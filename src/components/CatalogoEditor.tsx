import { useState, type ComponentProps, type FormEvent } from 'react';
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { CATALOGOS, MAX_NOMBRE_OPCION, TINTS, tintClass, tintLabel, type Catalogo, type Opcion, type Tint } from '@/lib/catalogos';
import { EN_USO, YA_EXISTE, errorCode, useBorrarOpcion, useCatalogo, useGuardarOpcion, useOrdenarOpciones } from '@/hooks/useCatalogos';
import { useToast } from '@/hooks/use-toast';

// Valida un nombre nuevo o renombrado; devuelve el mensaje de error o null
function validarNombre(nombre: string, opciones: Opcion[], propio?: Opcion): string | null {
  if (nombre === '') return 'Escribí un nombre';
  if (nombre.length > MAX_NOMBRE_OPCION) return `Máximo ${MAX_NOMBRE_OPCION} caracteres`;
  const repetida = opciones.find((opcion) => opcion.id !== propio?.id && opcion.nombre.toLowerCase() === nombre.toLowerCase());
  if (repetida) return repetida.activo ? 'Ya está en la lista' : 'Ya está en la lista, archivada: restaurala';
  return null;
}

export const CatalogoEditor = ({ catalogo }: { catalogo: Catalogo }) => {
  const { titulo, singular, nueva, la } = CATALOGOS[catalogo];
  const conColor = catalogo === 'obras_sociales';
  const { toast } = useToast();
  const { data: opciones = [], isPending, isError } = useCatalogo(catalogo);
  const guardar = useGuardarOpcion(catalogo);
  const ordenar = useOrdenarOpciones(catalogo);
  const borrar = useBorrarOpcion(catalogo);
  const [nuevo, setNuevo] = useState('');
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);

  const activas = opciones.filter((opcion) => opcion.activo);
  const archivadas = opciones.filter((opcion) => !opcion.activo);
  const inputId = `${catalogo}-nuevo`;

  const falla = (accion: string) => (error: unknown) => {
    console.error(`Error al ${accion}:`, error);
    toast({
      title: `No se pudo ${accion}`,
      description: errorCode(error) === YA_EXISTE ? 'Ya hay una opción con ese nombre.' : 'Revisa tu conexión e intenta de nuevo.',
      variant: 'destructive',
    });
  };

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    const nombre = nuevo.trim();
    const error = validarNombre(nombre, opciones);
    setErrorNuevo(error);
    if (error) return;
    const orden = Math.max(0, ...opciones.map((opcion) => opcion.orden)) + 1;
    // Cada obra social nueva toma el siguiente color de la paleta; se puede cambiar después
    const color = conColor ? TINTS[opciones.length % TINTS.length] : undefined;
    guardar.mutate(
      { cambios: { nombre, orden, color } },
      { onSuccess: () => setNuevo(''), onError: falla(`agregar ${la}`) },
    );
  };

  // Mueve una opción activa un lugar; las archivadas quedan al final
  const mover = (index: number, delta: -1 | 1) => {
    const lista = [...activas];
    [lista[index], lista[index + delta]] = [lista[index + delta], lista[index]];
    ordenar.mutate([...lista, ...archivadas], { onError: falla('cambiar el orden') });
  };

  const archivar = (opcion: Opcion, activo: boolean) =>
    guardar.mutate({ id: opcion.id, cambios: { activo } }, { onError: falla(activo ? 'restaurar la opción' : 'archivar la opción') });

  const handleBorrar = (opcion: Opcion) =>
    borrar.mutate(opcion.id, {
      onError: (error) =>
        errorCode(error) === EN_USO
          ? toast({
              title: 'No se puede borrar',
              description: `"${opcion.nombre}" está en uso. Queda archivada: no aparece en los formularios.`,
              variant: 'destructive',
            })
          : falla('borrar la opción')(error),
    });

  return (
    <section id={catalogo} aria-labelledby={`${catalogo}-titulo`} className="scroll-mt-20">
      <Card className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={`${catalogo}-titulo`} className="font-semibold">{titulo}</h2>
          {!isPending && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {activas.length} {activas.length === 1 ? 'activa' : 'activas'}
            </span>
          )}
        </div>

        <form onSubmit={agregar} className="mt-4 flex gap-2" noValidate>
          <div className="min-w-0 flex-1">
            <Input
              id={inputId}
              aria-label={nueva}
              placeholder={`Agregar ${singular}…`}
              value={nuevo}
              onChange={(e) => { setNuevo(e.target.value); setErrorNuevo(null); }}
              autoComplete="off"
              aria-invalid={errorNuevo ? true : undefined}
              aria-describedby={errorNuevo ? `${inputId}-error` : undefined}
            />
            {errorNuevo && (
              <p id={`${inputId}-error`} className="mt-1.5 text-sm text-destructive" role="alert">{errorNuevo}</p>
            )}
          </div>
          <Button type="submit" variant="outline" disabled={guardar.isPending && !guardar.variables?.id}>
            <Plus aria-hidden="true" />
            <span className="max-sm:sr-only">Agregar</span>
          </Button>
        </form>

        {isPending ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : isError ? (
          <p className="mt-4 text-sm text-destructive">No se pudo cargar la lista. Revisa tu conexión y recarga la página.</p>
        ) : activas.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no hay opciones activas. Las que agregues van a aparecer en los formularios y los filtros.
          </p>
        ) : (
          <ul className="mt-4 divide-y" aria-label={`${titulo} activas`}>
            {activas.map((opcion, index) => (
              <li key={opcion.id} className="flex min-h-12 items-center gap-2 py-1.5">
                {editando === opcion.id ? (
                  <RenombrarForm
                    opcion={opcion}
                    opciones={opciones}
                    onCancel={() => setEditando(null)}
                    onSave={(nombre) =>
                      guardar.mutate(
                        { id: opcion.id, cambios: { nombre } },
                        { onSuccess: () => setEditando(null), onError: falla('renombrar la opción') },
                      )
                    }
                    saving={guardar.isPending && guardar.variables?.id === opcion.id}
                  />
                ) : (
                  <>
                    <span className="min-w-0 flex-1 break-words" translate="no">
                      {conColor ? (
                        <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', opcion.color && tintClass[opcion.color])}>
                          {opcion.nombre}
                        </span>
                      ) : opcion.nombre}
                    </span>
                    {conColor && (
                      <ColorSelect
                        nombre={opcion.nombre}
                        value={opcion.color ?? 'sky'}
                        onChange={(color) => guardar.mutate({ id: opcion.id, cambios: { color } }, { onError: falla('cambiar el color') })}
                      />
                    )}
                    <div className="flex shrink-0">
                      <IconButton label={`Subir ${opcion.nombre}`} disabled={index === 0 || ordenar.isPending} onClick={() => mover(index, -1)}>
                        <ArrowUp />
                      </IconButton>
                      <IconButton label={`Bajar ${opcion.nombre}`} disabled={index === activas.length - 1 || ordenar.isPending} onClick={() => mover(index, 1)}>
                        <ArrowDown />
                      </IconButton>
                      <IconButton label={`Renombrar ${opcion.nombre}`} onClick={() => setEditando(opcion.id)}>
                        <Pencil />
                      </IconButton>
                      <IconButton label={`Archivar ${opcion.nombre}`} onClick={() => archivar(opcion, false)}>
                        <Archive />
                      </IconButton>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {archivadas.length > 0 && (
          <details className="group mt-4 rounded-lg border bg-muted/30">
            <summary className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Archivadas ({archivadas.length})
            </summary>
            <p className="px-3 text-sm text-muted-foreground">
              No aparecen en los formularios. Los registros que las usan las conservan.
            </p>
            <ul className="divide-y px-3 pb-1" aria-label={`${titulo} archivadas`}>
              {archivadas.map((opcion) => (
                <li key={opcion.id} className="flex min-h-12 items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground" translate="no">{opcion.nombre}</span>
                  <IconButton label={`Restaurar ${opcion.nombre}`} onClick={() => archivar(opcion, true)}>
                    <ArchiveRestore />
                  </IconButton>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Borrar ${opcion.nombre}`} title={`Borrar ${opcion.nombre}`} className="text-muted-foreground hover:text-destructive">
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Borrar "{opcion.nombre}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Solo se puede borrar si ningún registro la usa. Si está en uso, queda archivada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBorrar(opcion)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Borrar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </section>
  );
};

const IconButton = ({ label, ...props }: { label: string } & ComponentProps<typeof Button>) => (
  <Button variant="ghost" size="icon" aria-label={label} title={label} className="text-muted-foreground" {...props} />
);

const RenombrarForm = ({
  opcion,
  opciones,
  onSave,
  onCancel,
  saving,
}: {
  opcion: Opcion;
  opciones: Opcion[];
  onSave: (nombre: string) => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const [nombre, setNombre] = useState(opcion.nombre);
  const [error, setError] = useState<string | null>(null);
  const inputId = `renombrar-${opcion.id}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio === opcion.nombre) return onCancel();
    const mensaje = validarNombre(limpio, opciones, opcion);
    setError(mensaje);
    if (!mensaje) onSave(limpio);
  };

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 items-start gap-1" noValidate>
      <div className="min-w-0 flex-1">
        <Input
          id={inputId}
          aria-label={`Nuevo nombre para ${opcion.nombre}`}
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          autoFocus
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-ayuda`}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-destructive" role="alert">{error}</p>
        ) : (
          <p id={`${inputId}-ayuda`} className="mt-1.5 text-xs text-muted-foreground">Se actualiza en todos los registros que la usan.</p>
        )}
      </div>
      <Button type="submit" variant="ghost" size="icon" aria-label="Guardar nombre" title="Guardar nombre" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Cancelar" title="Cancelar" onClick={onCancel}>
        <X aria-hidden="true" />
      </Button>
    </form>
  );
};

const ColorSelect = ({ nombre, value, onChange }: { nombre: string; value: Tint; onChange: (color: Tint) => void }) => (
  <Select value={value} onValueChange={(color) => onChange(color as Tint)}>
    <SelectTrigger aria-label={`Color de ${nombre}`} className="h-9 w-auto shrink-0 gap-2 sm:w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {TINTS.map((tint) => (
        <SelectItem key={tint} value={tint}>
          <span className="flex items-center gap-2">
            <span className={cn('size-3 rounded-full ring-1 ring-inset ring-foreground/15', tintClass[tint])} aria-hidden="true" />
            <span className="max-sm:sr-only">{tintLabel[tint]}</span>
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
