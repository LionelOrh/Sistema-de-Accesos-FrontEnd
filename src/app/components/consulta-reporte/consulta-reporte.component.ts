import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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

  mostrarInternos = true;
  mostrarRepresentante = false;

  // Función para mostrar "Internos y Externos"
  mostrarInternosExternos() {
    this.mostrarInternos = true;
    this.mostrarRepresentante = false;
  }

  // Función para mostrar "Representantes"
  mostrarRepresentantes() {
    this.mostrarInternos = false;
    this.mostrarRepresentante = true;
  }

  // Grilla
  dataSource: any;
  dataSourceRepresentante: any;

  // Clase para la paginación
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  @ViewChild('paginator2', { static: false }) paginatorRepresentante!: MatPaginator;

  // Cabecera
  displayedColumns = ["login", "nombres", "apellidos", "numDoc", "fecha", "hora", "estado"];
  displayedColumnsRepresentante = ["nombre", "apellido", "cargo", "numDocs", "proveedor", "fechas", "horas", "estados"];

  // Interno y externo
  // Variables
  varLoginOrNumDoc: string = "";
  varNumDocRe: string = "";
  varFechaAccesoDesde: Date = new Date(2024, 0, 1);
  varFechaAccesoHasta: Date = new Date();
  varFechaAccesoDesdeR: Date = new Date(2024, 0, 1);
  varFechaAccesoHastaR: Date = new Date();

  //Validación en los campos de Login/NroDoc y NroDoc
  allowLettersAndNumbers(event: KeyboardEvent): void {
    const regex = /^[a-zA-Z0-9]+$/;
    const input = String.fromCharCode(event.keyCode || event.which);
    if (!regex.test(input)) {
      event.preventDefault();
    }
  }

  // Método para actualizar dinámicamente la fecha máxima
  maxDate: Date = new Date();
  updateMaxDate(): void {
    this.maxDate = new Date();
  }

  constructor(private utilService: UtilService, private accesoService: AccesoService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.updateMaxDate();
  }

  // Función para formatear las fechas a 'YYYY-MM-DD'
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  validarFechas() {
    if (this.varFechaAccesoDesde > this.varFechaAccesoHasta) {
      Swal.fire({
        title: 'Error',
        text: 'La fecha "Desde" no puede ser mayor que la fecha "Hasta".',
        icon: 'error',
        showConfirmButton: true
      });
      return false;
    }
    return true;
  }

 
  async filtrar() {
    if (!this.validarFechas()) return;

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

    this.accesoService.consultaReporteAccesos(
      this.varLoginOrNumDoc,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta)
    ).subscribe(
      response => {
        Swal.close();

        if (response.length === 0) {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontraron resultados con los criterios ingresados',
            icon: 'warning',
            showConfirmButton: true
          });

          // Asignamos un array vacío a dataSourceRepresentante y forzamos la detección de cambios
          this.dataSource = new MatTableDataSource([]);
          this.cdr.detectChanges();  // Forzamos la detección de cambios
        } else {
          console.log("Data recibida: ", response);
          this.dataSource = new MatTableDataSource(response.data || response);
          this.dataSource.paginator = this.paginator;
          this.cdr.detectChanges();  // Forzamos la detección de cambios
        }
      },
      error => {
        Swal.close();
        console.error("Error al consultar los accesos:", error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al procesar su solicitud.',
          icon: 'error',
          showConfirmButton: true
        });
      }
    );
  }

  async filtrarRepresentante() {
    if (!this.validarFechas()) return;

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

    console.log(">>> Filtrar Representante [ini]");
    console.log(">>> varNumDocRe: " + this.varNumDocRe);

    this.accesoService.consultaReporteRepresentante(
      this.varNumDocRe,
      this.formatDate(this.varFechaAccesoDesdeR),
      this.formatDate(this.varFechaAccesoHastaR)
    ).subscribe(
      response => {
        Swal.close();

        if (response.length === 0) {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontraron resultados con los criterios ingresados',
            icon: 'warning',
            showConfirmButton: true
          });

          // Asignamos un array vacío a dataSourceRepresentante y forzamos la detección de cambios
          this.dataSourceRepresentante = new MatTableDataSource([]);
          this.cdr.detectChanges();  // Forzamos la detección de cambios
        } else {
          console.log("Data recibida: ", response);
          this.dataSourceRepresentante = new MatTableDataSource(response.data || response);
          this.dataSourceRepresentante.paginator = this.paginatorRepresentante;
          this.cdr.detectChanges();  // Forzamos la detección de cambios
        }
      },
      error => {
        Swal.close();
        console.error("Error al consultar los representantes:", error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al procesar su solicitud.',
          icon: 'error',
          showConfirmButton: true
        });
      }
    );
  }

  exportarExcel() {
    console.log(">>> Exportar Excel");
    console.log(">>> varLogin: " + this.varLoginOrNumDoc);
    console.log(">>> varFechaDesde: " + this.formatDate(this.varFechaAccesoDesde));
    console.log(">>> varFechaHasta: " + this.formatDate(this.varFechaAccesoHasta));

    this.accesoService.generateDocumentExcel(
      this.varLoginOrNumDoc,
      this.formatDate(this.varFechaAccesoDesde),
      this.formatDate(this.varFechaAccesoHasta)
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

    this.accesoService.generateDocumentExcelRepresentante(this.varNumDocRe, this.formatDate(this.varFechaAccesoDesdeR), this.formatDate(this.varFechaAccesoHastaR))
      .subscribe(
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
