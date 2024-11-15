import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
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
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  isLogged = false;
  isLoginFail = false;
  isLoading = false;
  loginUsuario: LoginUsuario = {};
  roles: string[] = [];
  errMsj!: string;
  showPassword = false;
  


  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log("constructor >> constructor >>> " + this.tokenService.getToken());
   }

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

onLogin(): void {
    this.isLoading = true; // Inicia el estado de carga

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
          this.router.navigate(['/']);
          

          console.log("onLogin() >> token >>> " + this.tokenService.getToken());
          console.log("onLogin() >> setUserName >>> " + this.tokenService.getUserName());
          console.log("onLogin() >> setUserNameComplete >>> " + this.tokenService.getUserNameComplete());
          console.log("onLogin() >> idUsuario >>> " + this.tokenService.getUserId());
          console.log("onLogin() >> roles >>> " + this.tokenService.getAuthorities());
          console.log("onLogin() >> opciones >>> INICIO >> " );
          this.tokenService.getOpciones().forEach(obj => {
            console.log(" >> onLogin() >> " + obj.nombre); 
          });
          console.log("onLogin() >> opciones >>> FIN >> " );

          this.isLoading = false; // Finaliza el estado de carga
      },
      (err: any) => {
          this.isLogged = false;
          this.errMsj = err.message;
          console.log(err);
          this.isLoading = false; // Finaliza el estado de carga en caso de error

          if (err.status === 401) {
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: "Usuario no Autorizado",
              });
          }
      }
    );
}



}