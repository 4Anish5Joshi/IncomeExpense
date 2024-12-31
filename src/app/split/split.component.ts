import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

interface Group {
  name: string;
  members: string[];
  expenses: Expense[];
  isOpen: boolean;
}

interface Expense {
  description: string;
  amount: number;
  payer: string;
  participants: string[];
}

@Component({
  selector: 'app-split',
  templateUrl: './split.component.html',
  styleUrls: ['./split.component.scss']
})
export class SplitComponent implements OnInit {
  members: string[] = ['Alice', 'Bob', 'Charlie', 'David']; // Example group members
  groups: Group[] = [];
  balances: { [groupName: string]: { [member: string]: number } } = {};
  constructor(private router: Router) {}
  newGroup = {
    name: '',
    members: [] as string[]
  };

  newMemberName: string = '';

  expense = {
    description: '',
    amount: null as number | null,
    payer: '',
    participants: [] as string[]
  };

  isPopupVisible: boolean = false;

  ngOnInit(): void {
    const storedGroups = localStorage.getItem('groups');
    const storedBalances = localStorage.getItem('balances');

    if (storedGroups) {
      this.groups = JSON.parse(storedGroups);
    }
    if (storedBalances) {
      this.balances = JSON.parse(storedBalances);
    }
  }

  openPopup(): void {
    this.isPopupVisible = true;
  }

  closePopup(): void {
    this.isPopupVisible = false;
    this.newGroup = { name: '', members: [] };
  }

  addGroup(): void {
    if (!this.newGroup.name || this.newGroup.members.length === 0) {
      this.closePopup();
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please provide a group name and select at least one member!'
      });
      return;
    }

    const existingGroup = this.groups.find(group =>
      group.name.toLowerCase() === this.newGroup.name.toLowerCase()
    );

    if (existingGroup) {
      this.closePopup();
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Group',
        text: `A group with the name "${this.newGroup.name}" already exists! Please choose a different name.`
      });
      return;
    }

    this.groups.push({
      name: this.newGroup.name,
      members: this.newGroup.members,
      expenses: [],
      isOpen: true
    });

    this.balances[this.newGroup.name] = this.newGroup.members.reduce((acc, member) => {
      acc[member] = 0;
      return acc;
    }, {} as { [member: string]: number });

    this.saveToStorage();

    Swal.fire({
      icon: 'success',
      title: 'Group Added',
      text: `Group "${this.newGroup.name}" has been added successfully!`
    });

    this.closePopup();
  }

  toggleSelectAll(group: Group, event: any): void {
    if (event.target.checked) {
      this.expense.participants = [...group.members];
    } else {
      this.expense.participants = [];
    }
  }

  isAllSelected(group: Group): boolean {
    return this.expense.participants.length === group.members.length;
  }

  addMember(): void {
    if (this.newMemberName.trim()) {
      this.newGroup.members.push(this.newMemberName.trim());
      this.newMemberName = '';
    }
  }

  removeMember(member: string): void {
    const index = this.newGroup.members.indexOf(member);
    if (index >= 0) {
      this.newGroup.members.splice(index, 1);
    }
  }

  toggleAccordion(group: Group): void {
    group.isOpen = !group.isOpen;
  }

  addExpense(groupName: string): void {
    const { description, amount, payer, participants } = this.expense;

    if (!description || !amount || !payer || participants.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill all fields to add the expense!'
      });
      return;
    }

    const group = this.groups.find(g => g.name === groupName);
    if (group) {
      group.expenses.push({
        description,
        amount,
        payer,
        participants
      });

      this.updateBalances(groupName, amount, payer, participants);
      this.saveToStorage();

      Swal.fire({
        icon: 'success',
        title: 'Expense Added',
        text: `Expense "${description}" has been added successfully!`
      });

      this.clearForm();
    }
  }

  updateBalances(groupName: string, amount: number, payer: string, participants: string[]): void {
    const groupBalances = this.balances[groupName];
    const share = amount / participants.length;

    // Update payer balance (payer is spending the money)
    groupBalances[payer] -= amount;

    // Update participants' balances (each participant owes a share)
    participants.forEach(participant => {
      if (participant !== payer) {
        groupBalances[participant] += share;
      }
    });
  }

  clearForm(): void {
    this.expense = {
      description: '',
      amount: null,
      payer: '',
      participants: []
    };
  }

  removeExpense(groupName: string, index: number): void {
    const group = this.groups.find(g => g.name === groupName);
    if (group) {
      const expense = group.expenses[index];
      this.updateBalancesOnRemove(groupName, expense);
      group.expenses.splice(index, 1);
      this.saveToStorage();

      Swal.fire({
        icon: 'success',
        title: 'Expense Removed',
        text: 'The expense has been removed successfully!'
      });
    }
  }

  updateBalancesOnRemove(groupName: string, expense: Expense): void {
    const groupBalances = this.balances[groupName];
    const share = expense.amount / expense.participants.length;

    // Revert payer balance
    groupBalances[expense.payer] += expense.amount;

    // Revert participants' balances
    expense.participants.forEach(participant => {
      if (participant !== expense.payer) {
        groupBalances[participant] -= share;
      }
    });
  }

  getBalanceKeys(groupName: string): string[] {
    return Object.keys(this.balances[groupName] || {});
  }

  deleteGroup(groupName: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete the group "${groupName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(result => {
      if (result.isConfirmed) {
        this.groups = this.groups.filter(group => group.name !== groupName);
        delete this.balances[groupName];
        this.saveToStorage();
        this.router.navigate(['/split']);
      }
    });
  }
  viewGroupDetails(group: Group): void {
    // First save the current state to ensure it's up to date
    this.saveToStorage();

    // Navigate to the group details page
    this.router.navigate(['/groups', group.name]);
  }

  private saveToStorage(): void {
      localStorage.setItem('groups', JSON.stringify(this.groups));
      localStorage.setItem('balances', JSON.stringify(this.balances));
    }
}

