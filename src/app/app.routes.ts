import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { IndexComponent } from './index/index.component';


import { RegistrarExternoComponent } from './components/registrar-invitado/registrar-invitado.component';
import { ConsultaReporteComponent } from './components/consulta-reporte/consulta-reporte.component';
import { AccesoProveedorComponent } from './components/acceso-proveedores/acceso-proveedores.component';
import { RegistrarEntradaSalidaComponent } from './components/registro-entrada-salida/registro-entrada-salida.component';



export const routes: Routes = [
    {path:"verRegistroEntradaSalida", component:RegistrarEntradaSalidaComponent }, 
    {path:"verRegistroVisitante", component:RegistrarExternoComponent },
    {path:"verConsultaReportes", component:ConsultaReporteComponent },
    {path:"verRegistroProveedor", component:AccesoProveedorComponent },
    
    { path: '', component: IndexComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '', pathMatch: 'full' }
  ];
  
