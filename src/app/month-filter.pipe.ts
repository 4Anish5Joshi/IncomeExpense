import { Pipe, PipeTransform } from '@angular/core';
import { Transaction } from './transcation';

@Pipe({
  name: 'monthFilter'
  
})
export class MonthFilterPipe implements PipeTransform {
  
  transform(transactions: Transaction[], month: number): Transaction[] {
    return transactions.filter(t => new Date(t.date).getMonth() === month);
  }
}
