import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

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
    idTipoAcceso: number,
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("idTipoAcceso", idTipoAcceso.toString())
      .set("numDoc", numDoc);

    return this.http.get(baseUrlAcceso + "/consultaReporteAccesos", { params });
  }

  consultaReporteRepresentante(
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("numDoc", numDoc)
;

    return this.http.get(baseUrlAcceso + "/consultaReporteRepresentante", { params });
  }

  
  generateDocumentExcel(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    idTipoAcceso: number,
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("idTipoAcceso", idTipoAcceso)
      .set("numDoc", numDoc);

    let headers = new HttpHeaders();
    headers.append('Accept', 'application/vnd.ms-excel');
    let requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(baseUrlAcceso +
      "/reporteAccesos?login=" + login +
      "&fechaAccesoDesde=" + fechaAccesoDesde +
      "&fechaAccesoHasta=" + fechaAccesoHasta +
      "&numDoc=" + numDoc +
      "&idTipoAcceso=" + idTipoAcceso, '', requestOptions).pipe(map((response) => {
        return {
          filename: 'ReporteAccesos.xlsx',
          data: new Blob([response], { type: 'application/vnd.ms-excel' })
        };
      }));
  }

  generateDocumentExcelRepresentante(
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("numDoc", numDoc);

    let headers = new HttpHeaders();
    headers.append('Accept', 'application/vnd.ms-excel');
    let requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(baseUrlAcceso +
      "/reporteRepresentante?numDoc=" + numDoc ," ",requestOptions).pipe(map((response) => {
        return {
          filename: 'ReporteRepresentante.xlsx',
          data: new Blob([response], { type: 'application/vnd.ms-excel' })
        };
      }));
  }
}