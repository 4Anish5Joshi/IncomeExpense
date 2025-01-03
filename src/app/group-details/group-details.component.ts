import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { Network, DataSet, Options } from 'vis-network/standalone';
import 'hammerjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import * as XLSX from 'xlsx';
import { NgForm } from '@angular/forms';
interface NetworkNode {
  id: string;
  label: string;
  balance?: number;
}

interface NetworkEdge {
  id?: string;
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
  payer: string | null;
  participants: string[];
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss']
})
export class GroupDetailsComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef;

  group: Group | null = null;
  balances: { [member: string]: number } = {};
  expense: Expense = this.getInitialExpenseState();
  network?: Network;
  selectedTab: string = 'expenses';
  private previousTab: string = 'expenses';
  simplifiedDebts: Transfer[] = [];
  exportMembers: string[] = [];
  splitWithOptions: string[] = [];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.loadPaymentStatus();
    this.loadGroupData();
    this.calculateSimplifiedDebts();
    if (this.group && this.group.members) {
      this.exportMembers = ['All', ...this.group.members];
    }
    if (this.group && this.group.members) {
      this.splitWithOptions = ['All', ...this.group.members];
    }

    console.log("Paid by", this.expense.payer)
  }

  ngAfterViewInit() {
    if (this.selectedTab === 'insights') {
      this.loadCharts();
    }
  }

  ngAfterViewChecked() {
    if (this.selectedTab === 'insights' && this.previousTab !== 'insights') {
      setTimeout(() => {
        this.loadCharts();
        this.previousTab = 'insights';
      });
    } else if (this.selectedTab !== 'insights') {
      this.previousTab = this.selectedTab;
    }
  }

  ngOnDestroy() {
    this.destroyNetwork();
  }

  private getInitialExpenseState(): Expense {
    return {
      description: '',
      amount: null,
      payer: null,
      participants: []
    };
  }
  onSplitWithChange() {
    if (!this.group) return;

    // If 'All' is selected, include all members
    if (this.expense.participants.includes('All')) {
      // Remove 'All' from the selection and add all members
      this.expense.participants = this.group.members;
    }

    // Remove duplicates if any
    this.expense.participants = [...new Set(this.expense.participants)];
  }
  private async loadGroupData() {
    const groupName = this.route.snapshot.paramMap.get('name');

    if (!groupName) {
      await this.handleError('No group name found', 'Could not load group data');
      return;
    }

    try {
      const storedGroups = localStorage.getItem('groups');
      const storedBalances = localStorage.getItem('balances');

      if (!storedGroups || !storedBalances) {
        await this.handleError('No stored data found', 'Could not load group data');
        return;
      }

      const groups: Group[] = JSON.parse(storedGroups);
      const allBalances = JSON.parse(storedBalances);
      this.group = groups.find(g => g.name === groupName) || null;

      if (this.group) {
        this.balances = allBalances[groupName] || {};
      } else {
        await this.handleError('Group not found', 'The requested group could not be found');
      }
    } catch (error) {
      await this.handleError('Error parsing data', 'Error loading group data');
    }
  }

  private async handleError(logMessage: string, userMessage: string) {
    console.error(logMessage);
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `${userMessage}. Returning to groups list.`
    });
    this.router.navigate(['/split']);
  }

  // Modify your existing selectTab method
  selectTab(tab: string): void {
  if (tab === 'insights' && !this.isSubscribed) {
    this.showSubscriptionModal();
    return;
  }

  if (this.selectedTab === 'insights' && tab !== 'insights') {
    this.destroyNetwork();
  }
  this.selectedTab = tab;
  if (tab === 'insights') {
    setTimeout(() => this.loadCharts(), 100);
  }
}

  async settleUp() {
    const result = await Swal.fire({
      title: 'Settle Up?',
      text: 'This will clear all balances for the group. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, settle up!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed && this.group) {
      Object.keys(this.balances).forEach(key => this.balances[key] = 0);
      this.saveToStorage();
      this.simplifiedDebts = [];
      await Swal.fire('Success', 'All balances have been settled!', 'success');
    }
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

  async addExpense(): Promise<void> {
    // Check if group exists
    if (!this.group) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No group found!'
      });
      return;
    }

    // Form validation
    if (!this.expenseForm.valid) {
      this.markFormTouched();
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill all fields to add the expense!'
      });
      return;
    }

    // Destructure expense object
    const { description, amount, payer, participants } = this.expense;

    // Additional validation checks
    if (!description || !amount || !payer || participants.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill all fields to add the expense!'
      });
      return;
    }

    // Business logic validation
    if (!this.validateExpenseLogic()) {
      return;
    }

    try {
      // Add expense to group
      this.group.expenses.push({ ...this.expense });

      // Update balances
      this.updateBalances(amount, payer, participants);

      // Save to storage
      this.saveToStorage();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Expense Added',
        text: `Expense "${description}" has been added successfully!`
      });

      // Reset form
      this.expense = this.getInitialExpenseState();
      this.expenseForm.resetForm();

      // Reload charts if on insights tab
      if (this.selectedTab === 'insights') {
        setTimeout(() => this.loadCharts(), 0);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while adding the expense. Please try again.'
      });
    }
  }

  // Helper method for additional business logic validation
  private validateExpenseLogic(): boolean {
    const { payer, participants } = this.expense;

    // Ensure payer is included in participants
    if (payer && !participants.includes(payer)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Selection',
        text: 'The payer must be included in the split participants!'
      });
      return false;
    }

    return true;
  }

  // Helper method to mark all form controls as touched
  private markFormTouched(): void {
    Object.values(this.expenseForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  async removeExpense(index: number) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this expense?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed && this.group) {
      const expense = this.group.expenses[index];
      this.updateBalancesOnRemove(expense);
      this.group.expenses.splice(index, 1);
      this.saveToStorage();

      await Swal.fire({
        icon: 'success',
        title: 'Expense Removed',
        text: 'The expense has been removed successfully!'
      });

      if (this.selectedTab === 'insights') {
        setTimeout(() => this.loadCharts(), 0);
      }
    }
  }

  calculateContribution(member: string): number {
    return this.group?.expenses?.reduce((sum, expense) => {
      if (expense.participants.includes(member)) {
        sum += (expense.amount ?? 0) / (expense.participants.length || 1);
      }
      return sum;
    }, 0) || 0;
  }

  updateBalances(amount: number, payer: string, participants: string[]): void {
    const share = amount / participants.length;
    this.balances[payer] = (this.balances[payer] || 0) - amount;

    participants.forEach(participant => {
      if (participant !== payer) {
        this.balances[participant] = (this.balances[participant] || 0) + share;
      }
    });
  }

  updateBalancesOnRemove(expense: Expense): void {
    if (!expense.amount || !expense.payer) return;

    const share = expense.amount / expense.participants.length;
    this.balances[expense.payer] += expense.amount;

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

  private destroyNetwork() {
    if (this.network) {
      this.network.destroy();
      this.network = undefined;
    }
  }

  private createStackedLineBarChart(): void {
    if (!this.group) return;

    const members = this.group!.members;
    const labels = this.group.expenses.map(expense => expense.description || 'Expense'); // Label each expense
    const dataByMember = members.map(member => ({
      label: member,
      data: this.group!.expenses.map(expense =>
        expense.participants.includes(member) ? (expense.amount || 0) / expense.participants.length : 0
      ),
      backgroundColor: this.getRandomColor(),
      stack: 'expenses'
    }));

    const cumulativeBalances = members.map(member => this.balances[member] || 0);

    new Chart('stackedLineBarChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          ...dataByMember,
          {
            label: 'Cumulative Balance',
            type: 'line',
            data: cumulativeBalances,
            borderColor: '#FF5722',
            backgroundColor: 'rgba(255, 87, 34, 0.2)',
            borderWidth: 2,
            fill: true,
            yAxisID: 'yBalance'
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        responsive: true,
        scales: {
          x: { stacked: true },
          y: {
            type: 'linear',
            position: 'left',
            stacked: true,
            title: {
              display: true,
              text: 'Amount (₹)'
            }
          },
          yBalance: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Cumulative Balance (₹)'
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  // Helper to generate random colors for bars
  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private createRadarChart(): void {
    if (!this.group) return;

    const members = this.group.members;
    const contributions = members.map(member => this.calculateContribution(member));
    const balances = members.map(member => this.balances[member] || 0);

    new Chart('radarChart', {
      type: 'radar',
      data: {
        labels: members,
        datasets: [
          {
            label: 'Contributions',
            data: contributions,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            pointBackgroundColor: '#4CAF50',
            borderWidth: 2
          },
          {
            label: 'Balances',
            data: balances,
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            pointBackgroundColor: '#F44336',
            borderWidth: 2
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.raw as number;
                return `${context.dataset.label}: ₹${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: Math.min(...balances) - 10,
            suggestedMax: Math.max(...contributions) + 10,
            grid: { color: '#e0e0e0' },
            // title: { display: true, text: 'Amount (₹)' }
          }
        }
      }
    });
  }

  private createWaterfallChart(): void {
      if (!this.group) return;

      const expenseData = this.group.expenses.map(expense => ({
        label: expense.description,
        amount: expense.amount || 0
      }));

      const labels = expenseData.map(e => e.label);
      const data = expenseData.map(e => e.amount);

      // Calculate cumulative totals for the line chart
      const cumulativeData = data.reduce<number[]>((acc, amount, index) => {
        acc.push((acc[index - 1] || 0) + amount);
        return acc;
      }, []);

      new Chart('waterfallChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Expenses Breakdown',
              data,
              backgroundColor: data.map(value => (value > 0 ? '#4CAF50' : '#F44336')),
              borderColor: '#000000',
              borderWidth: 1,
              barPercentage: 0.6
            },
            {
              label: 'Cumulative Total',
              data: cumulativeData,
              type: 'line',
              borderColor: '#FF9800',
              borderWidth: 2,
              tension: 0.4, // Smooth line
              fill: false
            }
          ]
        },
        options: {
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: context => {
                  const value = context.raw as number;
                  return value > 0 ? `₹${value.toFixed(2)} (Positive)` : `₹${value.toFixed(2)} (Negative)`;
                }
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Expenses' } },
            y: { title: { display: true, text: 'Amount' } }
          }
        }
      });
    }

  isLoading: boolean = true;

  private loadCharts() {
    this.isLoading = true; // Start loading
    if (!this.networkContainer?.nativeElement || !this.group) {
        this.isLoading = false;
        return;
    }

    this.destroyNetwork();
    const transfers = this.calculateNetTransfers();

    const nodes = new DataSet<NetworkNode>(this.createNodes());
    const edges = new DataSet<NetworkEdge>(this.createEdges(transfers));

    try {
      this.network = new Network(
        this.networkContainer.nativeElement,
        { nodes, edges },
        this.getNetworkOptions()
      );
      // this.createWaterfallChart();
      this.createRadarChart();
      this.createStackedLineBarChart();
    } catch (error) {
      console.error('Error creating network:', error);
    } finally {
      this.isLoading = false; // Stop loading
    }
  }

  private calculateNetTransfers(): Transfer[] {
    const transfers: Transfer[] = [];

    // Initial transfers calculation
    this.group?.expenses.forEach(expense => {
      // Skip if amount or payer is null/undefined
      if (!expense.amount || !expense.payer) {
        return;
      }

      // TypeScript now knows expense.payer is definitely a string
      const payer: string = expense.payer;
      const share = expense.amount / expense.participants.length;

      expense.participants.forEach(participant => {
        if (participant !== payer) {
          transfers.push({
            from: participant,
            to: payer,  // Now using the non-null payer variable
            amount: share
          });
        }
      });
    });

    // Aggregate and simplify transfers
    const aggregatedTransfers = new Map<string, number>();

    transfers.forEach(transfer => {
      const key = `${transfer.from}-${transfer.to}`;
      const reverseKey = `${transfer.to}-${transfer.from}`;

      if (aggregatedTransfers.has(reverseKey)) {
        const existingAmount = aggregatedTransfers.get(reverseKey) ?? 0;

        if (existingAmount > transfer.amount) {
          aggregatedTransfers.set(reverseKey, existingAmount - transfer.amount);
        } else {
          aggregatedTransfers.delete(reverseKey);
          if (transfer.amount > existingAmount) {
            aggregatedTransfers.set(key, transfer.amount - existingAmount);
          }
        }
      } else {
        aggregatedTransfers.set(key, (aggregatedTransfers.get(key) ?? 0) + transfer.amount);
      }
    });

    // Convert back to Transfer array
    return Array.from(aggregatedTransfers).map(([key, amount]): Transfer => {
      const [from, to] = key.split('-');
      if (!from || !to) {
        throw new Error('Invalid transfer key format');
      }
      return {
        from,
        to,
        amount: Number(amount.toFixed(2))
      };
    });
  }
  @ViewChild('expenseForm') expenseForm!: NgForm;
  private createNodes(): NetworkNode[] {
    return this.group!.members.map(member => ({
      id: member,
      label: member,
      balance: this.balances[member] || 0
    }));
  }

  private createEdges(transfers: Transfer[]): NetworkEdge[] {
      return transfers.map((transfer, index) => ({
      id: `edge${index}`,
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      label: `₹${Math.abs(transfer.amount).toFixed(2)}`,
      arrows: 'to',
      color: '#2B7CE9',
      width: Math.log(Math.abs(transfer.amount)) + 1
    }));
  }

  private getNetworkOptions(): Options {
    return {
      nodes: {
        shape: 'circle',
        size: 25,
        font: { size: 14, color: '#000000' },
        borderWidth: 2,
        shadow: true,
        color: {
          background: '#ffffff',
          border: '#2B7CE9',
          highlight: { background: '#D2E5FF', border: '#2B7CE9' }
        }
      },
      edges: {
        smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
        font: { size: 12, align: 'middle' },
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
        zoomView: false,
        dragView: false,
        dragNodes: false
      }
    };
  }

  saveToStorage(): void {
    if (!this.group) return;

    const storedGroups = localStorage.getItem('groups');
    const storedBalances = localStorage.getItem('balances');

    if (storedGroups && storedBalances) {
      const groups: Group[] = JSON.parse(storedGroups);
      const allBalances = JSON.parse(storedBalances);

      const index = groups.findIndex(g => g.name === this.group?.name);
      if (index !== -1) {
        groups[index] = this.group;
        allBalances[this.group.name] = this.balances;

        localStorage.setItem('groups', JSON.stringify(groups));
        localStorage.setItem('balances', JSON.stringify(allBalances));
      }
    }
  }
  // Method to calculate total expenses
  getTotalExpenses(): number {
    return this.group?.expenses.reduce((total, expense) => total + (expense.amount || 0), 0) || 0;
  }
  // Method to simplify debts
  private calculateSimplifiedDebts(): void {
    const positiveBalances: Transfer[] = [];
    const negativeBalances: Transfer[] = [];

    // Separate positive and negative balances
    for (const member of Object.keys(this.balances)) {
      const balance = this.balances[member];
      if (balance > 0) {
        positiveBalances.push({ from: '', to: member, amount: balance });
      } else if (balance < 0) {
        negativeBalances.push({ from: member, to: '', amount: -balance });
      }
    }

    // Simplify debts
    this.simplifiedDebts = [];
    while (positiveBalances.length > 0 && negativeBalances.length > 0) {
      const creditor = positiveBalances[0];
      const debtor = negativeBalances[0];

      const amount = Math.min(creditor.amount, debtor.amount);
      this.simplifiedDebts.push({ from: debtor.from, to: creditor.to, amount });

      // Adjust balances
      creditor.amount -= amount;
      debtor.amount -= amount;

      // Remove fully settled balances
      if (creditor.amount === 0) positiveBalances.shift();
      if (debtor.amount === 0) negativeBalances.shift();
    }
  }


remind(key: string) {
  Swal.fire({
    title: `Are you sure you want to remind ${key}?`,
    text: "They will be notified to pay the amount.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remind them!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      console.log(`Remind ${key} to pay`);
      // Add logic to send the reminder (e.g., show a notification, email, etc.)
      Swal.fire(
        'Reminder Sent!',
        `${key} has been reminded to pay.`,
        'success'
      );
    } else {
      Swal.fire(
        'Reminder Cancelled',
        `${key} was not reminded.`,
        'info'
      );
    }
  });
}

settleBalance(key: string) {
  Swal.fire({
    title: `Do you want to settle the balance for ${key}?`,
    text: "Once settled, the balance will be updated.",
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Yes, settle it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      console.log(`Settle balance for ${key}`);
      // Add logic to settle the balance (e.g., adjust the balances or mark as settled)
      Swal.fire(
        'Balance Settled!',
        `The balance for ${key} has been settled.`,
        'success'
      );
    } else {
      Swal.fire(
        'Settlement Cancelled',
        `The balance for ${key} was not settled.`,
        'info'
      );
    }
  });
}

  goBack(): void {
    this.location.back();
  }

  showExportModal = false;
  selectedExportMember: string | null = null;

  // Opens the modal to select export options
  openExportOptions() {
    this.showExportModal = true;
  }

  // Closes the export modal
  closeExportModal() {
    this.showExportModal = false;
    this.selectedExportMember = null;
  }

  exportToExcel() {
    if (this.selectedExportMembers && this.selectedExportMembers.length > 0) {
      this.getFilteredExpenses();
      if (this.filteredExpenses.length > 0) {
        // Transform the data to include participants as a string
        const exportData = this.filteredExpenses.map(expense => ({
          description: expense.description,
          amount: expense.amount,
          payer: expense.payer,
          splitWith: expense.participants.join(', ') // Convert array to comma-separated string
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Expenses');

        // Generate filename based on selected members
        let filename = 'FilteredExpenses';
        if (this.selectedExportMembers.includes('All')) {
          filename += '-All';
        } else {
          filename += `-${this.selectedExportMembers.join(', ')}`;
        }
        filename += '.xlsx';

        XLSX.writeFile(workbook, filename);
        this.closeExportModal();
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'No Data',
          text: 'No data available to export for selected members!'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Selection Required',
        text: 'Please select at least one member to export.'
      });
    }
  }

  // Update getFilteredExpenses method
  getFilteredExpenses() {
    if (!this.group) return;

    if (this.selectedExportMembers.includes('All')) {
      this.filteredExpenses = this.group.expenses;
    } else if (this.selectedExportMembers.length > 0) {
      this.filteredExpenses = this.group.expenses.filter(expense =>
        this.selectedExportMembers.some(member =>
          expense.participants.includes(member) || expense.payer === member
        )
      );
    } else {
      this.filteredExpenses = [];
    }
  }

selectedExportMembers: string[] = [];
filteredExpenses: any[] = [];
showSubscribeModal: boolean = false;
isSubscribed: boolean = false;

showSubscriptionModal() {
  if (this.isSubscribed) {
    this.selectTab('insights');
  } else {
    this.showSubscribeModal = true;
  }
}

closeSubscriptionModal() {
  this.showSubscribeModal = false;
}

processPayment(plan: 'monthly' | 'yearly') {
  // Here you would normally integrate with a payment gateway
  // For demo purposes, we'll just show a success message
  Swal.fire({
    title: 'Processing Payment...',
    timer: 1500,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    }
  }).then(() => {
    this.isSubscribed = true;
    this.showSubscribeModal = false;
    this.selectTab('insights');
    Swal.fire({
      icon: 'success',
      title: 'Welcome to Premium!',
      text: 'You now have access to all premium features.',
      confirmButtonText: 'Start Exploring'
    });
  });
}
showPaymentModal = false;
selectedPlan: 'monthly' | 'yearly' | null = null;

// Open Payment Modal
openPaymentModal(plan: 'monthly' | 'yearly') {
  this.selectedPlan = plan;
  this.showSubscribeModal = false;
  this.showPaymentModal = true;
}

// Close Payment Modal
closePaymentModal() {
  this.showPaymentModal = false;
  this.selectedPlan = null;
}

// Simulate Payment Completion
completePayment(method: string) {
  Swal.fire({
    title: 'Processing Payment...',
    html: `<p>Using <strong>${method}</strong></p>`,
    timer: 1500,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
    willClose: () => {
      this.isSubscribed = true;
      this.showPaymentModal = false;
      this.selectedPlan = null;
      this.setPaymentStatus(true); // Mark payment as completed
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'You now have access to premium features.',
        confirmButtonText: 'Start Exploring'
      });
    }
  });
}
setPaymentStatus(status: boolean) {
  localStorage.setItem('paymentDone', status ? 'true' : 'false');
  this.isSubscribed = status;
}
loadPaymentStatus() {
  const paymentStatus = localStorage.getItem('paymentDone');
  this.isSubscribed = paymentStatus === 'true'; // `true` if the payment is done
}
}
