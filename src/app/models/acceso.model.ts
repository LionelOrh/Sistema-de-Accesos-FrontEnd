export class Acceso {
    idRegistro?: number; // Autogenerado por el backend
  fechaAcceso?: string; // Fecha actual (opcional, puede llenarse en el backend)
  horaAcceso?: string; // Hora actual (opcional, puede llenarse en el backend)
  idUsuario?: number; // ID del usuario (opcional)
  idRepresentante?: number; // ID del representante (opcional)
  idUsuarioRegAcceso!: number; // ID del usuario logueado
}