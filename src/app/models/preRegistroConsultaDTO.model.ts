export class preRegistroConsultaDTO {
  codigo?: string;          // Login o "no aplica"
  identificacion?: string;  // Número de documento
  nombres?: string;
  apellidos?: string;
  estado?: string;          
  foto?: string;            // URL de la foto (solo para usuarios)
  id?: number;              // ID del usuario o representante
  tipo?: string;            // "usuario" o "representante"
  motivo?: string;
  motivoVisita?: string;
  matriculado?: boolean; // Nuevo campo
}