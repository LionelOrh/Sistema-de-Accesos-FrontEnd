import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Representante } from '../models/representante.model';
import { AppSettings } from '../app.settings';

const baseUrlRepresentante = AppSettings.API_ENDPOINT + '/representante';
const baseUrlUtil = AppSettings.API_ENDPOINT + '/util';

@Injectable({
  providedIn: 'root'
})
export class RepresentanteService {
  constructor(private http: HttpClient) {}

  registrarRepresentante(representante: Representante): Observable<any> {
    return this.http.post(`${baseUrlRepresentante}/registrar`, representante);
  }

  // Método para validar si un número de documento existe
  validarNumeroDocumento(numDoc: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${baseUrlUtil}/validar-numDoc`, {
      params: { numDoc },
    });
  }
}
