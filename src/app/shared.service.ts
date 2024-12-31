import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from './transcation';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private transactions = new BehaviorSubject<Transaction[]>([]);

  setTransactions(data: Transaction[]) {
    this.transactions.next(data);
  }

  getTransactions() {
    return this.transactions.asObservable();
  }
}
