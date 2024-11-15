import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Externo } from '../models/externo.model';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Invitacion } from '../models/invitacion.model';

const baseUrlExterno = AppSettings.API_ENDPOINT + '/invitacion';
const baseUrlUtil = AppSettings.API_ENDPOINT + '/util';
@Injectable({
  providedIn: 'root'
})

export class InvitadoService {
  constructor(private http: HttpClient) {
  }


  registrar(payload: any) {
    return this.http.post<any>(baseUrlExterno + "/registraUsuarioInvitado", payload);
  }
  // Método para validar si un número de documento existe
  validarNumeroDocumento(numDoc: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${baseUrlUtil}/validar-numDoc`, {
      params: { numDoc },
    });
  }
}

