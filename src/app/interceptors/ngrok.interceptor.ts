import { HttpInterceptorFn } from '@angular/common/http';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  const modified = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return next(modified);
};
