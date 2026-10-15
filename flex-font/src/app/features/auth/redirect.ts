import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ selector: 'app-redirect', template: '' })
export class RedirectPage {
  constructor() {
    const auth = inject(AuthService);
    void inject(Router).navigateByUrl(auth.homeFor(auth.user()?.role), { replaceUrl: true });
  }
}
