import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { Transaction } from '../transcation';
import { SharedService } from '../shared.service';
import { SavingModalComponent } from '../saving-modal/saving-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit {
  private transactions: Transaction[] = [];
  totalIncome: number = 0;
  totalExpense: number = 0;
  totalSaved: number = 0;
  expectedAnnualSaving: number | null = null;
  selectedYear: number = new Date().getFullYear();
  circumference: number = Math.PI * 100;
  achievedSavingPercentage: number = 0;

  private doughnutChart!: Chart<'doughnut', number[], string>;
  private barChart!: Chart<'bar', number[], string>;
  private lineChart!: Chart<'line', number[], string>;
  constructor(
    private sharedService: SharedService,
    private dialog: MatDialog
  ) {}

  openSavingModal(): void {
  const dialogRef = this.dialog.open(SavingModalComponent, {
    width: '280px',
    data: { expectedAnnualSaving: this.getExpectedAnnualSaving() },
  });

  dialogRef.afterClosed().subscribe((result) => {
  if (result !== null && result !== undefined) {
    this.setExpectedAnnualSaving(result);
    this.calculateTotals(); // Recalculate totals after the expected saving is updated
  }
});
}

ngOnInit(): void {
  const storedTransactions = localStorage.getItem('transactions');
  if (storedTransactions) {
    this.transactions = JSON.parse(storedTransactions);
  }
  this.expectedAnnualSaving = this.getExpectedAnnualSaving();
  this.calculateTotals();
  this.renderDoughnutChart();
  this.renderBarChart();
  this.renderLineChart();
  this.updateCharts();
  this.renderPolarAreaChart();
  this.renderComparisonChart();
}



    getExpectedAnnualSaving(): number | null {
  const storedExpectedAnnualSaving = localStorage.getItem(
    'expectedAnnualSaving' + this.selectedYear
  );
  return storedExpectedAnnualSaving ? Number(storedExpectedAnnualSaving) : null;
}

setExpectedAnnualSaving(saving: number): void {
  localStorage.setItem('expectedAnnualSaving' + this.selectedYear, saving.toString());
  this.expectedAnnualSaving = saving;
}

  calculateTotals() {
    this.totalIncome = 0;
    this.totalExpense = 0;
    for (let transaction of this.transactions) {
      let year = new Date(transaction.date).getFullYear();
      if (year === this.selectedYear) {
        if (transaction.type === 'income') {
          this.totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          this.totalExpense += transaction.amount;
        }
      }
    }
    this.totalSaved = this.totalIncome - this.totalExpense;
    if (this.expectedAnnualSaving) {
      this.achievedSavingPercentage = Math.min(
        (this.totalSaved / this.expectedAnnualSaving) * 100,
        100
      );
      // Convert the percentage to a string with 2 decimal places
      this.achievedSavingPercentage = parseFloat(
        this.achievedSavingPercentage.toFixed(2)
      );
    } else {
      this.achievedSavingPercentage = 0;
    }
  }

  renderDoughnutChart() {
    let totalIncome = 0;
    let totalExpense = 0;
    for (let transaction of this.transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpense += transaction.amount;
      }
    }

    if (this.doughnutChart) {
      this.doughnutChart.data.datasets[0].data = [totalIncome, totalExpense];
      this.doughnutChart.update();
    } else {
      this.doughnutChart = new Chart('doughnutChart', {
        type: 'doughnut',
        data: {
          labels: ['Income', 'Expense'],
          datasets: [{
            label: 'Income vs Expense',
            data: [totalIncome, totalExpense],
            backgroundColor: [
              'rgba(0, 123, 255, 0.8)', // More opaque for premium feel
              'rgba(220, 53, 69, 0.8)',
            ],
            borderColor: ['rgba(0, 123, 255, 1)', 'rgba(220, 53, 69, 1)'],
            borderWidth: 2, // Thicker borders
            hoverOffset: 10, // Slightly lift on hover
          }],
        },
        options: {
          plugins: {
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker tooltip background
              titleColor: '#fff',
              bodyColor: '#fff',
            },
            legend: {
              labels: {
                font: {
                  size: 14,
                  weight: 'bold',
                },
              },
            },
          },
        },
      });
    }
  }

  renderPolarAreaChart() {
    let categoryTotals: { [key: string]: number } = {};

    // Calculate the total amount for each category
    for (let transaction of this.transactions) {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = 0;
      }
      categoryTotals[transaction.category] += transaction.amount;
    }

    // Create arrays for the labels and data
    let labels = Object.keys(categoryTotals);
    let data = Object.values(categoryTotals);

    // Create the chart
    let polarAreaChart = new Chart('polarAreaChart', {
      type: 'polarArea',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.4)',
              'rgba(54, 162, 235, 0.4)',
              'rgba(255, 206, 86, 0.4)',
              'rgba(75, 192, 192, 0.4)',
              'rgba(153, 102, 255, 0.4)',
              'rgba(255, 159, 64, 0.4)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
    });
  }

  renderBarChart() {
    let incomeByMonth = new Array(12).fill(0);
    let expenseByMonth = new Array(12).fill(0);

    for (let transaction of this.transactions) {
      let month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
        incomeByMonth[month] += transaction.amount;
      } else if (transaction.type === 'expense') {
        expenseByMonth[month] += transaction.amount;
      }
    }

    if (this.barChart) {
      this.barChart.data.datasets[0].data = incomeByMonth;
      this.barChart.data.datasets[1].data = expenseByMonth;
      this.barChart.update();
    } else {
      this.barChart = new Chart('barChart', {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Income',
            data: incomeByMonth,
            backgroundColor: 'rgba(0, 192, 26, 0.8)',
            borderColor: 'rgba(0, 192, 26, 1)',
            borderWidth: 2,
          }, {
            label: 'Expense',
            data: expenseByMonth,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
          }],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)', // Subtle grid lines
              },
              ticks: {
                font: {
                  size: 14,
                },
              },
            },
            x: {
              grid: {
                display: false, // Remove vertical grid lines
              },
              ticks: {
                font: {
                  size: 14,
                },
              },
            },
          },
          plugins: {
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
            },
            legend: {
              display: false, // Hide the legend
            },
          },
          layout: {
            padding: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            },
          },
        },
      });
    }
  }

  renderLineChart() {
    let incomeByMonth = new Array(12).fill(0);
    let expenseByMonth = new Array(12).fill(0);

    for (let transaction of this.transactions) {
      let month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
        incomeByMonth[month] += transaction.amount;
      } else if (transaction.type === 'expense') {
        expenseByMonth[month] += transaction.amount;
      }
    }

    if (this.lineChart) {
      this.lineChart.data.datasets[0].data = incomeByMonth;
      this.lineChart.data.datasets[1].data = expenseByMonth;
      this.lineChart.update();
    } else {
      this.lineChart = new Chart('lineChart', {
        type: 'line',
        data: {
          labels: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ],
          datasets: [
            {
              label: 'Income',
              data: incomeByMonth,
              backgroundColor: 'rgba(0, 123, 255, 0.2)', // semi-transparent blue
              borderColor: 'rgba(0, 123, 255, 1)',
              borderWidth: 1,
              fill: true, // fill the area under the line
              tension: 0.3,
            },
            {
              label: 'Expense',
              data: expenseByMonth,
              backgroundColor: 'rgba(220, 53, 69, 0.4)', // semi-transparent red
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1,
              fill: true, // fill the area under the line
              tension: 0.3,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }

  updateCharts() {
    this.calculateTotals();
    this.renderDoughnutChart();
    this.renderBarChart();
    this.renderPolarAreaChart();
    this.renderLineChart();
    this.renderComparisonChart();
  }

  getYears() {
    let years: number[] = [];

    for (let transaction of this.transactions) {
      let year = new Date(transaction.date).getFullYear();
      if (!years.includes(year)) {
        years.push(year);
      }
    }
    return years;
  }

  incrementYear() {
  this.selectedYear++;
  this.expectedAnnualSaving = this.getExpectedAnnualSaving();
  this.updateCharts();
}

decrementYear() {
  this.selectedYear--;
  this.expectedAnnualSaving = this.getExpectedAnnualSaving();
  this.updateCharts();
}

addExpectedAnnualSaving() {
  const saving = prompt('Enter your expected annual saving:');
  if (saving) {
    this.setExpectedAnnualSaving(Number(saving));
    this.calculateTotals(); // Recalculate totals after the expected saving is updated
  }
}

editExpectedAnnualSaving() {
  const saving = prompt(
    'Edit your expected annual saving:',
    this.getExpectedAnnualSaving()?.toString() ?? ''
  );
  if (saving) {
    this.setExpectedAnnualSaving(Number(saving));
    this.calculateTotals(); // Recalculate totals after the expected saving is updated
  }
}

saveExpectedAnnualSaving() {
  const savingInput = document.getElementById(
    'savingInput'
  ) as HTMLInputElement;
  if (savingInput.value) {
    this.setExpectedAnnualSaving(Number(savingInput.value));
    this.calculateTotals(); // Recalculate totals after the expected saving is updated
  }
}

  resetExpectedAnnualSaving(): void {
  localStorage.removeItem('expectedAnnualSaving' + this.selectedYear);
  this.expectedAnnualSaving = null;
  this.updateCharts();
}
renderComparisonChart() {
  const incomeByMonth: number[] = new Array(12).fill(0);
  const expenseByMonth: number[] = new Array(12).fill(0);

  for (let transaction of this.transactions) {
      const month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
          incomeByMonth[month] += transaction.amount;
      } else if (transaction.type === 'expense') {
          expenseByMonth[month] += transaction.amount;
      }
  }

  const comparisonChart = new Chart('comparisonChart', {
      type: 'bar',
      data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
              {
                  label: 'Income',
                  data: incomeByMonth,
                  backgroundColor: 'rgba(0, 192, 26, 0.8)',
              },
              {
                  label: 'Expense',
                  data: expenseByMonth,
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
              },
          ],
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true,
              },
          },
      },
  });
}
}
