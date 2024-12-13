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
  imports: [AppMaterialModule, FormsModule, CommonModule],
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
  isInputValid = false;
  showAlert = false;
  alertMessage = '';
  failedAttempts: number = 0;  // Contador de intentos fallidos
  blockTime: number = 0;       // Tiempo en que el usuario podrá reintentar el login
  lockTime: number = 1;        // Tiempo de bloqueo en minutos
  remainingTime: number = 0;   // Tiempo restante para reintentar
  timerInterval: any;          // Referencia al setInterval para actualizar el tiempo restante
  formattedTime = ''; // Tiempo formateado en mm:ss

  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    if (this.tokenService.getToken()) {
      this.isLogged = true;
      this.isLoginFail = false;
      this.roles = this.tokenService.getAuthorities();
    }
  
    // Recuperar el estado desde localStorage
    const storedFailedAttempts = localStorage.getItem('failedAttempts');
    const storedBlockTime = localStorage.getItem('blockTime');
    const storedRemainingTime = localStorage.getItem('remainingTime');
  
    if (storedFailedAttempts) {
      this.failedAttempts = parseInt(storedFailedAttempts, 10);
    }
  
    if (storedBlockTime) {
      this.blockTime = parseInt(storedBlockTime, 10);
    }
  
    if (storedRemainingTime) {
      this.remainingTime = parseInt(storedRemainingTime, 10);
      this.updateRemainingTime(); // Actualiza la UI con el tiempo restante
    }
  
    // Verifica si el bloqueo aún está en vigencia
    this.checkBlockTime();
  }

  private saveStateToLocalStorage() {
    localStorage.setItem('failedAttempts', this.failedAttempts.toString());
    localStorage.setItem('blockTime', this.blockTime.toString());
    localStorage.setItem('remainingTime', this.remainingTime.toString());
  }
  
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval); // Limpiamos el intervalo cuando el componente se destruye
    }
  }

  private updateRemainingTime() {
    const currentTime = new Date().getTime();
    const remainingMs = this.blockTime - currentTime;
    this.remainingTime = remainingMs > 0 ? remainingMs : 0;
  
    // Actualiza el tiempo formateado en mm:ss
    const minutes = Math.floor(this.remainingTime / 60000);
    const seconds = Math.floor((this.remainingTime % 60000) / 1000);
    this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
    if (this.remainingTime <= 0) {
      clearInterval(this.timerInterval);
      this.failedAttempts = 0; // Reinicia intentos fallidos
      this.showAlert = false;
      this.alertMessage = '';
  
      // Limpiar el estado en localStorage
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('blockTime');
      localStorage.removeItem('remainingTime');
    }
  
    // Guardar el estado actualizado
    this.saveStateToLocalStorage();
  }
  

  private startTimer() {
    this.updateRemainingTime(); // Calcula el tiempo inicial
    this.timerInterval = setInterval(() => this.updateRemainingTime(), 1000); // Actualiza cada segundo
  }

  checkBlockTime() {
    if (this.failedAttempts >= 3) {
      const currentTime = new Date().getTime();
      if (currentTime < this.blockTime) {
        this.startTimer(); // Inicia el cronómetro
        this.showAlert = true;
        this.alertMessage = `Has superado el límite de intentos. Podrás intentar nuevamente en ${this.lockTime} minutos.`;
      } else {
        this.failedAttempts = 0;
        this.showAlert = false;
        this.alertMessage = '';
      }
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

  canAttemptLogin(): boolean {
    if (this.failedAttempts >= 3) {
      const currentTime = new Date().getTime();
      if (currentTime < this.blockTime) {
        return false;
      } else {
        this.failedAttempts = 0;
        return true;
      }
    }
    return true;
  }

  // Aquí vamos a separar la validación de los campos y los intentos fallidos
  checkInputValidity(): void {
    if (this.failedAttempts >= 3) {
      this.isInputValid = false;
      return;
    }

    const loginField = this.loginUsuario.login || '';
    const passwordField = this.loginUsuario.password || '';

    // Validación de caracteres especiales
    if (/[^a-zA-Z0-9]/.test(loginField) || /[^a-zA-Z0-9]/.test(passwordField)) {
      this.isInputValid = false;
      this.alertMessage = 'No se permiten caracteres especiales';
      this.showAlert = true;
    }
    // Validación de espacios en blanco
    else if (loginField.includes(' ') || passwordField.includes(' ')) {
      this.isInputValid = false;
      this.alertMessage = 'No se permiten espacios en blanco';
      this.showAlert = true;
    }
    // Si ambos campos son válidos, habilitamos el botón
    else if (loginField.length > 0 && passwordField.length > 0) {
      this.isInputValid = true;
      this.alertMessage = ''; // Elimina el mensaje cuando la entrada es válida
      this.showAlert = false; // Oculta la alerta flotante
    } else {
      this.isInputValid = false; // Si algún campo está vacío, el botón se deshabilita
    }
  }

  onLogin(): void {
    this.isLoading = true;
  
    if (!this.canAttemptLogin()) {
      this.isLoading = false;
      return;
    }
  
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
  
        // Guardar estado al iniciar sesión correctamente
        this.saveStateToLocalStorage();
      },
      (err: any) => {
        this.isLogged = false;
        this.errMsj = err.message;
        this.isLoading = false;
  
        if (err.status === 401) {
          this.failedAttempts++;
          if (this.failedAttempts >= 3) {
            this.blockTime = new Date().getTime() + this.lockTime * 60000;
            this.loginUsuario = { login: '', password: '' };
            Swal.fire({
              icon: 'error',
              title: 'Acceso bloqueado',
              text: `Has superado el límite de intentos. Podrás intentar nuevamente en ${this.lockTime} minutos.`,
            });
            this.checkBlockTime();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `Usuario o contraseña incorrecta. Intentos restantes: ${3 - this.failedAttempts}`,
            });
          }
  
          // Guardar el estado actualizado en localStorage
          this.saveStateToLocalStorage();
        }
      }
    );
  }
}