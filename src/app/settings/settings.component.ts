import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  selectedTab: string = 'theme'; // Default selected tab
  darkMode: boolean = false;
  simplifyDebts: boolean = false;
  roundingOff: boolean = false;
  user = {
    name: '',
    password: ''
  };
  constructor(private location: Location) {}
  toggleTheme() {
    document.body.classList.toggle('dark-mode', this.darkMode);
    const mode = this.darkMode ? 'Dark Mode' : 'Light Mode';
    Swal.fire({
      title: `${mode} Enabled`,
      icon: 'info',
      timer: 1000,
      showConfirmButton: false,
    });
  }

  async updateProfile() {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to save these changes to your profile?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
      console.log('Profile updated:', this.user);
      Swal.fire({
        title: 'Profile Updated',
        text: 'Your profile has been updated successfully!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  async clearData() {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Clearing all data is irreversible. Proceed with caution!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
      console.log('Data cleared');
      Swal.fire({
        title: 'Data Cleared',
        text: 'All data has been successfully cleared.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  async logoutFromAllDevices() {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will log you out from all devices.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
      console.log('Logged out from all devices');
      Swal.fire({
        title: 'Logged Out',
        text: 'You have been logged out from all devices.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  activeFaqIndex: number | null = null; // Track active FAQ

  faqs = [
    { question: 'How do I update my profile?', answer: 'To update your profile, navigate to the Profile section in settings...' },
    { question: 'How do I enable dark mode?', answer: 'To enable dark mode, toggle the Dark Mode switch in Theme & Appearance...' },
    { question: 'How do I clear all data?', answer: 'To clear all data, go to the Data & Storage section in settings...' },
    { question: 'How can I contact support?', answer: 'To contact support, use the Contact Support form in Support & Help or email us...' },
  ];

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleFaq(index: number) {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  goBack() {
    this.location.back();
  }
}
