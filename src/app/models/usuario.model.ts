import { TipoDocumento } from "./tipoDocumento.model";

export class Usuario {

    idUsuario?: number;
    nombres?: string;
    apellidos?: string;
    celular?: string;
    correo?: string;
    login?: string;
    password?: string;
    tipodocumento?:TipoDocumento ;
    numDoc?:String;
    foto?:string;

   
}
