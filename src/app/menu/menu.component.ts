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
  imports: [RouterLink, AppMaterialModule, FormsModule, CommonModule],
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
  
  //Detalles extras
  horaActual = '';
  saludo = '';
  private timerInterval: any; // Referencia al intervalo

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruya
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateTime() {
    const now = new Date();
    this.horaActual = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const hour = now.getHours();
    
    if (hour < 6) {
      this.saludo = '¡Buenas madrugadas!';
    } else if (hour < 12) {
      this.saludo = '¡Buenos días!';
    } else if (hour < 18) {
      this.saludo = '¡Buenas tardes!';
    } else {
      this.saludo = '¡Buenas noches!';
    }
  }
  
  get fechaActual(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return now.toLocaleDateString('es-ES', options); 
  }

  //Fin de detalles extras

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
       this.updateTime();
       this.timerInterval = setInterval(() => this.updateTime(), 1000);
  }

  getUserPhoto(idUsuario: number) {
    this.fotoUsuario = `http://localhost:8090/url/usuario/${idUsuario}`;
  }
  
  onLogOut(): void {
    Swal.fire({
      title: 'Cerrar sesión',
      text: '¿Estás seguro de que quieres salir?',
      icon: 'question', 
      showCancelButton: true,
      confirmButtonColor: '#28a745', 
      cancelButtonColor: '#d33', 
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      background: '#f4f4f9',
      color: '#282828',
      padding: '3em',
      width: '40%',
      customClass: {
        title: 'swal-title', 
        confirmButton: 'swal-confirm-btn', 
        cancelButton: 'swal-cancel-btn',
        container: 'swal-container'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading(); 
          },
          background: 'rgba(0, 0, 0, 0',
          customClass: {
            title: 'swal-loading-title',
          }
        });
  
        setTimeout(() => {
          this.tokenService.logOut();
          this.router.navigate(['/login']);
          
          Swal.close();
        }, 2000); 
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
