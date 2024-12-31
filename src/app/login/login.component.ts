import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {

  phoneNumber: string = '';
  otpSent: boolean = false;
  generatedOTP: string = '';
  enteredOTP: string = '';
  invalidOTP: boolean = false;
  showToaster: boolean = false;
  toasterMessage: string = '';
  toasterType: string = ''; // 'success' or 'error'

  @ViewChild('register', { static: false }) registerBtn!: ElementRef;
  @ViewChild('login', { static: false }) loginBtn!: ElementRef;
  @ViewChild('container', { static: false }) container!: ElementRef;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    if (this.registerBtn && this.loginBtn && this.container) {
      this.registerBtn.nativeElement.addEventListener('click', () => {
        this.container.nativeElement.classList.add('active');
      });

      this.loginBtn.nativeElement.addEventListener('click', () => {
        this.container.nativeElement.classList.remove('active');
      });
    }
  }

  // Function to simulate sending OTP
  sendOTP(): void {
    if (this.phoneNumber.length === 10) {
      this.generatedOTP = Math.floor(100000 + Math.random() * 900000).toString(); // Generate random 6-digit OTP
      this.showToasterMessage(`Your OTP is ${this.generatedOTP}`, 'success');
      this.otpSent = true;
      this.invalidOTP = false;

      // Show OTP for 5 seconds
      setTimeout(() => {
        this.closeToaster(); // Optionally hide the toaster after 5 seconds
      }, 5000); // Change to 5000 milliseconds for 5 seconds
    } else {
      this.showToasterMessage('Please enter a valid 10-digit phone number', 'error');
    }
  }

  // Function to verify OTP
  verifyOTP(): void {
    if (this.enteredOTP === this.generatedOTP) {
      this.showToasterMessage('OTP Verified! Redirecting...', 'success');
      localStorage.setItem('trackerotplogin', this.phoneNumber);
      setTimeout(() => {
        this.router.navigate(['/home']); // Route to home on success
      }, 2000); // Delay to show toaster before redirecting
    } else {
      this.showToasterMessage('Invalid OTP. Please try again.', 'error');
      this.invalidOTP = true;
    }
  }

  // Function to show custom toaster message
  showToasterMessage(message: string, type: string): void {
    this.toasterMessage = message;
    this.toasterType = type;
    this.showToaster = true;

    // Hide toaster after 3 seconds
    setTimeout(() => {
      this.showToaster = false;
    }, 4000);
  }

  // Close toaster manually
  closeToaster(): void {
    this.showToaster = false;
  }

  // Back button functionality
  goBackToSignIn(): void {
    this.otpSent = false; // Reset to show the sign-in form again
    this.enteredOTP = ''; // Clear the entered OTP
  }

  guestLogin(){
    localStorage.removeItem('trackerotplogin');
    this.router.navigate(['/home']);
  }
}
