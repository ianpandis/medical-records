import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContent, PageHeader } from '@/components/AppShell';
import { CatalogoEditor } from '@/components/CatalogoEditor';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { CATALOGO_KEYS } from '@/lib/catalogos';

const Listas = () => {
  const { hash } = useLocation();

  // Desde el aviso de lista vacía de un formulario (/listas#localidades): ir directo a cargarla
  useEffect(() => {
    const catalogo = hash.slice(1);
    if (!catalogo) return;
    document.getElementById(catalogo)?.scrollIntoView();
    document.getElementById(`${catalogo}-nuevo`)?.focus({ preventScroll: true });
  }, [hash]);

  return (
    <>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Listas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent>
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Listas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Las opciones de los formularios y los filtros. Archivá las que ya no usás: los registros que las tienen las conservan.
            </p>
          </div>
          {CATALOGO_KEYS.map((catalogo) => (
            <CatalogoEditor key={catalogo} catalogo={catalogo} />
          ))}
        </div>
      </PageContent>
    </>
  );
};

export default Listas;
