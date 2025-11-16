// Service Worker for Pills-Me PWA
// Handles push notifications and notification clicks

self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  if (event.data) {
    try {
      const data = event.data.json();
      console.log("Push notification data:", data);

      const options = {
        body: data.body || "You have a new notification",
        icon: data.icon || "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: data.id || "1",
          url: data.url || "/supplements",
          ...data.data,
        },
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        tag: data.tag || "pills-me-notification",
      };

      const title = data.title || "Pills-Me";

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
      console.error("Error parsing push notification data:", error);

      // Fallback notification if data parsing fails
      event.waitUntil(
        self.registration.showNotification("Pills-Me", {
          body: "You have a new notification",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          data: {
            dateOfArrival: Date.now(),
            url: "/supplements",
          },
        })
      );
    }
  } else {
    console.log("Push event received but no data");

    // Default notification when no data is provided
    event.waitUntil(
      self.registration.showNotification("Pills-Me", {
        body: "You have a new notification",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          dateOfArrival: Date.now(),
          url: "/supplements",
        },
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received:", event);

  event.notification.close();

  // Get the URL to open from notification data, default to supplements page
  const urlToOpen = event.notification.data?.url || "/supplements";

  // Handle action clicks if any
  if (event.action) {
    console.log("Notification action clicked:", event.action);

    switch (event.action) {
      case "view":
        // Open the app to the specified URL
        break;
      case "dismiss":
        // Just close the notification (already done above)
        return;
      default:
        console.log("Unknown action:", event.action);
    }
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // Check if there's already a window/tab open with our app
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            // Focus the existing window and navigate to the URL
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(function (error) {
        console.error("Error handling notification click:", error);
      })
  );
});

// Handle service worker installation
self.addEventListener("install", function () {
  console.log("Service worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", function (event) {
  console.log("Service worker activating...");
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle background sync (for future use)
self.addEventListener("sync", function (event) {
  console.log("Background sync event:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync tasks here
      Promise.resolve()
    );
  }
});

// Handle push subscription change
self.addEventListener("pushsubscriptionchange", function (event) {
  console.log("Push subscription changed");

  event.waitUntil(
    // Handle subscription change - could re-subscribe automatically
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: null, // This would need to be set properly
      })
      .then(function (subscription) {
        // Send new subscription to server
        console.log("New subscription:", subscription);
      })
      .catch(function (error) {
        console.error("Failed to re-subscribe:", error);
      })
  );
});
