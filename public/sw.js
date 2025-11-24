// Service Worker for Pills-Me PWA
// Handles push notifications and notification clicks

self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  if (event.data) {
    try {
      const data = event.data.json();
      console.log("Push notification data:", data);

      // Determine redirect URL based on notification type
      let redirectUrl = data.url;
      if (!redirectUrl) {
        // If no explicit URL, determine based on notification type
        if (data.tag && data.tag.includes("refill")) {
          // Refill notification - redirect to supplement detail page
          const supplementId = data.data?.supplementId || data.supplementId;
          redirectUrl = supplementId
            ? `/supplements/${supplementId}`
            : "/todos";
        } else if (data.tag && data.tag.includes("app-update")) {
          // App update notification - redirect to todos
          redirectUrl = "/todos";
        } else {
          // Default to todos for reminder notifications and all other types
          redirectUrl = "/todos";
        }
      }

      const options = {
        body: data.body || "You have a new notification",
        icon: data.icon || "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: data.id || "1",
          url: redirectUrl,
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
            url: "/todos",
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
          url: "/todos",
        },
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received:", event);

  event.notification.close();

  // Get the URL to open from notification data
  // Determine URL based on notification type if not explicitly set
  let urlToOpen = event.notification.data?.url;

  if (!urlToOpen) {
    // Fallback logic based on notification tag or data
    const tag = event.notification.tag || "";
    const supplementId = event.notification.data?.supplementId;

    if (tag.includes("refill") && supplementId) {
      // Refill notification - redirect to supplement detail page
      urlToOpen = `/supplements/${supplementId}`;
    } else if (tag.includes("app-update")) {
      // App update notification - redirect to todos
      urlToOpen = "/todos";
    } else {
      // Default to todos for reminder notifications
      urlToOpen = "/todos";
    }
  }

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

// Store for scheduled notifications
let scheduledNotifications = new Map();

// Handle messages from the main thread for scheduling notifications
self.addEventListener("message", function (event) {
  console.log("Service worker received message:", event.data);

  if (event.data && event.data.type === "SCHEDULE_SUPPLEMENT_NOTIFICATIONS") {
    const { supplements, preferences, timezone } = event.data;
    scheduleSupplementNotifications(supplements, preferences, timezone);
  }

  if (event.data && event.data.type === "CLEAR_SCHEDULED_NOTIFICATIONS") {
    clearAllScheduledNotifications();
  }
});

// Schedule supplement notifications
function scheduleSupplementNotifications(supplements, preferences, timezone) {
  console.log("Scheduling supplement notifications:", {
    supplements,
    preferences,
    timezone,
  });

  // Clear existing scheduled notifications
  clearAllScheduledNotifications();

  // Check if system notifications are enabled
  if (
    !preferences?.system_notifications_enabled ||
    !preferences?.supplement_reminders_enabled
  ) {
    console.log("Supplement notifications disabled in preferences");
    return;
  }

  // Time mapping for each time_of_day (matches backend)
  const hoursByTimeOfDay = {
    MORNING: 8,
    LUNCH: 12,
    DINNER: 18,
    BEFORE_SLEEP: 22,
  };

  const now = new Date();

  supplements.forEach((supplement) => {
    if (supplement.status !== "ACTIVE" || supplement.deleted_at) {
      return; // Skip inactive or deleted supplements
    }

    supplement.schedules?.forEach((schedule) => {
      const hour = hoursByTimeOfDay[schedule.time_of_day];
      if (hour === undefined) return;

      // Calculate next notification time
      const nextNotificationTime = getNextNotificationTime(hour);

      if (nextNotificationTime) {
        const timeoutId = setTimeout(() => {
          showSupplementNotification(supplement, schedule.time_of_day);

          // Schedule the next day's notification
          const nextDayTime = new Date(
            nextNotificationTime.getTime() + 24 * 60 * 60 * 1000
          );
          scheduleSupplementNotification(
            supplement,
            schedule.time_of_day,
            nextDayTime
          );
        }, nextNotificationTime.getTime() - now.getTime());

        // Store the timeout ID for cleanup
        const key = `${supplement.id}-${schedule.time_of_day}`;
        scheduledNotifications.set(key, timeoutId);

        console.log(
          `Scheduled notification for ${supplement.name} at ${schedule.time_of_day} (${nextNotificationTime})`
        );
      }
    });
  });
}

// Get the next notification time for a given hour
function getNextNotificationTime(hour) {
  const now = new Date();

  // Create a date for today at the specified hour
  const today = new Date();
  today.setHours(hour, 0, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (today <= now) {
    today.setDate(today.getDate() + 1);
  }

  return today;
}

// Schedule a single supplement notification
function scheduleSupplementNotification(
  supplement,
  timeOfDay,
  notificationTime
) {
  const now = new Date();
  const delay = notificationTime.getTime() - now.getTime();

  if (delay <= 0) return; // Don't schedule past notifications

  const timeoutId = setTimeout(() => {
    showSupplementNotification(supplement, timeOfDay);

    // Schedule the next day's notification
    const nextDayTime = new Date(
      notificationTime.getTime() + 24 * 60 * 60 * 1000
    );
    scheduleSupplementNotification(supplement, timeOfDay, nextDayTime);
  }, delay);

  const key = `${supplement.id}-${timeOfDay}`;
  scheduledNotifications.set(key, timeoutId);
}

// Show a supplement notification
function showSupplementNotification(supplement, timeOfDay) {
  const timeLabels = {
    MORNING: "Morning",
    LUNCH: "Lunch",
    DINNER: "Dinner",
    BEFORE_SLEEP: "Before Sleep",
  };

  const timeLabel = timeLabels[timeOfDay] || timeOfDay;

  const notificationOptions = {
    body: `Time to take your ${supplement.name} (${timeLabel})`,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      supplementId: supplement.id,
      timeOfDay: timeOfDay,
      url: "/todos",
    },
    actions: [
      {
        action: "mark-taken",
        title: "Mark as Taken",
      },
      {
        action: "view",
        title: "View Supplements",
      },
    ],
    requireInteraction: true,
    tag: `supplement-${supplement.id}-${timeOfDay}`,
  };

  self.registration.showNotification(
    `💊 ${supplement.name}`,
    notificationOptions
  );
}

// Clear all scheduled notifications
function clearAllScheduledNotifications() {
  console.log("Clearing all scheduled notifications");

  scheduledNotifications.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });

  scheduledNotifications.clear();
}

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
