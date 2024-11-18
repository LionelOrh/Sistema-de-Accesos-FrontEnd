import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Opcion } from '../security/opcion';
import { TokenService } from '../security/token.service';
import { Router } from '@angular/router';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AppMaterialModule } from '../app.material.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Usuario } from '../models/usuario.model';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AppMaterialModule, FormsModule, CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  isLogged = false;
  opcRegistroEntradaSalida: Opcion[] = [];
  opcRegistroInvitado: Opcion[] = [];
  opcConsultaReporte: Opcion[] = [];
  opcAccesoProveedor: Opcion[] = [];
  nombreUsuario = "";
  fotoUsuario = "";
  idUsuario = 0;  
  
  get saludo(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
        return '¡Buenos días!';
    } else if (hour < 18) {
        return '¡Buenas tardes!';
    } else {
        return '¡Buenas noches!';
    }
}

  get horaActual(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');  
    const minutes = now.getMinutes().toString().padStart(2, '0'); 
    return `${hours}:${minutes}`;
  }

  // Getter para la fecha actual en formato: Día de la semana, Día de mes, Año
  get fechaActual(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return now.toLocaleDateString('es-ES', options); // Formato español
  }
  constructor(private tokenService: TokenService, private router: Router, private http: HttpClient) {
    console.log("MenuComponent >>> constructor >>> " + this.tokenService.getToken());
  }

  ngOnInit() {
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.nombreUsuario = this.tokenService.getUserNameComplete();
      this.idUsuario = this.tokenService.getUserId();
      this.getUserPhoto(this.idUsuario);

      this.opcRegistroEntradaSalida = this.tokenService.getOpciones().filter(x => x.tipo === 1);
      this.opcRegistroInvitado = this.tokenService.getOpciones().filter(x => x.tipo === 2);
      this.opcConsultaReporte = this.tokenService.getOpciones().filter(x => x.tipo === 3);
      this.opcAccesoProveedor = this.tokenService.getOpciones().filter(x => x.tipo === 4);
    } else {
      this.isLogged = false;
      this.nombreUsuario = '';
      this.router.navigate(['/login']);
    }
    console.log("MenuComponent >>> ngOnInit >>> ");
  }

  getUserPhoto(idUsuario: number) {
    // Ahora solo asignamos la URL del backend para la foto
    this.fotoUsuario = `http://localhost:8090/url/usuario/${idUsuario}`;
  }
  
  onLogOut(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar el mensaje de carga
        Swal.fire({
          title: 'Cerrando sesión...',
          text: 'Por favor, espera...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
  
        // Simulamos un retraso para mostrar la carga (en un caso real sería el tiempo de procesamiento)
        setTimeout(() => {
          // Llamar al método de cierre de sesión
          this.tokenService.logOut();
          // Redirigir al login
          this.router.navigate(['/login']);
          
          // Cerrar el mensaje de carga
          Swal.close();
        }, 2000); // 2 segundos de retraso antes de redirigir
      }
    });
  }
  

  obtenerRol(): string {
    if (this.opcConsultaReporte.length > 0) {
      return 'Supervisor';
    } else if (this.opcRegistroEntradaSalida.length > 0) {
      return 'Personal de Seguridad';
    } else {
      return 'Rol Desconocido';
    }
  }
}
