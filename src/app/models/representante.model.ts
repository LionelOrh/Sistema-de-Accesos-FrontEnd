import { Proveedor } from "./proveedor.model";
import { TipoDocumento } from "./tipoDocumento.model";

export class Representante {
    idRepresentante?: number;
    proveedor?: Proveedor;
    nombres?: string;
    apellidos?: string;
    cargo?: string;
    tipoDocumento?: TipoDocumento;
    numDoc?: number;
    estado?: number;
}