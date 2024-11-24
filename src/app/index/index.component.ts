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
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.nombreUsuario = this.tokenService.getUserNameComplete() || '{}';
    } else {
      this.isLogged = false;
      this.nombreUsuario = '';
    }

    this.intervalId = setInterval(() => {
      this.showNext();
    }, 5000);
  }

  showPrev(): void {
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : 1; // Volver al último comunicado
  }

  showNext(): void {
    this.currentIndex = (this.currentIndex < 1) ? this.currentIndex + 1 : 0; // Volver al primer comunicado
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
