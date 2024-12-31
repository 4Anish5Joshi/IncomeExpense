importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBQWbupgdvWeusAKl831E79ksI9oJH8B4Y",
  authDomain: "incexp-3ae02.firebaseapp.com",
  projectId: "incexp-3ae02",
  storageBucket: "incexp-3ae02.appspot.com",
  messagingSenderId: "469731461048",
  appId: "1:469731461048:web:f9d4a79abfffcae952f14d",
  measurementId: "G-W7311PDNZM"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
