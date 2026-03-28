// Firebase Cloud Messaging service worker
// Handles background push notifications when the app is not in the foreground.
// This file must be served from the root (/) — Next.js serves public/ files at root.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected via self.__FIREBASE_CONFIG__ from the
// PushNotificationToggle component via a meta tag / inline script.
// Fallback to self.__FIREBASE_CONFIG__ set by the page before SW registration.
const config = self.__FIREBASE_CONFIG__ || {};

if (config.apiKey) {
  firebase.initializeApp(config);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title = "Mama's Pantry", body = "" } = payload.notification ?? {};
    self.registration.showNotification(title, {
      body,
      icon: "/next.svg",
      badge: "/next.svg",
      data: payload.data,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
