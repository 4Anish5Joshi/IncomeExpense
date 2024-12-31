import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';// Import TooltipItem from Chart.js
import { Network, DataSet, Node, Edge, Options } from 'vis-network/standalone';
import 'hammerjs';


interface NetworkNode extends Node {
  id: string;
  label: string;
  balance?: number;
}

interface NetworkEdge extends Edge {
  from: string;
  to: string;
  amount: number;
  arrows?: string;
  color?: string;
  label?: string;
  width?: number;
}

interface Group {
  name: string;
  members: string[];
  expenses: Expense[];
}

interface Expense {
  description: string;
  amount: number | null;
  payer: string;
  participants: string[];
}

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit {
  group: Group | null = null;
  balances: { [member: string]: number } = {};
  expense: Expense = {
    description: '',
    amount: null,
    payer: '',
    participants: []
  };
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef;
  network: Network | undefined;// Declare the network graph
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    const groupName = this.route.snapshot.paramMap.get('name');

    console.log('Group name from URL:', groupName);

    if (!groupName) {
      console.log('No group name found in URL');
      this.router.navigate(['/']);
      return;
    }

    const storedGroups = localStorage.getItem('groups');
    const storedBalances = localStorage.getItem('balances');

    if (!storedGroups || !storedBalances) {
      console.log('No stored data found');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not load group data. Returning to groups list.'
      }).then(() => {
        this.router.navigate(['/split']);
      });
      return;
    }

    try {
      const groups: Group[] = JSON.parse(storedGroups);
      const allBalances = JSON.parse(storedBalances);

      this.group = groups.find(g => g.name === groupName) || null;

      if (this.group) {
        this.balances = allBalances[groupName] || {};
        this.loadCharts(); // Move chart loading here after group data is loaded
      } else {
        console.log('Group not found in stored data');
        Swal.fire({
          icon: 'error',
          title: 'Group Not Found',
          text: 'The requested group could not be found. Returning to groups list.'
        }).then(() => {
          this.router.navigate(['/']);
        });
      }
    } catch (error) {
      console.error('Error parsing stored data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error loading group data. Returning to groups list.'
      }).then(() => {
        this.router.navigate(['/split']);
      });
    }
  }

  settleUp() {
    Swal.fire({
      title: 'Settle Up?',
      text: 'This will clear all balances for the group. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, settle up!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear balances
        if (this.group && this.balances) {
          Object.keys(this.balances).forEach(key => (this.balances[key] = 0));
          Swal.fire('Success', 'All balances have been settled!', 'success');
        }
      }
    });
  }

  // Modify the charts array type
// private charts: Chart[] = [];

ngAfterViewInit() {
  // Load charts after the view is initialized
  if (this.selectedTab === 'insights') {
    this.loadCharts();
  }
}

private previousTab: string = 'expenses';

ngAfterViewChecked() {
  // Only reload charts if we've switched TO the insights tab
  if (this.selectedTab === 'insights' && this.previousTab !== 'insights') {
    setTimeout(() => {
      this.loadCharts();
      this.previousTab = 'insights';
    }, 0);
  } else if (this.selectedTab !== 'insights') {
    this.previousTab = this.selectedTab;
  }
}
ngOnDestroy() {
  this.destroyNetwork();
}

private destroyNetwork() {
  if (this.network) {
    this.network.destroy();
    this.network = undefined;
  }
}
loadCharts() {
  if (!this.networkContainer?.nativeElement || !this.group) {
    console.error('Network container or group is not available!');
    return;
  }

  // Destroy existing network before creating a new one
  this.destroyNetwork();

  // Calculate net transfers
  const transfers = this.calculateNetTransfers();

  // Prepare node data
  const nodeData: NetworkNode[] = this.group.members.map(member => ({
    id: member,
    label: member,
    balance: this.balances[member] || 0
  }));

  // Prepare edge data
  const edgeData: NetworkEdge[] = transfers.map(transfer => ({
    from: transfer.from,
    to: transfer.to,
    amount: transfer.amount,
    label: `₹${Math.abs(transfer.amount).toFixed(2)}`,
    arrows: 'to',
    color: '#2B7CE9',
    width: Math.log(Math.abs(transfer.amount)) + 1
  }));

  // Create DataSets
  const nodes = new DataSet<NetworkNode>(nodeData);
  const edges = new DataSet<NetworkEdge>(edgeData);

  // Network options
  // Network options
  const options: Options = {
    nodes: {
      shape: 'circle',
      size: 25,
      font: {
        size: 14,
        color: '#000000'
      },
      borderWidth: 2,
      shadow: true,
      color: {
        background: '#ffffff',
        border: '#2B7CE9',
        highlight: {
          background: '#D2E5FF',
          border: '#2B7CE9'
        }
      }
    },
    edges: {
      smooth: {
        enabled: true,
        type: 'continuous',
        roundness: 0.5
      },
      font: {
        size: 12,
        align: 'middle'
      },
      width: 2
    },
    physics: {
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 200,
        springConstant: 0.04
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: false,  // Disable zooming
      dragView: false,  // Disable panning (dragging view)
      dragNodes: false  // Disable dragging individual nodes
    }
  };

  try {
    // Create new network
    this.network = new Network(
      this.networkContainer.nativeElement,
      { nodes, edges },
      options
    );
  } catch (error) {
    console.error('Error creating network:', error);
  }
}

calculateNetTransfers() {
  const transfers: { from: string; to: string; amount: number }[] = [];

  this.group?.expenses.forEach(expense => {
    if (!expense.amount) return;

    const share = expense.amount / expense.participants.length;
    expense.participants.forEach(participant => {
      if (participant !== expense.payer) {
        transfers.push({
          from: participant,
          to: expense.payer,
          amount: share
        });
      }
    });
  });

  const aggregatedTransfers = new Map<string, number>();

  transfers.forEach(transfer => {
    const key = `${transfer.from}-${transfer.to}`;
    const reverseKey = `${transfer.to}-${transfer.from}`;

    if (aggregatedTransfers.has(reverseKey)) {
      const existingAmount = aggregatedTransfers.get(reverseKey)!;
      if (existingAmount > transfer.amount) {
        aggregatedTransfers.set(reverseKey, existingAmount - transfer.amount);
      } else {
        aggregatedTransfers.delete(reverseKey);
        aggregatedTransfers.set(key, transfer.amount - existingAmount);
      }
    } else {
      aggregatedTransfers.set(key, (aggregatedTransfers.get(key) || 0) + transfer.amount);
    }
  });

  const finalTransfers: { from: string; to: string; amount: number }[] = [];
  aggregatedTransfers.forEach((amount, key) => {
    const [from, to] = key.split('-');
    finalTransfers.push({ from, to, amount });
  });

  return finalTransfers;
}



calculateContribution(member: string): number {
  return this.group?.expenses?.reduce((sum, expense) => {
    if (expense.participants.includes(member)) {
      sum += (expense.amount ?? 0) / (expense.participants.length || 1); // Avoid division by 0
    }
    return sum;
  }, 0) || 0; // Fallback to 0 if group or expenses are null
}


  toggleSelectAll(event: any): void {
    if (!this.group) return;

    if (event.target.checked) {
      this.expense.participants = [...this.group.members];
    } else {
      this.expense.participants = [];
    }
  }

  isAllSelected(): boolean {
    if (!this.group) return false;
    return this.expense.participants.length === this.group.members.length;
  }

  addExpense(): void {
    if (!this.group) return;

    const { description, amount, payer, participants } = this.expense;

    if (!description || !amount || !payer || participants.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill all fields to add the expense!'
      });
      return;
    }

    // Add expense to group
    this.group.expenses.push({
      description,
      amount,
      payer,
      participants
    });

    // Update balances
    this.updateBalances(amount, payer, participants);
    this.saveToStorage();

    Swal.fire({
      icon: 'success',
      title: 'Expense Added',
      text: `Expense "${description}" has been added successfully!`
    });

    this.clearForm();
    if (this.selectedTab === 'insights') {
      setTimeout(() => this.loadCharts(), 0);
    }
  }

  removeExpense(index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this expense?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Proceed with removal
        if (!this.group) return;
        const expense = this.group.expenses[index];
        this.updateBalancesOnRemove(expense);
        this.group.expenses.splice(index, 1);
        this.saveToStorage();

        Swal.fire({
          icon: 'success',
          title: 'Expense Removed',
          text: 'The expense has been removed successfully!'
        });
      }
    });
    // If on insights tab, refresh the chart
  if (this.selectedTab === 'insights') {
    setTimeout(() => this.loadCharts(), 0);
  }
  }
  selectedTab: string = 'expenses'; // Default tab

  // Other properties and methods...

  selectTab(tab: string): void {
    if (this.selectedTab === 'insights' && tab !== 'insights') {
      // Leaving insights tab
      this.destroyNetwork();
    }

    this.selectedTab = tab;

    if (tab === 'insights') {
      // Give DOM time to render container
      setTimeout(() => {
        this.loadCharts();
      }, 100);
    }
  }

  updateBalances(amount: number, payer: string, participants: string[]): void {
    const share = amount / participants.length;

    // Update payer balance
    this.balances[payer] = (this.balances[payer] || 0) - amount;

    // Update participants' balances
    participants.forEach(participant => {
      if (participant !== payer) {
        this.balances[participant] = (this.balances[participant] || 0) + share;
      }
    });
  }

  updateBalancesOnRemove(expense: Expense): void {
    if (!expense.amount) return;

    const share = expense.amount / expense.participants.length;

    // Revert payer balance
    this.balances[expense.payer] += expense.amount;

    // Revert participants' balances
    expense.participants.forEach(participant => {
      if (participant !== expense.payer) {
        this.balances[participant] -= share;
      }
    });
  }

  getBalanceKeys(): string[] {
    return Object.keys(this.balances)
      .filter(key => this.balances[key] !== 0)
      .sort((a, b) => this.balances[b] - this.balances[a]);
  }

  clearForm(): void {
    this.expense = {
      description: '',
      amount: null,
      payer: '',
      participants: []
    };
  }

  saveToStorage(): void {
    if (!this.group) return;

    // Get all groups
    const storedGroups = localStorage.getItem('groups');
    const storedBalances = localStorage.getItem('balances');

    if (storedGroups && storedBalances) {
      const groups: Group[] = JSON.parse(storedGroups);
      const allBalances = JSON.parse(storedBalances);

      // Update current group
      const index = groups.findIndex(g => g.name === this.group?.name);
      if (index !== -1) {
        groups[index] = this.group;
        allBalances[this.group.name] = this.balances;

        // Save back to storage
        localStorage.setItem('groups', JSON.stringify(groups));
        localStorage.setItem('balances', JSON.stringify(allBalances));
      }
    }
  }

  goBack(): void {
    this.location.back();
  }
}
