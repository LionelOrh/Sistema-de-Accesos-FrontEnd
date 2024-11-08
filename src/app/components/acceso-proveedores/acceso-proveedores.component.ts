import { Component } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { TipoDocumento } from '../../models/tipoDocumento.model';
import { Proveedor } from '../../models/proveedor.model';
import { Representante } from '../../models/representante.model';
import { Usuario } from '../../models/usuario.model';
import { UtilService } from '../../services/util.service';
import { TokenService } from '../../security/token.service';
import { ProveedorService } from '../../services/proveedor.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent, ReactiveFormsModule],
  selector: 'app-acceso-proveedores',
  templateUrl: './acceso-proveedores.component.html',
  styleUrls: ['./acceso-proveedores.component.css']
})
export class AccesoProveedorComponent {
  lstTipoDoc: TipoDocumento[] = [];
  formRegistra: FormGroup;
  codigoBarrasGenerado: boolean = false;

  constructor(
    private utilService: UtilService,
    private tokenService: TokenService,
    private proveedorService: ProveedorService,
    private formBuilder: FormBuilder
  ) {
    // Cargar la lista de tipos de documento
    this.utilService.listaTipoDocumento().subscribe(
      tipos => this.lstTipoDoc = tipos
    );

    // Configurar el formulario
    this.formRegistra = this.formBuilder.group({
      validaRazonSocial: ['', [Validators.required]],
      validaRuc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      validaDesProd: ['', [Validators.required]],
      validaNombres: ['', [Validators.required]],
      validaApellidos: ['', [Validators.required]],
      validaCargoRes: ['', [Validators.required]],
      validaNroDoc: ['', [Validators.required, Validators.maxLength(45)]],
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]], // El valor por defecto es -1, es decir, no seleccionado
    });
  }

  // Validador personalizado para el tipo de documento
  tipoDocumentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return value === -1 ? { invalidTipoDocumento: true } : null;
    };
  }

  registrar() {
    // Validar el formulario
    if (this.formRegistra.invalid) {
      const errores = this.getErrorMessages();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incorrecto',
        html: `<ul>${errores}</ul>`,
        confirmButtonText: 'Cerrar'
      });
      return;
    }

    // Construir el payload para el registro
    const payload = {
      razonSocial: this.formRegistra.value.validaRazonSocial,
      ruc: this.formRegistra.value.validaRuc,
      descripcion: this.formRegistra.value.validaDesProd,
      nombres: this.formRegistra.value.validaNombres,
      apellidos: this.formRegistra.value.validaApellidos,
      cargo: this.formRegistra.value.validaCargoRes,
      numDoc: this.formRegistra.value.validaNroDoc,
      tipoDocumento: this.formRegistra.value.validaTipoDocumento // Aquí se pasa directamente el ID del tipo de documento
    };

    // Imprimir el payload en consola para depurar
    console.log("Payload a enviar:", payload);

    // Llamar al servicio para registrar
    this.proveedorService.registrar(payload).subscribe(
      response => {
        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: response.mensaje,
          confirmButtonText: 'Cerrar'
        });
      },
      error => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al realizar el registro. Inténtalo de nuevo.',
          confirmButtonText: 'Cerrar'
        });
      }
    );
  }

  // Generar mensajes de error para los campos del formulario
  getErrorMessages(): string {
    const errores = [];
    const controls = this.formRegistra.controls;

    if (controls['validaRazonSocial'].hasError('required')) {
      errores.push('<li>La razón social es obligatoria.</li>');
    }

    if (controls['validaRuc'].hasError('required')) {
      errores.push('<li>El RUC es obligatorio.</li>');
    } else if (controls['validaRuc'].hasError('pattern')) {
      errores.push('<li>El RUC debe tener 11 dígitos.</li>');
    }

    if (controls['validaNombres'].hasError('required')) {
      errores.push('<li>El nombre es obligatorio.</li>');
    }

    if (controls['validaApellidos'].hasError('required')) {
      errores.push('<li>El apellido es obligatorio.</li>');
    }

    if (controls['validaCargoRes'].hasError('required')) {
      errores.push('<li>El cargo del responsable es obligatorio.</li>');
    }

    if (controls['validaNroDoc'].hasError('required')) {
      errores.push('<li>El número de documento es obligatorio.</li>');
    } else if (controls['validaNroDoc'].hasError('maxlength')) {
      errores.push('<li>El número de documento no debe exceder los 45 caracteres.</li>');
    }

    return errores.join('');
  }
}
