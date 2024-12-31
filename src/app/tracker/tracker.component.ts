import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Transaction } from '../transcation';
import { SharedService } from '../shared.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { GlobalWorkerOptions, pdfjsLib, version, getDocument } from 'pdfjs-dist';

@Component({
  selector: 'app-tracker',
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.scss']
})

export class TrackerComponent implements OnInit{
  // Properties
  currentType: any;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  amount: number | null = null;
  date: Date | null = null;
  name: string = '';
  filterMonth: string = '';
  totalIncome: number = 0;
  totalExpense: number = 0;
  balance: number = 0;
  editMode: boolean = false;
  editId: number | null = null;
  filterYear: number = new Date().getFullYear();
  selectedPaymentMode: any;
  isUserLoggedIn: boolean = false;
  @ViewChild('formElement') formElement!: ElementRef;
  paymentModes = [
    { value: 'UPI', label: 'UPI', icon: 'fas fa-mobile-alt' }, // Example icon for UPI
    { value: 'Cash', label: 'Cash', icon: 'fas fa-money-bill-wave' }, // Example icon for Cash
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'fas fa-university' } // Example icon for Bank Transfer
  ];
  months = [
    { value: '', label: 'All records' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];
  category = [
    { value: 'income', label: 'Income', icon: 'fas fa-arrow-up' }, // Example icon for Income
    { value: 'expense', label: 'Expense', icon: 'fas fa-arrow-down' } // Example icon for Expense
  ];
categories = [
  { value: 'Others', label: 'Others', icon: 'fas fa-ellipsis-h' },
  { value: 'Food and Dining', label: 'Food and Dining', icon: 'fas fa-utensils' },
  { value: 'Shopping', label: 'Shopping', icon: 'fas fa-shopping-cart' },
  { value: 'Travelling', label: 'Travelling', icon: 'fas fa-plane' },
  { value: 'Entertainment', label: 'Entertainment', icon: 'fas fa-film' },
  { value: 'Medical', label: 'Medical', icon: 'fas fa-plus-circle' },
  { value: 'Personal care', label: 'Personal care', icon: 'fas fa-user-circle' },
  { value: 'Education', label: 'Education', icon: 'fas fa-book' },
  { value: 'Bills', label: 'Bills', icon: 'fas fa-file-invoice' },
  { value: 'Investments', label: 'Investments', icon: 'fas fa-chart-line' },
  { value: 'Rent', label: 'Rent', icon: 'fas fa-home' },
  { value: 'Taxes', label: 'Taxes', icon: 'fas fa-money-bill' },
  { value: 'Insurance', label: 'Insurance', icon: 'fas fa-shield-alt' },
  { value: 'Gifts', label: 'Gifts', icon: 'fas fa-gift' },
  { value: 'Office', label: 'Office', icon: 'fas fa-building' }
];
selectedCategory: any;

  constructor(private sharedService: SharedService) {
    this.loadTransactions();
    this.calculateTotals();
    this.isUserLoggedIn = !!localStorage.getItem('trackerotplogin');
    // Set the PDF.js worker path using the GlobalWorkerOptions
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
  }

  ngOnInit(): void {

  }

  currentPage: number = 1; // Current page
  recordsPerPage: number = 10; // Number of records per page

  get paginatedTransactions() {
    const startIndex = (this.currentPage - 1) * this.recordsPerPage;
    return this.filteredTransactions.slice(startIndex, startIndex + this.recordsPerPage);
  }

  // Getter for total pages
  get totalPages() {
    return Math.ceil(this.filteredTransactions.length / this.recordsPerPage);
  }

  // Method to go to the next page
  nextPage() {
    if (this.currentPage * this.recordsPerPage < this.filteredTransactions.length) {
      this.currentPage++;
    }
  }

  // Method to go to the previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number) {
    this.currentPage = page;
  }
  onClick() {
    const categoryOptions = this.categories.map(category => {
      return {
        title: category.label,
        icon: category.icon,
        value: category.value
      };
    });

    Swal.fire({
      title: 'Select a Category',
      html: this.generateCategoryHtml(categoryOptions),
      showCancelButton: true,
      confirmButtonText: 'Select',
      preConfirm: () => {
        const selectedValue = document.querySelector('.category-item.selected')?.getAttribute('data-value');
        if (!selectedValue) {
          Swal.showValidationMessage('Please select a category');
        }
        return selectedValue;
      },
      customClass: {
        popup: 'category-popup' // Add custom class for styling
      },
      willOpen: () => {
        // Add click event to category items
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
          item.addEventListener('click', () => {
            // Remove selected class from all items
            categoryItems.forEach(i => i.classList.remove('selected'));
            // Add selected class to the clicked item
            item.classList.add('selected');
          });
        });
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.selectedCategory = result.value;
      }
    });
  }

  generateCategoryHtml(categories: any[]) {
    const rowSize = 5; // This can be adjusted if you want to control the number of items per row
    const rows = [];

    for (let i = 0; i < categories.length; i += rowSize) {
      const row = categories.slice(i, i + rowSize);
      rows.push(row);
    }

    return `
      <div style="display: flex; flex-direction: column; align-items: center;">
        ${rows.map(row => `
          <div style="display: flex; justify-content: center; margin-bottom: 10px; flex-wrap: wrap;">
            ${row.map(category => `
              <div
                class="category-item ${this.selectedCategory === category.value ? 'selected' : ''}"
                data-value="${category.value}"
                style="
                  display: flex; flex-direction: column; align-items: center;
                  margin: 0 10px; cursor: pointer;"
              >
                <i class="${category.icon}" style="font-size: 24px;"></i>
                <span style="margin-top: 5px;">${category.title}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  clearSelectedCategory() {
    this.selectedCategory = null;
  }


  loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    const storedYear = localStorage.getItem('filterYear');
    if (storedTransactions) {
      this.transactions = JSON.parse(storedTransactions);
    }
    if (storedYear) {
      this.filterYear = Number(storedYear);
    }
    this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
  }

  saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('filterYear', String(this.filterYear));
  }

  calculateTotals() {
    this.totalIncome = this.filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    this.totalExpense = this.filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    this.balance = this.totalIncome - this.totalExpense;
  }

  addTransaction() {
    if (!this.currentType || !this.amount || !this.date || !this.selectedCategory || !this.paymentModes) {
      // alert('Please fill all fields');
      Swal.fire({
        icon: 'error',
        title: 'Please enter all fields',
        timer: 1000,
        showConfirmButton: false
      });
      return;
    }
    else{

      Swal.fire({
        icon: 'success',
        title: 'Data added Successfully',
        timer: 900,
        showConfirmButton: false
      });
    }
    const newTransaction: Transaction = {
      id: this.transactions.length + 1, // Temporary ID, will be reassigned later
      type: this.currentType,
      amount: Number(this.amount),
      date: this.date,
      // name: this.name,
      paymentMode: this.selectedPaymentMode,
      category: this.selectedCategory
    };
    this.transactions.push(newTransaction);
    this.sortTransactions();
    this.saveTransactions();
    this.calculateTotals();
    this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
    this.resetForm();
    this.sharedService.setTransactions(this.transactions);

  }

  editTransaction(id: number) {
    const transaction = this.transactions.find((t) => t.id === id);
    if (transaction) {
      this.currentType = transaction.type;
      this.amount = transaction.amount;
      this.date = transaction.date;
      this.editMode = true;
      this.editId = id;
      this.selectedPaymentMode = transaction.paymentMode;
      this.selectedCategory = transaction.category;

      // Highlight the row
      setTimeout(() => {
        // Scroll to the form after 1 second
        if (this.formElement) {
          this.formElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Blink the card-shadow
        const cardElement = document.querySelector('.blinkedit');
        if (cardElement) {
          cardElement.classList.add('blinking'); // Add blinking class

          // Remove the blinking class after 3 seconds
          setTimeout(() => {
            cardElement.classList.remove('blinking'); // Remove blinking class after 3 seconds
          }, 1800);
        }
      }, 500); // 1-second delay for scrolling
    }
  }



  updateTransaction() {
    if (
      !this.currentType ||
      !this.amount ||
      !this.date ||
      !this.selectedCategory ||
      !this.editId ||
      !this.selectedPaymentMode
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Please enter all fields',
        timer: 1000,
        showConfirmButton: false
      });
      return;
    }
    const index = this.transactions.findIndex((t) => t.id === this.editId);
    this.transactions[index] = {
      id: this.editId,
      type: this.currentType,
      amount: Number(this.amount),
      date: this.date,
      // name: this.name,
      paymentMode: this.selectedPaymentMode,
      category: this.selectedCategory
    };

    const filteredIndex = this.filteredTransactions.findIndex(
      (t) => t.id === this.editId
    );
    this.filteredTransactions[filteredIndex] = this.transactions[index];

    this.sortTransactions();
    this.saveTransactions();
    this.calculateTotals();
    this.resetForm();
    this.sharedService.setTransactions(this.transactions);
  }

  deleteTransaction(id: number) {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.sortTransactions();
    this.saveTransactions();
    this.calculateTotals();
    this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
    this.sharedService.setTransactions(this.transactions);
  }

  filterTransactionsByMonth(month: string) {
    if (month === '') {
      // If 'All records' is selected, show all transactions from the current year
      this.filteredTransactions = this.transactions.filter(
        (t) => new Date(t.date).getFullYear() === this.filterYear
      );
    } else {
      const monthNumber = parseInt(month, 10);
      this.filteredTransactions = this.transactions.filter(
        (t) =>
          new Date(t.date).getMonth() === monthNumber &&
          new Date(t.date).getFullYear() === this.filterYear
      );
    }
    this.calculateTotals();
  }

  sortTransactions() {
    this.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.transactions.forEach((transaction, index) => {
      transaction.id = this.transactions.length - index;
    });
  }

  resetForm() {
    this.currentType = null;
    this.selectedCategory = null;
    this.amount = null;
    this.date = null;
    this.editMode = false;
    this.editId = null;
    this.selectedPaymentMode = null;
  }

  incrementYear() {
    this.filterYear++;
    this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
  }

  decrementYear() {
    this.filterYear--;
    this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
  }

  filterTransactionsByMonthAndYear(month: string, year: number) {
    if (month === '') {
      this.filteredTransactions = this.transactions.filter(
        (t) => new Date(t.date).getFullYear() === year
      );
    } else {
      const monthNumber = parseInt(month, 10);
      this.filteredTransactions = this.transactions.filter(
        (t) =>
          new Date(t.date).getMonth() === monthNumber &&
          new Date(t.date).getFullYear() === year
      );
    }
    this.calculateTotals();
  }
  @ViewChild('fileInput') fileInput!: ElementRef;

  ngAfterViewInit(): void {
    console.log(this.fileInput); // Now fileInput will be initialized
  }

  triggerFileInput(): void {
    console.log("Button clicked, opening file dialog...");
    // Trigger file input dialog
    this.fileInput.nativeElement.click();
  }

  exportToPdf(event: any): void {
    const fileInput = event.target as HTMLInputElement; // Accessing file input
    console.log("File input changed, files selected:", fileInput.files);

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No File Selected',
        text: 'Please upload a PDF file.',
        confirmButtonText: 'Okay'
      });
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      const arrayBuffer = e.target.result;

      try {
        console.log("PDF loaded, processing...");
        // Using the correct getDocument function here
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let extractedText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n';
        }
        console.log("Extracted Text: ", extractedText);
        // Process extracted text to find transactions
        const parsedTransactions = this.parsePdfTextForTransactions(extractedText);

        if (parsedTransactions.length > 0) {
          this.transactions.push(...parsedTransactions);
          console.log("Updated transactions list:", this.transactions);

          Swal.fire({
            icon: 'success',
            title: 'Transactions Added',
            text: `${parsedTransactions.length} transactions were added successfully.`,
            confirmButtonText: 'Okay'
          });
          this.filterTransactionsByMonthAndYear(this.filterMonth, this.filterYear);
        } else {
          Swal.fire({
            icon: 'info',
            title: 'No Relevant Data',
            text: 'The PDF does not contain any valid transaction data for auto-feed.',
            confirmButtonText: 'Okay'
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error Reading PDF',
          text: 'An error occurred while reading the PDF file. Please try again.',
          confirmButtonText: 'Okay'
        });
        console.error(error);
      }
    };

    reader.readAsArrayBuffer(file);
  }


  parsePdfTextForTransactions(extractedText: string): Transaction[] {
    const lines = extractedText.split('\n');
    const transactions: Transaction[] = [];
    const regex = /(\d{1,2} \w{3} \d{4})\s+(INR|USD)?\s*(-?\d+\.?\d*)\s+(.+?)\s+(TRANSFER|UPI|AUTO|CHEQUE|CREDIT|DEBIT)/i;

    lines.forEach(line => {
        const matches = regex.exec(line);
        if (matches) {
            const date = new Date(matches[1]);
            const amount = parseFloat(matches[3].replace(/,/g, ''));
            const description = matches[4];
            const type = amount > 0 ? 'income' : 'expense'; // Infer transaction type based on amount.

            transactions.push({
                id: transactions.length + 1,
                type: type,
                amount: Math.abs(amount), // Ensure amount is always positive.
                date: date,
                paymentMode: this.inferPaymentMode(description),
                category: this.inferCategory(description),
            });
        } else {
            console.warn("No match for line:", line);
        }
    });

    return transactions;
}
toggleType: string = 'income'; // Default to income

formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based.
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

inferCategory(description: string): string {
    if (/UPI|TRANSFER|PAYMENT/.test(description)) return 'Transfer';
    if (/CREDIT|DEPOSIT/.test(description)) return 'Income';
    if (/DEBIT|WITHDRAWAL/.test(description)) return 'Expense';
    return 'Others';
}

inferPaymentMode(description: string): "" | "UPI" | "Cash" | "Bank Transfer" {
  if (/UPI/.test(description)) return "UPI";
  if (/CHEQUE/.test(description)) return "Bank Transfer"; // Assume cheque transactions are bank transfers
  if (/CASH/.test(description)) return "Cash";
  return ""; // Default to empty string if no match
}



  exportToExcel() {
    if (this.paginatedTransactions.length === 0) {
      // Show SweetAlert if no data is available
      Swal.fire({
        icon: 'info',
        title: 'No Records',
        text: 'There is no data available to export.',
        confirmButtonText: 'Okay'
      });
    } else {
      // Prepare the data for export
      const dataToExport = this.paginatedTransactions.map((transaction) => ({
        ID: transaction.id,
        Category: transaction.category,
        Mode: transaction.paymentMode,
        Amount: transaction.amount,
        Date: transaction.date
      }));

      // Convert the data to Excel sheet and download the file
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook: XLSX.WorkBook = { Sheets: { 'Transactions': worksheet }, SheetNames: ['Transactions'] };
      XLSX.writeFile(workbook, 'Income_Expense_Tracker.xlsx');
    }
  }

}
