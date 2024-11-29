import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { preRegistroConsultaDTO } from '../../models/preRegistroConsultaDTO.model';
import { AccesoService } from '../../services/acceso.service';
import Swal from 'sweetalert2';
import { Acceso } from '../../models/acceso.model';
import { TokenService } from '../../security/token.service';
import { Usuario } from '../../models/usuario.model';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Howl } from 'howler';

@Component({
  standalone: true,
  imports: [
    AppMaterialModule,
    FormsModule,
    CommonModule,
    MenuComponent,
    ReactiveFormsModule,
    ZXingScannerModule,
  ],
  selector: 'app-registro-entrada-salida',
  templateUrl: './registro-entrada-salida.component.html',
  styleUrls: ['./registro-entrada-salida.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistrarEntradaSalidaComponent {
  codigoBusqueda: string = ''; // Campo de búsqueda
  isScannerVisible: boolean = false; // Escáner visible
  formats: BarcodeFormat[] = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ];
  resultado: preRegistroConsultaDTO | null = null; // Resultado de la consulta
  objUsuario: Usuario = {};
  botonesHabilitados: boolean = false; // Control para habilitar/deshabilitar botones
  isInputValid = true; // Para verificar si los campos son válidos
  showAlert = false; // Para mostrar la alerta flotante
  alertMessage = ''; // Mensaje que se mostrará en la alerta flotante

  constructor(
    private accesoService: AccesoService,
    private tokenService: TokenService
  ) {
    this.objUsuario.idUsuario = this.tokenService.getUserId(); // Obtiene el ID del usuario autenticado
  }

  validarCaracteresEspeciales(): boolean {
    // Si el campo está vacío, no se muestra la alerta
    if (this.codigoBusqueda.trim() === '') {
      this.showAlert = false; // Ocultar alerta si el campo está vacío
      return true; // No se valida si está vacío
    }

    // Regex para el formato del código ingresado (por ejemplo, alfanumérico de longitud específica)
    const formatoCodigo = /^([0-9]{8}|[a-zA-Z0-9]{9,12}|[a-zA-Z0-9]{9}|[0-9]{9})$/;

    // Verificar si el código sigue el formato esperado
    if (formatoCodigo.test(this.codigoBusqueda)) {
      this.isInputValid = true; // Actualiza el estado de validez
      this.alertMessage = ''; // Limpia el mensaje de alerta
      this.showAlert = false; // Oculta la alerta si el código es válido
      return true; // El código es válido
    } else {
      this.isInputValid = false; // Actualiza el estado de validez
      this.alertMessage = 'Formato de código incorrecto'; // Mensaje de formato incorrecto
      this.showAlert = true; // Muestra la alerta flotante si el código es inválido
      return false; // Detiene la ejecución si no sigue el formato esperado
    }
  }



  // Buscar datos por código ingresado
  buscarPorCodigo() {
    if (this.validarCaracteresEspeciales()) {
      Swal.fire({
        title: 'Buscando...',
        text: 'Por favor, espera mientras procesamos tu solicitud.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.accesoService.consultaPreRegistro(this.codigoBusqueda).subscribe({
        next: (data) => {
          Swal.close();
          if (data) {
            console.log('Datos recibidos:', data);
            this.resultado = data;
            this.botonesHabilitados = true;
          } else {
            this.mostrarAlertaError('No se encontraron registros con este código.');
          }
        },
        error: (error) => {
          Swal.close();
          console.error('Error en la consulta:', error);
          this.mostrarAlertaError('Ocurrió un error al buscar los datos.');
        },
      });
    } else {
      this.validarCaracteresEspeciales();
    }
  }



  // Mostrar alerta de error
  mostrarAlertaError(mensaje: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonText: 'OK',
    }).then(() => {
      this.limpiarCampos();
    });
  }

  // Alternar visibilidad del escáner
  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  // Manejar el código escaneado
  onCodeScanned(code: string) {
    this.playBeep();
    this.codigoBusqueda = code;
    this.buscarPorCodigo();
    this.isScannerVisible = false;
  }

  // Reproducir sonido de escaneo
  playBeep() {
    const beep = new Howl({
      src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
      volume: 1.0,
    });
    beep.play();
  }

  // Limpiar los campos y deshabilitar botones
  limpiarCampos() {
    this.resultado = null;
    this.codigoBusqueda = '';
    this.botonesHabilitados = false;  // Deshabilitar los botones
  }

  // Registrar acceso
  registrarAcceso() {
    if (this.resultado && this.resultado.id && this.resultado.tipo) {
      const registroAcceso: Acceso = {
        idUsuario:
          this.resultado.tipo === 'usuario' ? this.resultado.id : undefined,
        idRepresentante:
          this.resultado.tipo === 'representante' ? this.resultado.id : undefined,
        idUsuarioRegAcceso: Number(this.objUsuario.idUsuario),
      };

      Swal.fire({
        title: 'Registrando...',
        text: 'Por favor, espera.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.accesoService.registrarAcceso(registroAcceso).subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Registro Exitoso',
            'El registro se realizó correctamente.',
            'success'
          );
          this.limpiarCampos();
        },
        error: () => {
          Swal.close();
          Swal.fire('Error', 'No se pudo registrar.', 'error');
          this.limpiarCampos();
        },
      });
    } else {
      Swal.fire('Error', 'Datos de consulta inválidos.', 'error');
      this.limpiarCampos();
    }
  }
}