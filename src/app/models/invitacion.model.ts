import { Usuario } from "./usuario.model";

export class Invitacion {

    idInvitacion?: number;
    idUsuarioInvitado?: Usuario;
    idUsuarioRegVisita?: Usuario;
    motivo?: string;
    fechaInvitacion?: Date;

   
}