import { Injectable } from '@angular/core';
import { AppSettings } from '../app.settings';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Proveedor } from '../models/proveedor.model';
import { Observable } from 'rxjs';

const baseUrlProveedor = AppSettings.API_ENDPOINT + '/proveedor';

@Injectable({
  providedIn: 'root'
})

export class ProveedorService {
  constructor(private http: HttpClient) { }

  // Método para consultar proveedores
  consultarProveedores(filtro: string): Observable<Proveedor[]> {
    let params = new HttpParams();
    if (filtro) {
      params = params.set('filtro', filtro);
    }

    return this.http.get<Proveedor[]>(`${baseUrlProveedor}/consultar`, { params });
  }

  registrarProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${baseUrlProveedor}/registrar`, proveedor);
}

}