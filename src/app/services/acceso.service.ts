import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrlAcceso = AppSettings.API_ENDPOINT + '/verConsultaReporte';

@Injectable({
  providedIn: 'root'
}) 
export class AccesoService {
  constructor(private http: HttpClient) { }
 
  consultaReporteAccesos(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    idTipoAcceso: number
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("idTipoAcceso", idTipoAcceso.toString()); 

    return this.http.get(baseUrlAcceso + "/consultaReporteAccesos", { params });
  }
}
