import { Component, OnInit } from '@angular/core';
import { Opcion } from '../security/opcion';
import { TokenService } from '../security/token.service';
import { Router } from '@angular/router'; 
import { RouterLink, RouterOutlet } from '@angular/router';
import { AppMaterialModule } from '../app.material.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private tokenService: TokenService, private router: Router) {  
    console.log("MenuComponent >>> constructor >>> " + this.tokenService.getToken());
  }

  ngOnInit() {
    console.log("MenuComponent >>> ngOnInit >>> ");

    this.opcRegistroEntradaSalida = this.tokenService.getOpciones().filter(x => x.tipo === 1);
    this.opcRegistroInvitado = this.tokenService.getOpciones().filter(x => x.tipo === 2);
    this.opcConsultaReporte= this.tokenService.getOpciones().filter(x => x.tipo === 3);
    this.opcAccesoProveedor = this.tokenService.getOpciones().filter(x => x.tipo === 4);

    console.log("MenuComponent >>> ngOnInit >>> " + this.tokenService.getToken());
    this.isLogged = !!this.tokenService.getToken(); 
    console.log(`MenuComponent >>> this.isLogged = ${this.isLogged} >>> `);
  }

  onLogOut(): void {
    this.tokenService.logOut();
    this.router.navigate(['/login']);
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
