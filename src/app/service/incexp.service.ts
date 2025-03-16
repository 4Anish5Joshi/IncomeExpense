import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // ✅ Import environment

@Injectable({
  providedIn: 'root'
})
export class IncexpService {
  protected apiUrl = environment.apiUrl; // ✅ Use environment variable
  protected authUrl = environment.authUrl; // ✅ Use environment variable
  
  constructor(private http: HttpClient) { }

  // ✅ Use this for login instead of calling HTTP in the component
  guestLogin(phoneNumber: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.authUrl}login`, { phoneNumber });
  }

  getTransactions(headers: HttpHeaders): Observable<any> {
    return this.http.get(`${this.apiUrl}transactions`, { headers });
  }
}
