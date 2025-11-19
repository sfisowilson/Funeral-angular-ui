import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ErrorType<Error> = Error;

export const customInstance = <T>(
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
  },
  options?: any
): Observable<T> => {
  const http = inject(HttpClient);

  let httpParams = new HttpParams();
  if (config.params) {
    Object.keys(config.params).forEach((key) => {
      const value = config.params![key];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.append(key, value.toString());
      }
    });
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    ...config.headers,
  });

  const url = `${environment.apiUrl}${config.url}`;

  switch (config.method) {
    case 'GET':
      return http.get<T>(url, { headers, params: httpParams });
    case 'POST':
      return http.post<T>(url, config.data, { headers, params: httpParams });
    case 'PUT':
      return http.put<T>(url, config.data, { headers, params: httpParams });
    case 'DELETE':
      return http.delete<T>(url, { headers, params: httpParams });
    case 'PATCH':
      return http.patch<T>(url, config.data, { headers, params: httpParams });
    default:
      throw new Error(`Unsupported method: ${config.method}`);
  }
};
