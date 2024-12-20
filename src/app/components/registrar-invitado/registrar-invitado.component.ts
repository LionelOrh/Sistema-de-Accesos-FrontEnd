import { Component } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { TipoDocumento } from '../../models/tipoDocumento.model';
import { UtilService } from '../../services/util.service';
import { InvitadoService } from '../../services/invitado.service';
import { TokenService } from '../../security/token.service';
import { Usuario } from '../../models/usuario.model';
import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent, ReactiveFormsModule, MatButtonModule, MatIconModule],
  selector: 'app-registrar-externo',
  templateUrl: './registrar-invitado.component.html',
  styleUrls: ['./registrar-invitado.component.css']
})
export class RegistrarExternoComponent {
  lstTipoDoc: TipoDocumento[] = [];
  formRegistra: FormGroup;
  objUsuario = { idUsuario: 0 };
  longitudMaximaDocumento: number = 8; // Longitud inicial para DNI

  botonBuscarHabilitado: boolean = true;
  botonLimpiarHabilitado: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private invitadoService: InvitadoService,
    private utilService: UtilService,
  ) {
    // Cargar lista de tipos de documento
    this.utilService.listaTipoDocumento().subscribe(
      tipos => this.lstTipoDoc = tipos
    );

    // Inicializar formulario
    this.formRegistra = this.formBuilder.group({
      validaNombre: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$'), this.validarEspacios(),
      this.validarTresLetrasRepetidas()]],
      validaApellido: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$'), this.validarEspacios(),
      this.validarTresLetrasRepetidas()]],
      validaCelular: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^9[0-9]{8}$')]],
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],
      validaNumeroDocumento: ['', [Validators.required, this.validarTipoDocumentoAntesDeEscribir()]],
      validaCorreo: [{ value: '', disabled: true }, [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_-]+@[a-zA-Z]+\\.[a-zA-Z]{3,}$'), // Validación actualizada
        this.validarEspacios()
      ]],
      validaMotivo: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(15), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s.,]*$'), this.validarEspacios(),
      this.validarTresLetrasRepetidas()]],
    }, { validators: this.validarFormularioCompleto });

    // Forzar que el formulario sea inválido inicialmente
    this.formRegistra.updateValueAndValidity();

    this.formRegistra.get('validaTipoDocumento')?.valueChanges.subscribe((tipoDoc) => {
      const numeroDocumentoControl = this.formRegistra.get('validaNumeroDocumento');
      if (!numeroDocumentoControl) return;

      const numeroActual = numeroDocumentoControl.value; // Preservar el valor actual

      // Actualizar validadores basados en el tipo de documento seleccionado
      numeroDocumentoControl.clearValidators();
      switch (tipoDoc) {
        case 1: // DNI
          this.longitudMaximaDocumento = 8;
          numeroDocumentoControl.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
        case 2: // Pasaporte
          this.longitudMaximaDocumento = 12;
          numeroDocumentoControl.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
        case 3: // Carnet de Extranjería
          this.longitudMaximaDocumento = 9;
          numeroDocumentoControl.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
        default:
          this.longitudMaximaDocumento = 9; // Valor por defecto
          numeroDocumentoControl.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
      }

      // Validar si el valor actual sigue siendo válido con el nuevo tipo
      numeroDocumentoControl.updateValueAndValidity();
      if (numeroDocumentoControl.invalid) {
        // Si no es válido, limpiar el valor
        numeroDocumentoControl.setValue('');
      } else {
        // Si es válido, mantener el valor actual
        numeroDocumentoControl.setValue(numeroActual);
      }
    });
  }

  validarFormularioCompleto: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
    const nombres = form.get('validaNombre');
    const apellidos = form.get('validaApellido');
    const celular = form.get('validaCelular');
    const correo = form.get('validaCorreo');
    const motivo = form.get('validaMotivo');

    // Verificar que los campos deshabilitados también tengan valores
    const camposIncompletos = [nombres, apellidos, celular, correo, motivo].some(
      (control) => !control?.value || control.invalid
    );

    return camposIncompletos ? { formularioIncompleto: true } : null;
  };

  validarEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null; // Si no hay valor, no validamos

      const value = control.value.trim(); // Elimina espacios al inicio y al final
      if (/ {2,}/.test(value)) { // Si hay espacios consecutivos
        return { espaciosConsecutivos: 'No se permiten espacios consecutivos' };
      }
      if (value !== control.value) { // Si el valor tiene espacios al inicio o al final
        return { espaciosInnecesarios: 'No debe empezar ni terminar con espacios' };
      }

      return null;
    };
  }

  buscar() {
    const tipoDocControl = this.formRegistra.get('validaTipoDocumento');
    const numDocControl = this.formRegistra.get('validaNumeroDocumento');

    // Marcar los controles como tocados para activar mensajes de error
    tipoDocControl?.markAsTouched();
    tipoDocControl?.updateValueAndValidity();
    numDocControl?.markAsTouched();
    numDocControl?.updateValueAndValidity();

    const tipoDoc = tipoDocControl?.value;
    const numDoc = numDocControl?.value;

    // Validar ambos campos y mostrar un mensaje combinado si faltan ambos
    if (tipoDoc === -1 && !numDoc) {
      Swal.fire('Error', 'Debe seleccionar un tipo de documento y completar el número de documento.', 'warning');
      return;
    }

    // Validar individualmente y mostrar mensajes separados si aplica
    if (tipoDoc === -1) {
      Swal.fire('Error', 'Debe seleccionar un tipo de documento.', 'warning');
      return;
    }

    if (!numDoc) {
      Swal.fire('Error', 'Debe ingresar un número de documento válido', 'warning');
      return;
    }

    Swal.fire({
      title: 'Buscando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    this.invitadoService.buscarUsuario(numDoc).subscribe(
      (response) => {
        Swal.close();

        // Llenar los campos con los datos encontrados
        this.formRegistra.patchValue({
          validaNombre: response.nombres,
          validaApellido: response.apellidos,
          validaCelular: response.celular,
          validaCorreo: response.correo,
          validaTipoDocumento: response.idTipoDoc,
        });

        this.objUsuario.idUsuario = response.idUsuario;



        // Configurar el estado de los campos
        this.formRegistra.get('validaTipoDocumento')?.disable(); // Habilitar tipo de documento
        this.formRegistra.get('validaNumeroDocumento')?.disable(); // Habilitar número de documento

        // Deshabilitar los datos personales encontrados
        this.formRegistra.get('validaNombre')?.disable();
        this.formRegistra.get('validaApellido')?.disable();
        this.formRegistra.get('validaCelular')?.disable();
        this.formRegistra.get('validaCorreo')?.disable();

        // Motivo siempre habilitado
        this.formRegistra.get('validaMotivo')?.enable();

        this.botonBuscarHabilitado = false;
        this.botonLimpiarHabilitado = true;

        // Forzar revalidación del formulario
        this.formRegistra.updateValueAndValidity();
      },
      () => {
        Swal.close();
        Swal.fire({
          title: 'Usuario no encontrado',
          text: 'Puede registrar uno nuevo.',
          icon: 'info',
          confirmButtonText: 'Registrar',
        });

        // Mantener Tipo de Documento y Número de Documento con sus valores actuales
        const tipoDocumentoActual = this.formRegistra.value.validaTipoDocumento;
        const numeroDocumentoActual = this.formRegistra.value.validaNumeroDocumento;

        // Limpiar los campos de datos personales y motivo
        this.formRegistra.patchValue({
          validaNombre: '',
          validaApellido: '',
          validaCelular: '',
          validaCorreo: '',
          validaMotivo: '',
        });

        this.formRegistra.get('validaNombre')?.enable();
        this.formRegistra.get('validaApellido')?.enable();
        this.formRegistra.get('validaCelular')?.enable();
        this.formRegistra.get('validaCorreo')?.enable();
        this.formRegistra.get('validaMotivo')?.enable();

        this.formRegistra.patchValue({
          validaTipoDocumento: tipoDocumentoActual,
          validaNumeroDocumento: numeroDocumentoActual,
        });
        this.formRegistra.get('validaTipoDocumento')?.disable(); // Mantener tipo de documento deshabilitado
        this.formRegistra.get('validaNumeroDocumento')?.disable(); // Mantener número de documento deshabilitado

        this.objUsuario.idUsuario = 0;
        // Forzar revalidación del formulario
        this.formRegistra.updateValueAndValidity();
        this.botonBuscarHabilitado = false;
        this.botonLimpiarHabilitado = true;
      }
    );
  }




  registra() {
    if (this.formRegistra.invalid) {
      Swal.fire('Error', 'Complete todos los campos correctamente.', 'warning');
      return;
    }

    const data = this.objUsuario.idUsuario
      ? { usuario: { idUsuario: this.objUsuario.idUsuario }, motivo: this.formRegistra.value.validaMotivo }
      : {
        usuario: {
          nombres: this.formRegistra.value.validaNombre,
          apellidos: this.formRegistra.value.validaApellido,
          celular: this.formRegistra.value.validaCelular,
          correo: this.formRegistra.value.validaCorreo,
          numDoc: this.formRegistra.get('validaNumeroDocumento')?.value, // Asegúrate de tomar el valor correctamente
          tipodocumento: { idTipoDoc: this.formRegistra.get('validaTipoDocumento')?.value } // Asegúrate de tomar el valor correctamente
        },
        motivo: this.formRegistra.value.validaMotivo
      };

    Swal.fire({
      title: 'Procesando...',
      text: '',
      icon: 'info',
      showConfirmButton: false, // No muestra el botón "OK"
      allowOutsideClick: false, // Impide que se cierre al hacer clic fuera
    });
    this.invitadoService.registrarUsuario(data).subscribe(
      () => {
        Swal.fire('Éxito', 'Registro exitoso.', 'success');
        this.limpiarFormulario()
      },
      (error) => {
        Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
      }
    );
    console.log('Datos enviados:', data);
  }

  tipoDocumentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value === -1 ? { tipoDocumentoRequerido: true } : null;
    };
  }

  limpiarFormulario() {
    this.formRegistra.reset();
    this.formRegistra.patchValue({
      validaTipoDocumento: -1,
      validaNumeroDocumento: '',
    });
    this.objUsuario.idUsuario = 0;

    // Deshabilitar todos los campos excepto Tipo y Número de Documento
    this.formRegistra.get('validaTipoDocumento')?.enable();
    this.formRegistra.get('validaNumeroDocumento')?.enable();
    this.formRegistra.get('validaNombre')?.disable();
    this.formRegistra.get('validaApellido')?.disable();
    this.formRegistra.get('validaCelular')?.disable();
    this.formRegistra.get('validaCorreo')?.disable();
    this.formRegistra.get('validaMotivo')?.disable();

    // Reasignar validadores para validaNumeroDocumento
    const numeroDocumentoControl = this.formRegistra.get('validaNumeroDocumento');
    numeroDocumentoControl?.clearValidators();
    numeroDocumentoControl?.setValidators([
      Validators.required,
      this.validarTipoDocumentoAntesDeEscribir(),
    ]);

    // Actualizar validadores
    numeroDocumentoControl?.updateValueAndValidity();

    // Restablecer estado de los botones
    this.botonBuscarHabilitado = true;
    this.botonLimpiarHabilitado = false;

    // Forzar revalidación del formulario
    this.formRegistra.updateValueAndValidity();
  }



  // Validar si se intenta llenar el número de documento sin seleccionar un tipo
  validarTipoDocumentoAntesDeEscribir(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoDocumento = this.formRegistra?.get('validaTipoDocumento')?.value;
      if (tipoDocumento === -1 && control.value) {
        return { tipoDocumentoNoSeleccionado: true };
      }
      return null;
    };
  }

  validarNumeroDocumento(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoDoc = this.formRegistra?.get('validaTipoDocumento')?.value;
      const numero = control.value;

      if (!numero) {
        return null; // Si no hay valor, no se valida
      }

      // Validación para DNI
      if (tipoDoc === 1) { // DNI
        if (!/^[0-9]{8}$/.test(numero)) {
          return { formatoInvalido: 'Debe tener exactamente 8 números' }; // Mensaje claro
        }
        if (/^(\d)\1+$/.test(numero)) {
          return { documentoInvalido: 'No debe ser una secuencia repetitiva de números' }; // Mensaje claro
        }
      }

      // Validación para Pasaporte
      if (tipoDoc === 2) { // Pasaporte
        // Acepta entre 9 y 12 caracteres: letras o números, con una letra opcional al principio o al final
        const pasaporteRegex = /^[a-zA-Z]?[0-9]{9,12}[a-zA-Z]?$/;
        if (!pasaporteRegex.test(numero)) {
          return { formatoInvalido: 'Debe tener entre 9 y 12 caracteres: números con una letra opcional al inicio o final' }; // Mensaje claro
        }
        if (/^([a-zA-Z0-9])\1+$/.test(numero)) {
          return { documentoInvalido: 'No debe ser una secuencia repetitiva' }; // Mensaje claro
        }
      }

      // Validación para Carnet de Extranjería
      if (tipoDoc === 3) { // Carnet de Extranjería
        // Exactamente 9 caracteres: números con una letra opcional al inicio o final
        const carnetRegex = /^[a-zA-Z][0-9]{8}$|^[0-9]{8}[a-zA-Z]$/; // Ajuste aquí
        if (!carnetRegex.test(numero)) {
          return { formatoInvalido: 'Debe tener exactamente 9 caracteres: números con una letra opcional al inicio o final' }; // Mensaje claro
        }
        if (/^([a-zA-Z0-9])\1+$/.test(numero)) {
          return { documentoInvalido: 'No debe ser una secuencia repetitiva' }; // Mensaje claro
        }
      }

      return null; // Si todas las validaciones pasan
    };
  }

  validarTresLetrasRepetidas(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return value && /([a-zA-Z])\1{2}/.test(value) ? { tresLetrasRepetidas: true } : null;
    };
  }

  mostrarError(campo: string, error: string): boolean {
    const control = this.formRegistra.get(campo);
    return !!control?.hasError(error) && (control?.touched || control?.dirty);
  }

  obtenerMensajeError(campo: string): string | null {
    const control = this.formRegistra.get(campo);
    if (!control || !control.errors) return null;

    // Busca el primer error y retorna su mensaje
    const errores = control.errors;
    for (const key in errores) {
      if (errores.hasOwnProperty(key)) {
        return errores[key]; // Devuelve el mensaje asociado al error
      }
    }

    return null;
  }


  actualizarValidacionDocumento(pattern: string): void {
    this.formRegistra.get('validaNumeroDocumento')?.setValidators([
      Validators.required,
      Validators.pattern(pattern),
      this.validarTipoDocumentoAntesDeEscribir(),
    ]);
  }
}

