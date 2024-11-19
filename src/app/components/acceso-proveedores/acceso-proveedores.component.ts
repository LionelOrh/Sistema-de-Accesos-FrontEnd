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
import { Proveedor } from '../../models/proveedor.model';
import { RepresentanteService } from '../../services/representante.service';

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
  proveedores: any[] = [];
  filterRazonSocial: string = '';
  isProveedorSelected: boolean = false;
  selectedProveedor: any = null;
  // Declarar la propiedad para controlar el estado del modal
  showBuscarModal: boolean = false;
  showRegistrarModal = false;
  formRegistrarProveedor: FormGroup;

  longitudMaximaDocumento: number = 8; 

  @ViewChild('barcode', { static: false }) barcodeElement!: ElementRef;

  constructor(
    private utilService: UtilService,
    private proveedorService: ProveedorService,
    private representanteService: RepresentanteService,
    private formBuilder: FormBuilder
  ) {
    // Cargar la lista de tipos de documento
    this.utilService.listaTipoDocumento().subscribe(
      tipos => this.lstTipoDoc = tipos
    );

    // Configurar el formulario
    this.formRegistra = this.formBuilder.group({
      validaRazonSocial: [{ value: '', disabled: true }, [Validators.required]],
      validaRuc: [{ value: '', disabled: true }, [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      validaDes: [{ value: '', disabled: true }, [Validators.required]],
      validaNombre: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$')]],
      validaApellido: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$')]],
      validaCargoRes: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ ]+$')]],
      validaNumeroDocumento: [
        '',
        [Validators.required, this.validarTipoDocumentoAntesDeEscribir()],
      ],
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],
    });

    this.formRegistrarProveedor = this.formBuilder.group({
      ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      razonSocial: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ0-9\\s\\-\\.]{3,100}$')]],
      descripcion: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ0-9\\s\\,\\.\\-\\(\\)]{10,500}$')]],
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

    // Llamada al método de validación en tiempo real
    this.formRegistra.get('validaNumeroDocumento')?.valueChanges.subscribe((numDoc) => {
      if (numDoc && numDoc.length > 0) {
        this.validarNumeroDocumentoEnBackend(numDoc);
      }
    });

    // Llamada al método de validación en tiempo real
    this.formRegistrarProveedor.get('ruc')?.valueChanges.subscribe((ruc) => {
      if (ruc && ruc.length > 0) {
        this.validarRucEnBackend(ruc);
      }
    });

    this.formRegistrarProveedor.get('razonSocial')?.valueChanges.subscribe((razonSocial) =>{
      if (razonSocial && razonSocial.length > 0){
        this.validarRazonSocialEnBackend(razonSocial);
      }
    });
  }

  // Mostrar errores dinámicos
  mostrarError(campo: string, error: string): boolean {
    const control = this.formRegistra.get(campo);
    return !!control?.hasError(error) && (control?.touched || control?.dirty);
  }
    // Mostrar errores dinámicos
    mostrarErrorProveedor(campo: string, error: string): boolean {
      const control = this.formRegistrarProveedor.get(campo);
      return !!control?.hasError(error) && (control?.touched || control?.dirty);
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

  // Método para verificar si el número de documento ya existe
  validarNumeroDocumentoEnBackend(numDoc: string): void {
    this.representanteService.validarNumeroDocumento(numDoc).subscribe({
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

  // Método para verificar si la Razón Social ya existe
  validarRazonSocialEnBackend(razonSocial: string): void {
    this.proveedorService.validaRazonSocial(razonSocial).subscribe({
      next: (response) => {
        if (response.existe) {
          this.formRegistrarProveedor.get('razonSocial')?.setErrors({ razonSocialExiste: true });
        } else {
          const errors = this.formRegistrarProveedor.get('razonSocial')?.errors;
          if (errors) {
            delete errors['razonSocialExiste']; // Eliminar el error si ya no aplica
            this.formRegistra.get('razonSocial')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      },
      error: (err) => console.error('Error al validar número de documento:', err)
    });
  }

    // Método para verificar si el RUC ya existe
    validarRucEnBackend(ruc: string): void {
      this.proveedorService.validarRuc(ruc).subscribe({
        next: (response) => {
          if (response.existe) {
            this.formRegistrarProveedor.get('ruc')?.setErrors({ rucExiste: true });
          } else {
            const errors = this.formRegistrarProveedor.get('ruc')?.errors;
            if (errors) {
              delete errors['rucExiste']; // Eliminar el error si ya no aplica
              this.formRegistrarProveedor.get('ruc')?.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error: (err) => console.error('Error al validar ruc:', err)
      });
    }

  

  openBuscarModal() {
    this.showBuscarModal = true;
    this.consultarProveedores();
  }

  closeBuscarModal() {
    this.showBuscarModal = false;
    this.filterRazonSocial = ''; // Limpiar el filtro de búsqueda
    this.proveedores = []; // Limpiar la lista de resultados
  }

  openRegistrarModal() {
    this.showRegistrarModal = true;
    this.formRegistrarProveedor.reset({
      ruc: '',
      razonSocial: '',
      descripcion: ''
    });
  }

  closeRegistrarModal() {
    this.showRegistrarModal = false;
  }
  // Validador personalizado para el tipo de documento
  tipoDocumentoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return value === -1 ? { invalidTipoDocumento: true } : null;
    };
  }


  // Consultar proveedores desde el backend
  consultarProveedores() {
    this.proveedorService.consultarProveedores(this.filterRazonSocial).subscribe(
      (response) => {
        this.proveedores = response;
      },
      () => {
        Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error');
      }
    );
  }

  selectProveedor(proveedor: Proveedor) {
    this.selectedProveedor = proveedor;
    this.isProveedorSelected = true;

    this.formRegistra.patchValue({
      validaRuc: proveedor.ruc,
      validaRazonSocial: proveedor.razonSocial,
      validaDes: proveedor.descripcion,
    });

    // Deshabilitar los campos relacionados con el proveedor
    this.formRegistra.get('validaRuc')?.disable();
    this.formRegistra.get('validaRazonSocial')?.disable();
    this.formRegistra.get('validaDes')?.disable();

    this.closeBuscarModal();
  }

  // Reiniciar el formulario
  resetForm() {
    this.formRegistra.reset({
      validaRazonSocial: { value: '', disabled: true },
      validaRuc: { value: '', disabled: true },
      validaDes: { value: '', disabled: true },
      validaNombres: '',
      validaApellidos: '',
      validaCargoRes: '',
      validaNumDoc: '',
      validaTipoDocumento: -1,
    });
    this.isProveedorSelected = false; // Indicar que no hay proveedor seleccionado
    this.selectedProveedor = null;   // Limpiar la selección del proveedor
  }


  registrarProveedor() {
    const nuevoProveedor = this.formRegistrarProveedor.value;
    // Mostrar alerta de carga
    Swal.fire({
      title: 'Procesando registro',
      text: 'Por favor, espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.proveedorService.registrarProveedor(nuevoProveedor).subscribe(
      (response) => {
        console.log('Proveedor registrado:', response); // Verifica que recibes el objeto completo
        Swal.fire('Éxito', 'Proveedor registrado exitosamente.', 'success');
        this.closeRegistrarModal();
      },
      (error) => {
        console.error('Error al registrar el proveedor:', error);
        Swal.fire('Error', 'No se pudo registrar el proveedor.', 'error');
      }
    );
  }

  registrarRepresentante() {
    const nuevoRepresentante = {
      ...this.formRegistra.value,
      proveedor: { idProveedor: this.selectedProveedor.idProveedor },
      nombres: this.formRegistra.value.validaNombres,
      apellidos: this.formRegistra.value.validaApellidos,
      cargo: this.formRegistra.value.validaCargoRes,
      numDoc: this.formRegistra.value.validaNumDoc,
      tipoDocumento: { idTipoDoc: this.formRegistra.value.validaTipoDocumento },
      estado: 0
    };
    // Mostrar alerta de carga
    Swal.fire({
      title: 'Procesando registro',
      text: 'Por favor, espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.representanteService.registrarRepresentante(nuevoRepresentante).subscribe(
      (response: any) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.resetForm();
        } else {
          Swal.fire('Error', 'No se pudo registrar el representante.', 'error');
          this.resetForm();
        }
      },
      (error) => {
        console.error('Error al registrar el representante:', error);
        Swal.fire('Error', 'No se pudo registrar el representante.', 'error');
      }
    );
  }

}
