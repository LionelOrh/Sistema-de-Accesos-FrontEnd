import { Time } from "@angular/common";
import { Representante } from "./representante.model";
import { TipoAcceso } from "./tipoAcceso.model";
import { Usuario } from "./usuario.model";

export class Acceso {
    idRegistro?: number;
    usuarioRegAcceso?: Usuario;
    usuario?: Usuario;
    representante?: Representante;
    tipoAcceso?: TipoAcceso;
    fechaAcceso?: Date;
    horaAcceso?: Time;
}