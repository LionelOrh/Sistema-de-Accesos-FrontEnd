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
      validaNombre: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}(?:\\s[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,})*$'), 
        this.validarEspacios(), 
        this.validarTresLetrasRepetidas()
      ]],
      
      validaApellido: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}(?:\\s[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,})*$'),
        this.validarEspacios(),
        this.validarTresLetrasRepetidas()
      ]],
      
      validaCelular: ['', [
        Validators.required, 
        Validators.pattern('^9[0-9]{8}$')
      ]],
      validaTipoDocumento: [-1, [
        Validators.required, 
        this.tipoDocumentoValidator()
      ]],

      validaNumeroDocumento: ['', [
        Validators.required, 
        this.validarTipoDocumentoAntesDeEscribir()]],

      validaCorreo: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_-]+@[a-zA-Z]+\\.[a-zA-Z]{3,}$'), 
        this.validarEspacios()
      ]],

      validaMotivo: ['', [
        Validators.required, 
        Validators.minLength(15),
        Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s.,]*$'),
        this.validarTresLetrasRepetidas(),
        this.noSoloEspacios()
      ]],
      
    });


    
    this.formRegistra.get('validaTipoDocumento')?.valueChanges.subscribe((tipoDoc) => {
      const numeroDocumentoControl = this.formRegistra.get('validaNumeroDocumento');
      numeroDocumentoControl?.setValue(''); 
      numeroDocumentoControl?.clearValidators();

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


if (tipoDoc === 2) { 
  const pasaporteRegex = /^(?=[A-Z0-9]{9,12}$)(?=(.[A-Z]){1,3})[A-Z0-9]$/;
  const letraCount = (numero.match(/[A-Z]/g) || []).length;
  if (!pasaporteRegex.test(numero)) {return { formatoInvalido: 'Debe tener entre 9 y 12 caracteres, con al menos 1 letra mayúscula y como máximo 3 letras, y el resto números' };}
  if (letraCount > 3) {return { formatoInvalido: 'No debe contener más de 3 letras mayúsculas' };}
  if (/([A-Z0-9])\1{2,}/.test(numero)) {return { documentoInvalido: 'No debe contener secuencias repetidas de caracteres' };}
  if (!/[A-Z]/.test(numero)) { return { formatoInvalido: 'Debe contener al menos una letra mayúscula' }; }
  if (/^[0-9]+$/.test(numero)) {return { formatoInvalido: 'No debe contener solo números repetidos' };}
  if (/([A-Z]{4,})/.test(numero)) {return { formatoInvalido: 'No debe contener más de 3 letras seguidas' };}
  if (!/[A-Z]/.test(numero)) { return { formatoInvalido: 'Debe contener al menos una letra mayúscula' };}
}



if (tipoDoc === 3) { 
  const carnetRegex = /^(?=[A-Z0-9]{9,12}$)(?=(.[A-Z]){1,3})[A-Z0-9]$/;
  const letraCount = (numero.match(/[A-Z]/g) || []).length;

  if (!carnetRegex.test(numero)) {return { formatoInvalido: 'Debe tener entre 9 y 12 caracteres, con al menos 1 letra mayúscula y como máximo 3 letras, y el resto números' };}
  if (letraCount > 3) {return { formatoInvalido: 'No debe contener más de 3 letras mayúsculas' };}
  if (/([A-Z0-9])\1{2,}/.test(numero)) { return { documentoInvalido: 'No debe contener secuencias repetidas de caracteres' }; }
  if (!/[A-Z]/.test(numero)) { return { formatoInvalido: 'Debe contener al menos una letra mayúscula' };}
  if (/^[0-9]+$/.test(numero)) {return { formatoInvalido: 'No debe contener solo números repetidos' }; }
  if (/([A-Z]{4,})/.test(numero)) { return { formatoInvalido: 'No debe contener más de 3 letras seguidas' }; }
  if (!/[A-Z]/.test(numero)) {return { formatoInvalido: 'Debe contener al menos una letra mayúscula' }; }
}

      return null; // Si todas las validaciones pasan
    };
  }
  noSoloEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value) {
        const trimmedValue = control.value.trim();  // Elimina espacios al principio y al final
        if (control.value !== trimmedValue) {
          return { 'noSoloEspacios': 'No se pueden ingresar solo espacios al final' };
        }
      }
      return null;
    };
  }
  
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

  
  validarEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && /\s{2,}/.test(control.value.trim())) {
        return { espacioNoPermitido: 'No se pueden ingresar espacios consecutivos.' };
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

  // Actualizar validación del número de documento
  actualizarValidacionDocumento(pattern: string): void {
    this.formRegistra.get('validaNumeroDocumento')?.setValidators([ 
      Validators.required, 
      Validators.pattern(pattern), 
      this.validarTipoDocumentoAntesDeEscribir(),
    ]);
    this.formRegistra.get('validaNumeroDocumento')?.updateValueAndValidity();

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
