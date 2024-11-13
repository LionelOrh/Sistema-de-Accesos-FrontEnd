import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { preRegistroConsultaDTO } from '../models/preRegistroConsultaDTO.model';
import { Acceso } from '../models/acceso.model';



@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  private baseUrlAcceso = AppSettings.API_ENDPOINT + '/registroAcceso';
  constructor(private http: HttpClient) {}



  registrarAcceso(data: Acceso): Observable<any> {
    return this.http.post(`${this.baseUrlAcceso}/registrar`, data, { responseType: 'text' }); // Cambiar a 'text'
  }
  


  // Consulta de reporte de accesos
  consultaReporteAccesos(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("numDoc", numDoc);

    return this.http.get(this.baseUrlAcceso + "/consultaReporteAccesos", { params });
  }

  // Consulta de reporte de representantes
  consultaReporteRepresentante(numDoc: string,
    fechaAccesoDesdeR: string,
    fechaAccesoHastaR: string,
  ): Observable<any> {
    const params = new HttpParams().set("numDoc", numDoc)
    .set("fechaAccesoDesde", fechaAccesoDesdeR)
    .set("fechaAccesoHasta", fechaAccesoHastaR);

    return this.http.get(this.baseUrlAcceso + "/consultaReporteRepresentante", { params });
  }

  // Exportación a Excel para accesos
  generateDocumentExcel(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("numDoc", numDoc);

    const headers = new HttpHeaders({
      'Accept': 'application/vnd.ms-excel'
    });

    const requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(
      this.baseUrlAcceso +
        "/reporteAccesos?login=" +
        login +
        "&fechaAccesoDesde=" +
        fechaAccesoDesde +
        "&fechaAccesoHasta=" +
        fechaAccesoHasta +
        "&numDoc=" +
        numDoc, // Cambiado
      '',
      requestOptions
    ).pipe(
      map((response) => {
        return {
          filename: 'ReporteAccesos.xlsx',
          data: new Blob([response], { type: 'application/vnd.ms-excel' })
        };
      })
    );
  }

  // Exportación a Excel para representantes
  generateDocumentExcelRepresentante(
    numDoc: string, 
    fechaAccesoDesdeR: string,
    fechaAccesoHastaR: string,
  ): Observable<any> {
    const params = new HttpParams()
      .set("numDoc", numDoc)
      .set("fechaAccesoDesdeR", fechaAccesoDesdeR)
      .set("fechaAccesoHastaR", fechaAccesoHastaR)
    ;
    

    const headers = new HttpHeaders({
      'Accept': 'application/vnd.ms-excel'
    });

    const requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(
      this.baseUrlAcceso + 
      "/reporteRepresentante?numDoc=" +
       numDoc +
      "&fechaAccesoDesdeR=" +
        fechaAccesoDesdeR +
      "&fechaAccesoHastaR=" +
        fechaAccesoHastaR ,
      '',
      requestOptions
    ).pipe(
      map((response) => {
        return {
          filename: 'ReporteRepresentante.xlsx',
          data: new Blob([response], { type: 'application/vnd.ms-excel' })
        };
      })
    );
  }

  // Nuevo método para consultar el preregistro
  consultaPreRegistro(codigo: string): Observable<preRegistroConsultaDTO> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<preRegistroConsultaDTO>(`${this.baseUrlAcceso}/consultaPreRegistro`, { params });
  }
}
