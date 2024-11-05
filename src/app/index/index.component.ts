import { Component, OnInit } from '@angular/core';
import { TokenService } from '../security/token.service';
import { Router, RouterLink } from '@angular/router';
import { AppMaterialModule } from '../app.material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';
import { Opcion } from '../security/opcion';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [AppMaterialModule, RouterLink,FormsModule, CommonModule, MenuComponent],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {

  isLogged = false;
  nombreUsuario = "";
  opcRegistroEntradaSalida: Opcion[] = [];
  opcRegistroVisita: Opcion[] = [];
  opcConsultaReporte: Opcion[] = [];
  opcAccesoProveedor: Opcion[] = [];

  constructor(private tokenService: TokenService, private router: Router) {  
    console.log("MenuComponent >>> constructor >>> " + this.tokenService.getToken());
  }

  ngOnInit() {
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.nombreUsuario = this.tokenService.getUserNameComplete() || '{}';
    } else {
      this.isLogged = false;
      this.nombreUsuario = '';
      this.router.navigate(['/login']);
    }
    console.log("MenuComponent >>> ngOnInit >>> ");

    this.opcRegistroEntradaSalida = this.tokenService.getOpciones().filter(x => x.tipo === 1);
    this.opcRegistroVisita = this.tokenService.getOpciones().filter(x => x.tipo === 2);
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
