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

@Component({
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent, ReactiveFormsModule],
  selector: 'app-registrar-externo',
  templateUrl: './registrar-invitado.component.html',
  styleUrls: ['./registrar-invitado.component.css']
})
export class RegistrarExternoComponent {
  lstTipoDoc: TipoDocumento[] = [];
  formRegistra: FormGroup;
  objUsuario: Usuario = {};
  longitudMaximaDocumento: number = 8; // Longitud inicial para DNI

  constructor(
    private formBuilder: FormBuilder,
    private utilService: UtilService,
    private invitadoService: InvitadoService,
    private tokenService: TokenService
  ) {
    // Cargar la lista de tipos de documento
    this.utilService.listaTipoDocumento().subscribe(
      tipos => this.lstTipoDoc = tipos
    );

    // Inicialización del formulario
    this.formRegistra = this.formBuilder.group({
      validaNombre: ['', [Validators.required, Validators.minLength(3),
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s]*$'),
        this.validarEspacios(), this.validarTresLetrasRepetidas()]],
      validaApellido: ['', [Validators.required, Validators.minLength(3),
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s]*$'),
        this.validarEspacios(), this.validarTresLetrasRepetidas()]],
      validaCelular: ['', [Validators.required, Validators.pattern('^9[0-9]{8}$')]],
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],
      validaNumeroDocumento: ['', [Validators.required, this.validarTipoDocumentoAntesDeEscribir()]],
      validaCorreo: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_-]+@[a-zA-Z]+\\.[a-zA-Z]{3,}$'), // Validación actualizada
        this.validarEspacios()
      ]],
      validaMotivo: ['', [Validators.required, Validators.minLength(15),
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s.,]*$'), this.validarTresLetrasRepetidas()]],
    });

    // Detectar cambios en el tipo de documento
    this.formRegistra.get('validaTipoDocumento')?.valueChanges.subscribe((tipoDoc) => {
      const numeroDocumentoControl = this.formRegistra.get('validaNumeroDocumento');
      numeroDocumentoControl?.setValue(''); // Resetear el valor
      numeroDocumentoControl?.clearValidators(); // Limpiar validadores

      switch (tipoDoc) {
        case 1: // DNI
          this.longitudMaximaDocumento = 8;
          numeroDocumentoControl?.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
        case 2: // Pasaporte
          this.longitudMaximaDocumento = 12;
          numeroDocumentoControl?.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
        case 3: // Carnet de Extranjería
          this.longitudMaximaDocumento = 9;
          numeroDocumentoControl?.setValidators([Validators.required, this.validarNumeroDocumento()]);
          break;
      }
      numeroDocumentoControl?.updateValueAndValidity();
    });

   

    this.objUsuario.idUsuario = this.tokenService.getUserId();
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
        const carnetRegex = /^[a-zA-Z]?[0-9]{9}[a-zA-Z]?$/; 
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
  
  
  

  // Validación adicional en tiempo real
  validarSecuenciaRepetida(): void {
    const control = this.formRegistra.get('validaNumeroDocumento');
    if (!control) return;

    const tipoDoc = this.formRegistra.get('validaTipoDocumento')?.value;
    const numero = control.value;

    if (tipoDoc && numero && /^(\w)\1+$/.test(numero)) {
      control.setErrors({ documentoInvalido: true });
    } else {
      const errors = control.errors;
      if (errors) {
        delete errors['documentoInvalido'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
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

  
  
  // Métodos adicionales de validación
  validarEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && /\s/.test(control.value)) {
        return { espacioNoPermitido: true };
      }
      return null;
    };
  }

  validarTresLetrasRepetidas(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (!valor) return null;
  
      // Expresión regular para detectar tres caracteres consecutivos repetidos (letras o números)
      const regex = /([a-zA-Z0-9])\1\1/;
  
      // Si se encuentra una secuencia de tres caracteres repetidos consecutivos, se devuelve el error
      if (regex.test(valor)) {
        return { tresLetrasRepetidas: true };
      }
  
      return null; // Si no hay secuencias repetidas, la validación pasa
    };
  }
  

// Mostrar errores dinámicos
mostrarError(campo: string, error: string): boolean {
  const control = this.formRegistra.get(campo);
  return !!control?.hasError(error) && (control?.touched || control?.dirty);
}

// Método para registrar
registra() {
  if (this.formRegistra.valid) {
    Swal.fire({
      title: 'Procesando...',
      text: 'Por favor espere',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    

    const payload = {
      nombres: this.formRegistra.value.validaNombre,
      apellidos: this.formRegistra.value.validaApellido,
      celular: this.formRegistra.value.validaCelular,
      correo: this.formRegistra.value.validaCorreo,
      numDoc: this.formRegistra.value.validaNumeroDocumento,
      tipodocumento: {
        idTipoDoc: parseInt(this.formRegistra.value.validaTipoDocumento)
      },
      motivo: this.formRegistra.value.validaMotivo,
      idUsuarioRegVisita: this.objUsuario.idUsuario
    };

    this.invitadoService.registrar(payload).subscribe(
      () => {
        Swal.fire('Éxito', 'El invitado ha sido registrado correctamente.', 'success');
        this.resetearFormulario();
      },
      (error) => {
        Swal.fire('Error', 'Ha ocurrido un error durante el registro.', 'error');
        console.error('Error:', error);
      }
    );
  } else {
    Swal.fire('Validación', 'Complete todos los campos correctamente.', 'warning');
  }
}

// Método para resetear el formulario
resetearFormulario() {
  this.formRegistra.reset();
  this.formRegistra.patchValue({ validaTipoDocumento: -1 });
}

    
  tipoDocumentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === -1) {
        return { tipoDocumentoRequerido: true };
      }
      return null;
    };
  }
}