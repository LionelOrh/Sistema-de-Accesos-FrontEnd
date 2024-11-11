import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { AppMaterialModule } from '../../app.material.module';
import { UtilService } from '../../services/util.service';
import { AccesoService } from '../../services/acceso.service';
import { MatPaginator } from '@angular/material/paginator';
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
  
  mostrarInternos = true;  // Inicia mostrando la sección "Internos y Externos"
  mostrarRepresentante = false; // Inicia ocultando la sección "Representantes"
  
  // Función para mostrar "Internos y Externos"
  mostrarInternosExternos() {
    this.mostrarInternos = true;  // Muestra la sección "Internos y Externos"
    this.mostrarRepresentante = false;  // Oculta la sección "Representantes"
  }

  // Función para mostrar "Representantes"
  mostrarRepresentantes() {
    this.mostrarInternos = false;  // Oculta la sección "Internos y Externos"
    this.mostrarRepresentante = true;  // Muestra la sección "Representantes"
  }

  // Grilla
  dataSource: any;
  dataSourceRepresentante: any;

  // Clase para la paginación
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild('paginator2', { static: true }) paginatorRepresentante!: MatPaginator;

  // Cabecera
  displayedColumns = ["login", "nombres", "apellidos", "numDoc", "fecha", "hora", "estado"];
  displayedColumnsRepresentante = ["nombres", "apellidos", "cargo", "numDoc", "proveedor"];

  // Interno y externo
  varLogin: string = "";
  varNumDoc: string = "";
  varNumDocRe: string = "";
  varEstado: number = -1; // -1 para no filtrar, 0 para ingreso, 1 para salida
  varFechaAccesoDesde: Date = new Date(2024, 0, 1);
  varFechaAccesoHasta: Date = new Date();

  constructor(private utilService: UtilService, private accesoService: AccesoService) { }

  ngOnInit() {

  }

  // Función para formatear las fechas a 'YYYY-MM-DD'
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
    console.log(">>> varEstado: " + this.varEstado);
    console.log(">>> varNumDoc: " + this.varNumDoc);

    this.accesoService.consultaReporteAccesos(
      this.varLogin,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta),
      this.varEstado,
      this.varNumDoc
    ).subscribe(
      response => {
        console.log("Data recibida: ", response);
        // Convertir estado numérico a texto para mostrar en la tabla
        const transformedResponse = response.map((item: any) => ({
          ...item,
          estado: item.estado === 0 ? 'Ingreso' : 'Salida'
        }));
        this.dataSource = new MatTableDataSource(transformedResponse);
        this.dataSource.paginator = this.paginator;
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
    console.log(">>> varNumDocRe: " + this.varNumDocRe);

    this.accesoService.consultaReporteRepresentante(this.varNumDocRe).subscribe(
      response => {
        console.log("Data recibida: ", response);
        this.dataSourceRepresentante = new MatTableDataSource(response.data || response);
        this.dataSourceRepresentante.paginator = this.paginatorRepresentante;
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
    console.log(">>> Exportar Excel");
    console.log(">>> varLogin: " + this.varLogin);
    console.log(">>> varFechaDesde: " + this.formatDate(this.varFechaAccesoDesde));
    console.log(">>> varFechaHasta: " + this.formatDate(this.varFechaAccesoHasta));
    console.log(">>> varEstado: " + this.varEstado);
    console.log(">>> varNumDoc: " + this.varNumDoc);

    this.accesoService.generateDocumentExcel(
      this.varLogin,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta),
      this.varEstado,
      this.varNumDoc
    ).subscribe(
      response => {
        console.log(response);
        var url = window.URL.createObjectURL(response.data);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = response.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    );
  }

  exportarExcelRepresentante() {
    console.log(">>> Exportar Excel Representante");
    console.log(">>> varNumDocRe: " + this.varNumDocRe);

    this.accesoService.generateDocumentExcelRepresentante(this.varNumDocRe).subscribe(
      response => {
        console.log(response);
        var url = window.URL.createObjectURL(response.data);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = response.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    );
  }
}
