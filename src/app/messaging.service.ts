import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private messaging: Messaging;
  notifications: { title: string; body: string }[] = []; // Store notifications

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyBQWbupgdvWeusAKl831E79ksI9oJH8B4Y",
      authDomain: "incexp-3ae02.firebaseapp.com",
      projectId: "incexp-3ae02",
      storageBucket: "incexp-3ae02.appspot.com",
      messagingSenderId: "469731461048",
      appId: "1:469731461048:web:f9d4a79abfffcae952f14d",
      measurementId: "G-W7311PDNZM"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.messaging = getMessaging(app);

    // Fetch the FCM token
    this.getToken();

    // Load notifications from local storage
    this.loadNotifications();

    // Listen for messages and store them
    this.listenForMessages();
  }

  // Load notifications from local storage
  loadNotifications(): void {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      this.notifications = JSON.parse(storedNotifications);
    }
  }

  // Save notifications to local storage
  saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Get the FCM token
  getToken(): void {
    getToken(this.messaging, { vapidKey: 'BBobHTVn0t5EJmDZwcJBAaid2XjWpP1nF14zNfIGFxsqPZ0lGk8XtEyWBcbu3-NlPo9tSET07Y-X1mRiLqn2sDs' })
      .then((currentToken) => {
        if (currentToken) {
          // console.log('FCM Token:', currentToken);
        } else {
          console.log('No registration token available.');
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
      });
  }

  // Listen for incoming messages and store them in notifications array
  listenForMessages(): void {
    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Message received: ', payload);

      const title = payload.notification?.title || 'No title';
      const body = payload.notification?.body || 'No body';

      // Store the notification
      this.notifications.push({ title, body });
      this.saveNotifications();  // Save notifications to local storage

    });
  }
}
