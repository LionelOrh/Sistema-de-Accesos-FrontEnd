import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Externo } from '../models/externo.model';
import { catchError, Observable, throwError } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Invitacion } from '../models/invitacion.model';

const baseUrlMotivoInvitado = AppSettings.API_ENDPOINT + '/motivo-invitado';
const baseUrlUtil = AppSettings.API_ENDPOINT + '/util';
@Injectable({
  providedIn: 'root'
})

export class InvitadoService {
  constructor(private http: HttpClient) {
  }
  // Método para validar si un número de documento existe
  validarNumeroDocumento(numDoc: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${baseUrlUtil}/validar-numDocUsuario`, {
      params: { numDoc },
    });
  }

  buscarUsuario(numDoc: string): Observable<any> {
    return this.http.get(`${baseUrlMotivoInvitado}/buscar`, {
      params: new HttpParams().set('numDoc', numDoc)
    });
  }


  registrarUsuario(data: any): Observable<any> {
    return this.http.post(`${baseUrlMotivoInvitado}/registrar`, data).pipe(
      catchError((error) => {
        console.error('Error al registrar usuario:', error);
        return throwError(() => new Error('Error al registrar el usuario.'));
      })
    );
  }
  
  
}

