import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { AppMaterialModule } from '../../app.material.module';
import { UtilService } from '../../services/util.service';
import { AccesoService } from '../../services/acceso.service';
import { MatPaginator } from '@angular/material/paginator';
import { TipoAcceso } from '../../models/tipoAcceso.model';

import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';

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
  dataSourceRepresentante: any;

  //Clase para la paginacion
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatPaginator, { static: true }) paginatorRepresentante!: MatPaginator;

  //Cabecera
  displayedColumns = ["login", "nombres", "apellidos", "numDoc", "fecha", "hora", "tipoAcceso"];
  displayedColumnsRepresentante = ["nombres", "apellidos", "cargo", "numDoc","proveedor"];

  //Para el combobox
  lstTipoAcceso: TipoAcceso[] = [];
 
  //interno y externo
  varLogin: string = "";
  varNumDoc: string = "";
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

  async filtrar() {
    Swal.fire({
      title: 'Procesando',
      text: 'Por favor espere...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    console.log(">>> Filtrar [ini]");
    console.log(">>> varLogin: " + this.varLogin);
    console.log(">>> varFechaDesde: " + this.formatDate(this.varFechaAccesoDesde));
    console.log(">>> varFechaHasta: " + this.formatDate(this.varFechaAccesoHasta));
    console.log(">>> varTipoAcceso: " + this.varTipoAcceso);
    console.log(">>> varNumDoc: " + this.varNumDoc);
  
    this.accesoService.consultaReporteAccesos(
      this.varLogin,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta),
      this.varTipoAcceso,
      this.varNumDoc
    ).subscribe(
      response => {
        console.log("Data recibida: ", response);
        this.dataSource = new MatTableDataSource(response.data || response);
        this.dataSource.paginator = this.paginator;  // Esto es importante para vincular el paginador con el dataSource
        Swal.close();
      },
      error => {
        console.error("Error al consultar los accesos:", error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al procesar su solicitud.',
          icon: 'error'
        });
      }
    );
  }
  
  //representante
  async filtrarRepresentante() {
    Swal.fire({
      title: 'Procesando',
      text: 'Por favor espere...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    console.log(">>> Filtrar [ini]");
    console.log(">>> varNumDoc: " + this.varNumDoc);

  
    this.accesoService.consultaReporteRepresentante(
      this.varNumDoc,
      
    ).subscribe(
      response => {
        console.log("Data recibida: ", response);
        this.dataSourceRepresentante = new MatTableDataSource(response.data || response);
        this.dataSourceRepresentante.paginator = this.paginatorRepresentante;  // Esto es importante para vincular el paginador con el dataSource
        Swal.close();

      },
      error => {
        console.error("Error al consultar los accesos:", error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al procesar su solicitud.',
          icon: 'error'
        });
      }
    );
  }
  

  exportarExcel() {
    console.log(">>> Filtrar [ini]");
    console.log(">>> varLogin: " + this.varLogin);
    console.log(">>> varFechaDesde: " + this.formatDate(this.varFechaAccesoDesde));
    console.log(">>> varFechaHasta: " + this.formatDate(this.varFechaAccesoHasta));
    console.log(">>> varTipoAcceso: " + this.varTipoAcceso);
    console.log(">>> varNumDoc: " + this.varNumDoc);
    
    this.accesoService.generateDocumentExcel( 
      this.varLogin,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta),
      this.varTipoAcceso,
      this.varNumDoc
    ).subscribe(
      response => {
        console.log(response);
        var url = window.URL.createObjectURL(response.data);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.setAttribute('target', 'blank');
        a.href = url;
        a.download = response.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }); 
}

exportarExcelRepresentante() {
  console.log(">>> Filtrar [ini]");
  console.log(">>> varNumDoc: " + this.varNumDoc);
  
  this.accesoService.generateDocumentExcelRepresentante( 
    this.varNumDoc
  ).subscribe(
    response => {
      console.log(response);
      var url = window.URL.createObjectURL(response.data);
      var a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.setAttribute('target', 'blank');
      a.href = url;
      a.download = response.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
  }); 
}

}