import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../security/auth.service';
import { LoginUsuario } from '../security/login-usuario';
import { TokenService } from '../security/token.service';
import { AppMaterialModule } from '../app.material.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AppMaterialModule, FormsModule, CommonModule, MenuComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isLogged = false;
  isLoginFail = false;
  isLoading = false;
  loginUsuario: LoginUsuario = {};
  roles: string[] = [];
  errMsj!: string;
  showPassword = false;
  isInputValid = true; // Para verificar si los campos son válidos
  showAlert = false; // Para mostrar la alerta flotante
  alertMessage = ''; // Mensaje que se mostrará en la alerta flotante

  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.isLoginFail = false;
      this.roles = this.tokenService.getAuthorities();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  validateInput(event: KeyboardEvent): void {
    const input = event.key;
    const regex = /^[a-zA-Z0-9]+$/;

    if (!regex.test(input)) {
      event.preventDefault(); // Previene la entrada si no es una letra o número
      this.isInputValid = false; // Actualiza el estado de validez
      this.alertMessage = 'No se permiten caracteres especiales'; // Error de caracteres no válidos
      this.showAlert = true; // Muestra la alerta flotante
    } else {
      this.isInputValid = true;
      this.alertMessage = ''; // Limpia el mensaje si el carácter es válido
      this.showAlert = false; // Oculta la alerta flotante
    }

    // Previene espacios en blanco
    if (input === ' ') {
      event.preventDefault();
      this.alertMessage = 'No se permiten espacios en blanco';
      this.showAlert = true;
    }
  }

  checkInputValidity(): void {
    const loginField = this.loginUsuario.login || '';
    const passwordField = this.loginUsuario.password || '';

    if (/[^a-zA-Z0-9]/.test(loginField) || /[^a-zA-Z0-9]/.test(passwordField)) {
      this.isInputValid = false;
      this.alertMessage = 'No se permiten caracteres especiales';
      this.showAlert = true;
    } else {
      this.isInputValid = true;
      this.alertMessage = ''; // Elimina el mensaje cuando la entrada es válida
      this.showAlert = false; // Oculta la alerta flotante
    }
  }

  onLogin(): void {
    this.isLoading = true;

    this.authService.login(this.loginUsuario).subscribe(
      (data: any) => {
        this.isLogged = true;
        this.tokenService.setToken(data.token);
        this.tokenService.setUserName(data.login);
        this.tokenService.setUserNameComplete(data.nombreCompleto);
        this.tokenService.setAuthorities(data.authorities);
        this.tokenService.setUserId(data.idUsuario);
        this.tokenService.setOpciones(data.opciones);

        this.roles = data.authorities;
        this.router.navigate(['/', 'home']);
        this.isLoading = false;
      },
      (err: any) => {
        this.isLogged = false;
        this.errMsj = err.message;
        this.isLoading = false;

        if (err.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Usuario o contraseña incorrecta',
          });
        }
      }
    );
  }
}
