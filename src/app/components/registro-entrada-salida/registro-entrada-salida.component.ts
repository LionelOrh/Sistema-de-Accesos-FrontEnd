import { Component, OnInit } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { preRegistroConsultaDTO } from '../../models/PreRegistroConsultaDTO.model';
import { AccesoService } from '../../services/acceso.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent, ReactiveFormsModule],
  
  selector: 'app-registro-entrada-salida',
  templateUrl: './registro-entrada-salida.component.html',
  styleUrls: ['./registro-entrada-salida.component.css']
})


export class RegistrarEntradaSalidaComponent {
  codigoBusqueda: string = ''; // Campo de búsqueda
  resultado: preRegistroConsultaDTO | null = null; // Resultado de la consulta

  constructor(private accesoService: AccesoService) {}

  // Método para buscar datos
  buscarPorCodigo() {
    this.accesoService.consultaPreRegistro(this.codigoBusqueda).subscribe({
      
      next: (data) => {
        console.log('Foto recibida:', data.foto); // Verificar la URL recibida
        this.resultado = data; // Carga los datos obtenidos
      },
      error: () => {
        this.mostrarAlertaError();
      },
    });
  }

  // Mostrar alerta de error
  mostrarAlertaError() {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se encontró ningún resultado para el código ingresado.',
      confirmButtonText: 'OK',
    }).then(() => {
      this.limpiarCampos(); // Limpiar los campos al cerrar la alerta
    });
  }

  // Limpiar los campos
  limpiarCampos() {
    this.resultado = null;
    this.codigoBusqueda = '';
  }
}