import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import { TipoDocumento } from '../../models/tipoDocumento.model';
import { ProveedorService } from '../../services/proveedor.service';
import { UtilService } from '../../services/util.service';
import Swal from 'sweetalert2';
import JsBarcode from 'jsbarcode';

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

  // Referencia al elemento HTML donde se mostrará el código de barras
  @ViewChild('barcode', { static: false }) barcodeElement!: ElementRef;

  constructor(
    private utilService: UtilService,
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
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],
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
      tipoDocumento: this.formRegistra.value.validaTipoDocumento
    };

    // Llamar al servicio para registrar
    this.proveedorService.registrar(payload).subscribe(
      response => {

        const idProveedor = response.id;      
        const nroDocProveedor = response.nroDoc; 
        const idDniCombo = `${idProveedor}${nroDocProveedor}`;
        const cifrado = btoa(idDniCombo);  
    
     
        this.generarCodigoBarras(cifrado); 
        this.codigoBarrasGenerado = true; 

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

  generarCodigoBarras(cifrado: string) {
    setTimeout(() => {
      const barcodeElement = document.getElementById('barcode');
      if (barcodeElement) {
        JsBarcode(barcodeElement, cifrado, { 
          format: 'CODE128',
          lineColor: '#0aa',
          width: 2,
          height: 40,
          displayValue: true
        });
      } else {
        console.error("No se encontró el elemento de código de barras");
      }
    }, 100);
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
