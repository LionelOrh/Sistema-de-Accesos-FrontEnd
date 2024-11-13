import { Component, OnInit } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { preRegistroConsultaDTO } from '../../models/preRegistroConsultaDTO.model';
import { AccesoService } from '../../services/acceso.service';
import Swal from 'sweetalert2';
import { Acceso } from '../../models/acceso.model';
import { TokenService } from '../../security/token.service';
import { Usuario } from '../../models/usuario.model';

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

  objUsuario: Usuario = {};
  constructor(private accesoService: AccesoService, private tokenService: TokenService) {
    this.objUsuario.idUsuario = this.tokenService.getUserId();
  }

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
  
  registrarAcceso() {
    if (this.resultado && this.resultado.id && this.resultado.tipo) {
      const registroAcceso: Acceso = {
        idUsuario: this.resultado.tipo === 'usuario' ? this.resultado.id : undefined,
        idRepresentante: this.resultado.tipo === 'representante' ? this.resultado.id : undefined,
        idUsuarioRegAcceso: Number(this.objUsuario.idUsuario),
      };
  
      // Mostrar alerta de "Registrando..."
      Swal.fire({
        title: 'Registrando...',
        text: 'Por favor, espera mientras se realiza el registro.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(); // Mostrar animación de carga
        },
      });
  
      this.accesoService.registrarAcceso(registroAcceso).subscribe({
        next: (response) => {
          console.log('Respuesta exitosa del backend:', response);
          Swal.close(); // Cerrar la alerta de carga
          Swal.fire('Registro Exitoso', 'El registro se ha realizado correctamente.', 'success');
          this.limpiarCampos();
        },
        error: (error) => {
          console.error('Error capturado en el frontend:', error);
          Swal.close(); // Cerrar la alerta de carga
          Swal.fire('Error', 'No se pudo realizar el registro.', 'error');
          this.limpiarCampos();
        },
      });
    } else {
      Swal.fire('Error', 'Los datos de la consulta no son válidos.', 'error');
      this.limpiarCampos();
    }
  }
  
}