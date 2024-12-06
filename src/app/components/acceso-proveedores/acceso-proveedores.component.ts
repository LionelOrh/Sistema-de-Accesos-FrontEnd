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

  errorRazonSocial: boolean = false;
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
      
      validaRazonSocial: [{ value: '', disabled: true }],
      validaRuc: [{ value: '', disabled: true }],
      validaDes: [{ value: '', disabled: true }],
      validaNombre: ['', [Validators.required, Validators.minLength(3),
      Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s]*$'),
      this.validarEspacios(), this.validarTresLetrasRepetidas()]],

      validaApellido: ['', [Validators.required, Validators.minLength(3),
      Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s]*$'),
      this.validarEspacios(), this.validarTresLetrasRepetidas()]],
     
      validaCargoRes: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZÑñáéíóúÁÉÍÓÚ]{3,}[a-zA-ZÑñáéíóúÁÉÍÓÚ\\s]*$'),
      this.validarEspacios(), this.validarTresLetrasRepetidas()]],
      validaNumeroDocumento: ['', [Validators.required, this.validarTipoDocumentoAntesDeEscribir()]],
      validaTipoDocumento: [-1, [Validators.required, this.tipoDocumentoValidator()]],
    });

    this.formRegistrarProveedor = this.formBuilder.group({
      ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      razonSocial: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ0-9\\s\\-\\.]{3,100}$')]],
      descripcion: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ0-9\\s\\-\\.]{3,500}$'),Validators.minLength(10)]],
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

    this.formRegistrarProveedor.get('razonSocial')?.valueChanges.subscribe((razonSocial) => {
      if (razonSocial && razonSocial.length > 0) {
        this.validarRazonSocialEnBackend(razonSocial);
      }
    });

    
  }

  validarBusquedaRazonSocial(): void {
    const pattern = /^[a-zA-ZÀ-ÿ0-9\s\-.]*$/; // Solo permite letras, números, espacios, guiones y puntos
    this.errorRazonSocial = !pattern.test(this.filterRazonSocial);
  
    if (!this.errorRazonSocial) {
      this.consultarProveedores(); // Llama al método para buscar proveedores si no hay errores
    } else {
      this.proveedores = []; // Limpia los resultados si hay error
    }
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

  // Validador personalizado para comprobar si el campo está vacío o solo tiene espacios
  validarEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();
      return value ? null : { soloEspacios: true };
    };
  }

  // Validador personalizado para evitar 3 letras repetidas
  validarTresLetrasRepetidas(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const regex = /(.)\1\1/; // Expresión regular para encontrar tres caracteres repetidos
      return value && regex.test(value) ? { tresLetrasRepetidas: true } : null;
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
    this.errorRazonSocial = false;
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
    if (!this.selectedProveedor) {
      Swal.fire('Error', 'Debe seleccionar un proveedor antes de registrar el representante.', 'error');
      return;
    }

    const nuevoRepresentante = {
      proveedor: { idProveedor: this.selectedProveedor.idProveedor },
      nombres: this.formRegistra.get('validaNombre')?.value || '',
      apellidos: this.formRegistra.get('validaApellido')?.value || '',
      cargo: this.formRegistra.get('validaCargoRes')?.value || '',
      numDoc: this.formRegistra.get('validaNumeroDocumento')?.value || '',
      tipoDocumento: { idTipoDoc: this.formRegistra.get('validaTipoDocumento')?.value || null },
      estado: 0
    };

    console.log('Datos enviados al backend:', nuevoRepresentante);

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
          this.resetForm(); // Limpia el formulario después del registro
        } else {
          Swal.fire('Error', response.message || 'No se pudo registrar el representante.', 'error');
          this.resetForm();
        }
      },
      (error) => {
        console.error('Error al registrar el representante:', error);
        Swal.fire('Error', 'Ocurrió un error inesperado al registrar el representante.', 'error');
      }
    );
  }


}