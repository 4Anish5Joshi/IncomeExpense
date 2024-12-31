import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MessagingService } from '../messaging.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit{
  isDarkTheme: boolean = false;
  dropdownOpen: boolean = false;
  isUserLoggedIn: boolean = false;
  constructor(private router: Router, private messagingService: MessagingService){
    this.isUserLoggedIn = !!localStorage.getItem('trackerotplogin');
  }

  ngOnInit(): void {
  }
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();

    const title = this.isDarkTheme ? 'Dark mode enabled' : 'Light mode enabled';
    const imageUrl = this.isDarkTheme ? 'assets/batman.png' : 'assets/superman.png';

    Swal.fire({
      title: title,
      html: `<img src="${imageUrl}" alt="Theme Logo" width="125" height="125">`,
      icon: 'info',
      timer: 1000,
      showConfirmButton: false,
    });
  }

  applyTheme() {
    const body = document.body;
    if (this.isDarkTheme) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }



  logout() {
    // Show confirmation dialog
    Swal.fire({
      title: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true, // Show cancel button
      confirmButtonColor: '#3085d6', // Customize confirm button color
      cancelButtonColor: '#d33', // Customize cancel button color
      confirmButtonText: 'Yes', // Confirm button text
      cancelButtonText: 'No' // Cancel button text
    }).then((result) => {
      if (result.isConfirmed) {
        // Handle logout logic here
        Swal.fire({
          title: 'Logged out!',
          text: 'You have been logged out successfully.',
          icon: 'success',
          showConfirmButton: false, // Hide the confirm button
          timer: 1500 // Auto-close after a set time (1500ms)
        });

        this.router.navigate(['/login']);
        localStorage.removeItem('trackerotplogin');
        this.isUserLoggedIn = false;
      }
    });
  }
}
