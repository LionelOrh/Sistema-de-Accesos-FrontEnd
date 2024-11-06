import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { AppMaterialModule } from '../../app.material.module';
import { Rol } from '../../models/rol.model';
import { Acceso } from '../../models/acceso.model';
import { Usuario } from '../../models/usuario.model';
import { UtilService } from '../../services/util.service';
import { TokenService } from '../../security/token.service';
import { AccesoService } from '../../services/acceso.service';
import { MatPaginator } from '@angular/material/paginator';
import { TipoAcceso } from '../../models/tipoAcceso.model';

import { MatTableDataSource } from '@angular/material/table';

@Component({
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent, ReactiveFormsModule],

  selector: 'app-consulta-reporte',
  templateUrl: './consulta-reporte.component.html',
  styleUrls: ['./consulta-reporte.component.css']
})

export class ConsultaReporteComponent implements OnInit {
  //grilla
  dataSource: any;
  //Clase para la paginacion
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  //Cabecera
  displayedColumns = ["login", "nombres", "apellidos", "fecha", "hora", "tipoAcceso"];

  //Para el combobox
  lstTipoAcceso: TipoAcceso[] = [];
 
  varLogin: string = " ";
  varTipoAcceso: number = -1;
  varFechaAccesoDesde: Date = new Date(2024, 0, 1);
  varFechaAccesoHasta: Date = new Date();

  constructor(private utilService: UtilService, private accesoService: AccesoService) { }

  ngOnInit() {
    this.utilService.listaTipoAcceso().subscribe(
      x => this.lstTipoAcceso = x
    );
  }

   // Función para formatear las fechas a 'YYYY-MM-DD'
   formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Separa solo la parte de la fecha
  }

  filtrar() {
    console.log(">>> Filtrar [ini]");
    console.log(">>> varLogin: " + this.varLogin);
     console.log(">>> varFechaDesde: " + this.formatDate(this.varFechaAccesoDesde));
    console.log(">>> varFechaHasta: " + this.formatDate(this.varFechaAccesoHasta));
    console.log(">>> varTipoAcceso: " + this.varTipoAcceso);
  
    this.accesoService.consultaReporteAccesos(
      this.varLogin,
      this.varFechaAccesoDesde.toISOString().split('T')[0],
      this.varFechaAccesoHasta.toISOString().split('T')[0],
      this.varTipoAcceso
    ).subscribe(
      x => {
        console.log("Data recibida: ", x); // Para asegurarte de que recibes datos
        this.dataSource = new MatTableDataSource(x.data || x);
        this.dataSource.paginator = this.paginator;
      }
    );
    
  }

}