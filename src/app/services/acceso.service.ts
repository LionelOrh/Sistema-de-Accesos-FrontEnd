import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { preRegistroConsultaDTO } from '../models/PreRegistroConsultaDTO.model';

const baseUrlAcceso = AppSettings.API_ENDPOINT + '/registroAcceso';

@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  constructor(private http: HttpClient) {}

  // Consulta de reporte de accesos
  consultaReporteAccesos(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    estado: number, // Cambiado de idTipoAcceso a estado
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("estado", estado.toString()) // Cambiado
      .set("numDoc", numDoc);

    return this.http.get(baseUrlAcceso + "/consultaReporteAccesos", { params });
  }

  // Consulta de reporte de representantes
  consultaReporteRepresentante(numDoc: string): Observable<any> {
    const params = new HttpParams().set("numDoc", numDoc);

    return this.http.get(baseUrlAcceso + "/consultaReporteRepresentante", { params });
  }

  // Exportación a Excel para accesos
  generateDocumentExcel(
    login: string,
    fechaAccesoDesde: string,
    fechaAccesoHasta: string,
    estado: number, // Cambiado de idTipoAcceso a estado
    numDoc: string
  ): Observable<any> {
    const params = new HttpParams()
      .set("login", login)
      .set("fechaAccesoDesde", fechaAccesoDesde)
      .set("fechaAccesoHasta", fechaAccesoHasta)
      .set("estado", estado.toString()) // Cambiado
      .set("numDoc", numDoc);

    const headers = new HttpHeaders({
      'Accept': 'application/vnd.ms-excel'
    });

    const requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(
      baseUrlAcceso +
        "/reporteAccesos?login=" +
        login +
        "&fechaAccesoDesde=" +
        fechaAccesoDesde +
        "&fechaAccesoHasta=" +
        fechaAccesoHasta +
        "&numDoc=" +
        numDoc +
        "&estado=" +
        estado, // Cambiado
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
  generateDocumentExcelRepresentante(numDoc: string): Observable<any> {
    const params = new HttpParams().set("numDoc", numDoc);

    const headers = new HttpHeaders({
      'Accept': 'application/vnd.ms-excel'
    });

    const requestOptions: any = { headers: headers, responseType: 'blob' };

    return this.http.post(
      baseUrlAcceso + "/reporteRepresentante?numDoc=" + numDoc,
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
    return this.http.get<preRegistroConsultaDTO>(`${baseUrlAcceso}/consultaPreRegistro`, { params });
  }
}
