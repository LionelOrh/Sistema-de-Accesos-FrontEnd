  import { Component } from '@angular/core';
  import { AppMaterialModule } from '../../app.material.module';
  import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
  import { CommonModule } from '@angular/common';
  import { MenuComponent } from '../../menu/menu.component';
  import { TipoDocumento } from '../../models/tipoDocumento.model';
  import { UtilService } from '../../services/util.service';
  import { InvitadoService } from '../../services/invitado.service';
  import { TokenService } from '../../security/token.service';
  import { Externo } from '../../models/externo.model';
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

    invitadoUsuario: Usuario = {
      nombres: "",
      apellidos: "",
      celular: "",
      correo: "",
      numDoc: "",
      tipodocumento: { idTipoDoc: -1 }
    }
    objUsuario: Usuario = {};
    formRegistra: FormGroup;

    Invitacion: Invitacion = {
      motivo: "",
    }
    constructor(
      private utilService: UtilService,
      private tokenService: TokenService,
      private invitadoService: InvitadoService,
      private formBuilder: FormBuilder,
    ) {
      utilService.listaTipoDocumento().subscribe(
        x => this.lstTipoDoc = x
      );

      this.objUsuario.idUsuario = this.tokenService.getUserId();

      // Definimos los validadores para cada campo
      this.formRegistra = this.formBuilder.group({
        validaNombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]+$')]],  // Solo letras
        validaApellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]+$')]],  // Solo letras
        validaCelular: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],  // 9 dígitos
        validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],  // Validador personalizado
        validaNumeroDocumento: ['', [Validators.required, Validators.maxLength(45)]],  // Máximo 45 caracteres
        validaCorreo: ['', [Validators.required, Validators.email]],  // Email válido
        validaMotivo: ['', [Validators.required, Validators.maxLength(100)]]  // Máximo 100 caracteres
      });
    }

    // Validador personalizado para tipo de documento
    tipoDocumentoValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return value === -1 ? { invalidTipoDocumento: true } : null;
      };
    }

    registra() {
      if (this.formRegistra.valid) {
        // Mostrar el indicador de carga
        Swal.fire({
          title: 'Procesando registro',
          text: 'Por favor espere...',
          icon: 'info',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
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
          idUsuarioRegVisita: Number(this.objUsuario.idUsuario)
        };
  
        this.invitadoService.registrar(payload)
          .subscribe(
            (response) => {
              // Cerrar el indicador de carga y mostrar éxito
              Swal.fire({
                title: 'Registro Exitoso',
                text: 'El invitado ha sido registrado correctamente',
                icon: 'success',
                showConfirmButton: true,
                confirmButtonText: 'Aceptar'
              }).then((result) => {
                if (result.isConfirmed) {
                  // Opcional: Limpiar el formulario o redirigir
                  this.formRegistra.reset();
                  // this.router.navigate(['/ruta-deseada']); // Si quieres redirigir después
                }
              });
            },
            (error) => {
              // Cerrar el indicador de carga y mostrar error
              Swal.fire({
                title: 'Error',
                text: 'Ha ocurrido un error al registrar el invitado',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              console.error('Error:', error);
            }
          );
      } else {
        // Mostrar mensaje si el formulario no es válido
        Swal.fire({
          title: 'Validación',
          text: 'Por favor, complete todos los campos requeridos correctamente',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  
    // Opcional: Método para resetear el formulario
    resetearFormulario() {
      this.formRegistra.reset();
      // Establecer valores por defecto si es necesario
      this.formRegistra.patchValue({
        validaTipoDocumento: -1
      });
    }
  }
