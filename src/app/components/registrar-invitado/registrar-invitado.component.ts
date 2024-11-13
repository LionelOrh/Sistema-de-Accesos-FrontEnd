import { Component } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { TipoDocumento } from '../../models/tipoDocumento.model';
import { UtilService } from '../../services/util.service';
import { InvitadoService } from '../../services/invitado.service';
import { TokenService } from '../../security/token.service';
import { Usuario } from '../../models/usuario.model';
import Swal from 'sweetalert2';
import { Invitacion } from '../../models/invitacion.model';

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
    // Llenar lista de tipo de documento desde el servicio
    this.utilService.listaTipoDocumento().subscribe((data) => (this.lstTipoDoc = data));

    // Inicialización del formulario
    this.formRegistra = this.formBuilder.group({
      validaNombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$')]],
      validaApellido: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$')]],
      validaCelular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      validaTipoDocumento: [-1, [this.tipoDocumentoValidator()]], // Validador para tipo de documento
      validaNumeroDocumento: [
        '',
        [Validators.required, this.validarTipoDocumentoAntesDeEscribir()],
      ],
      validaCorreo: ['', [Validators.required, Validators.email]],
      validaMotivo: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^[a-zA-Z0-9ÑñáéíóúÁÉÍÓÚ ]+$')]],
    });

    

    // Detectar cambios en el tipo de documento
    this.formRegistra.get('validaTipoDocumento')?.valueChanges.subscribe((value) => {
      switch (value) {
        case 1: // DNI
          this.longitudMaximaDocumento = 8;
          this.actualizarValidacionDocumento('^[0-9]{8}$');
          break;
        case 2: // Pasaporte
          this.longitudMaximaDocumento = 12;
          this.actualizarValidacionDocumento('^[a-zA-Z0-9]{9,12}$');
          break;
        case 3: // Carnet de Extranjería
          this.longitudMaximaDocumento = 9;
          this.actualizarValidacionDocumento('^[a-zA-Z0-9]{9}$');
          break;
        default:
          this.longitudMaximaDocumento = 45;
          this.formRegistra.get('validaNumeroDocumento')?.clearValidators();
      }
      this.formRegistra.get('validaNumeroDocumento')?.updateValueAndValidity();
    });
    this.objUsuario.idUsuario = this.tokenService.getUserId();

    // Llamada al método de validación en tiempo real
    this.formRegistra.get('validaNumeroDocumento')?.valueChanges.subscribe((numDoc) => {
      if (numDoc && numDoc.length > 0) {
        this.validarNumeroDocumentoEnBackend(numDoc);
      }
    });
  } 

   // Método para verificar si el número de documento ya existe
   validarNumeroDocumentoEnBackend(numDoc: string): void {
    this.invitadoService.validarNumeroDocumento(numDoc).subscribe({
      next: (response) => {
        if (response.existe) {
          this.formRegistra.get('validaNumeroDocumento')?.setErrors({ numDocExiste: true });
        } else {
          const errors = this.formRegistra.get('validaNumeroDocumento')?.errors;
          if (errors) {
            delete errors['numDocExiste']; // Eliminar el error si ya no aplica
            this.formRegistra.get('validaNumeroDocumento')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      },
      error: (err) => console.error('Error al validar número de documento:', err)
    });
  }

  // Validador personalizado para tipo de documento
  tipoDocumentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value === -1 ? { invalidTipoDocumento: true } : null;
    };
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

  
}