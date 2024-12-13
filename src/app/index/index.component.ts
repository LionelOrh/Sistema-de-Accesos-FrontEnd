import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenService } from '../security/token.service';
import { AppMaterialModule } from '../app.material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy {

  isLogged = false;
  nombreUsuario = "";
  currentIndex = 0;
  intervalId: any;

  constructor(private tokenService: TokenService) { }

  ngOnInit() {
    // Verificar el token y el nombre del usuario
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.nombreUsuario = this.tokenService.getUserNameComplete() || '{}';
    } else {
      this.isLogged = false;
      this.nombreUsuario = '';
    }

    // Inicialización del carrusel de comunicados
    this.intervalId = setInterval(() => {
      this.showNext();
    }, 5000);

    // Cargar el chatbot de Landbot
    this.loadLandbot();
  }

  // Función para cargar el script de Landbot
  loadLandbot() {
    const script = document.createElement('script');
    script.src = 'https://cdn.landbot.io/landbot-3/landbot-3.0.0.js';
    script.async = true;
    script.onload = () => {
      const landbot = new (window as any).Landbot.Livechat({
        configUrl: 'https://storage.googleapis.com/landbot.site/v3/H-2718108-87N7HRVZ7YCV84KM/index.json',
      });
    };
    document.body.appendChild(script);
  }

  // Función para mostrar el comunicado previo
  showPrev(): void {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : 1; // Volver al último comunicado
  }

  // Función para mostrar el siguiente comunicado
  showNext(): void {
    this.currentIndex = (this.currentIndex < 1) ? this.currentIndex + 1 : 0; // Volver al primer comunicado
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando se destruye el componente
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}