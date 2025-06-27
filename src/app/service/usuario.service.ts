import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiurl } from '../enviroment/apiUrll';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${apiurl.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) { }

  obtenerTodasCiudades(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/ciudades`);
  }

  obtenerTodosSexos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sexos`);
  }

  obtenerEstadisticasEdad(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/edades`);
  }
}
