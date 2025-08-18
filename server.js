// Simple Push Notification API Server
// A lightweight implementation without database dependencies

// Required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
const applications = new Map();
const subscriptions = new Map();
const notifications = [];

// Set VAPID details for web push
// Generate your own VAPID keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:your-email@example.com';

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Authentication middleware
const authenticateApp = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  // check if this is the master API key
  if(apiKey === process.env.MASTER_API_KEY){
    // skip the application check for master key
    req.isMaster = true;
    return next();
  }


  // Find the application with this API key
  let foundApp = null;
  for (const app of applications.values()) {
    if (app.apiKey === apiKey) {
      foundApp = app;
      break;
    }
  }
  
  if (!foundApp) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.application = foundApp;
  next();
};

// Routes

// Register a new application
app.post('/api/applications/register', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Application name is required' });
    }
    
    const appId = uuidv4();
    const apiKey = uuidv4();
    
    const newApp = {
      appId,
      name,
      apiKey,
      vapidKeys: {
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: VAPID_PRIVATE_KEY
      },
      createdAt: new Date()
    };
    
    applications.set(appId, newApp);
    
    // Initialize subscription collection for this app
    subscriptions.set(appId, []);
    
    res.status(201).json({
      success: true,
      application: {
        appId,
        name,
        apiKey,
        vapidKeys: {
          publicKey: VAPID_PUBLIC_KEY
        },
        createdAt: newApp.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering application:', error);
    res.status(500).json({ error: 'Failed to register application' });
  }
});

// Get application details
app.get('/api/applications', authenticateApp, (req, res) => {
  try {
    res.json({
      success: true,
      application: {
        appId: req.application.appId,
        name: req.application.name,
        vapidKeys: {
          publicKey: req.application.vapidKeys.publicKey
        },
        createdAt: req.application.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({ error: 'Failed to get application details' });
  }
});

// Subscribe endpoint for clients to register for push notifications
app.post('/api/subscriptions', (req, res) => {
  try {
    const { appId, subscription, userAgent } = req.body;
    
    if (!appId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    // Check if the application exists
    if (!applications.has(appId)) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const appSubscriptions = subscriptions.get(appId);
    
    // Check if subscription already exists
    const existingIndex = appSubscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (existingIndex !== -1) {
      // Update the last used date
      appSubscriptions[existingIndex].lastUsed = new Date();
      return res.json({ success: true, message: 'Subscription already exists' });
    }
    
    // Create new subscription
    const newSubscription = {
      id: uuidv4(),
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    appSubscriptions.push(newSubscription);
    
    res.status(201).json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Unsubscribe endpoint
app.delete('/api/subscriptions', (req, res) => {
  try {
    const { appId, endpoint } = req.body;
    
    if (!appId || !endpoint) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    if (!applications.has(appId)) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const appSubscriptions = subscriptions.get(appId);
    const initialLength = appSubscriptions.length;
    
    // Filter out the subscription with the matching endpoint
    const newSubscriptions = appSubscriptions.filter(
      sub => sub.endpoint !== endpoint
    );
    
    subscriptions.set(appId, newSubscriptions);
    
    if (newSubscriptions.length < initialLength) {
      return res.json({ success: true, message: 'Subscription removed' });
    } else {
      return res.status(404).json({ error: 'Subscription not found' });
    }
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// Send notification to all subscribers of an application
app.post('/api/notifications/send', authenticateApp, async (req, res) => {
  try {
    const { title, body, icon, image, badge, vibrate, data, actions, topic } = req.body;
    const appId = req.application.appId;
    
    if (!title) {
      return res.status(400).json({ error: 'Notification title is required' });
    }
    
    const appSubscriptions = subscriptions.get(appId) || [];
    
    if (appSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found for this application' });
    }
    
    // Create notification object
    const notification = {
      id: uuidv4(),
      appId,
      title,
      body,
      icon,
      image,
      badge,
      vibrate,
      data,
      actions,
      topic,
      sentAt: new Date(),
      results: []
    };
    
    // Send notification to all subscribers
    const notificationPayload = {
      title,
      body,
      icon,
      image,
      badge,
      vibrate,
      data,
      actions,
      topic
    };
    
    // Remove undefined values
    Object.keys(notificationPayload).forEach(key => {
      if (notificationPayload[key] === undefined) {
        delete notificationPayload[key];
      }
    });
    
    const sendPromises = appSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          JSON.stringify(notificationPayload)
        );
        
        notification.results.push({
          endpoint: subscription.endpoint,
          status: 'success',
          message: 'Notification sent successfully'
        });
        
        // Update last used
        subscription.lastUsed = new Date();
        
        return { status: 'success', endpoint: subscription.endpoint };
      } catch (error) {
        console.error(`Error sending notification to ${subscription.endpoint}:`, error);
        
        notification.results.push({
          endpoint: subscription.endpoint,
          status: 'failed',
          message: error.message
        });
        
        // Check if subscription is expired or invalid
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Remove expired subscription
          const currentSubs = subscriptions.get(appId);
          const updatedSubs = currentSubs.filter(sub => sub.endpoint !== subscription.endpoint);
          subscriptions.set(appId, updatedSubs);
        }
        
        return { status: 'failed', endpoint: subscription.endpoint, error: error.message };
      }
    });
    
    const results = await Promise.all(sendPromises);
    
    // Add to notifications history
    notifications.push(notification);
    
    // Limit history size to avoid memory issues
    if (notifications.length > 1000) {
      notifications.shift(); // Remove oldest notification
    }
    
    // Calculate statistics
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    
    res.json({
      success: true,
      notification: {
        id: notification.id,
        sentAt: notification.sentAt,
        stats: {
          total: appSubscriptions.length,
          success: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get notification history
app.get('/api/notifications', authenticateApp, (req, res) => {
  try {
    const appId = req.application.appId;
    
    // Filter notifications for this app
    const appNotifications = notifications
      .filter(notification => notification.appId === appId)
      .map(notification => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        sentAt: notification.sentAt,
        stats: {
          total: notification.results.length,
          success: notification.results.filter(r => r.status === 'success').length,
          failed: notification.results.filter(r => r.status === 'failed').length
        }
      }));
    
    res.json({
      success: true,
      notifications: appNotifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Client JavaScript helper endpoint
app.get('/api/client.js', (req, res) => {
  const appId = req.query.appId;
  
  if (!appId || !applications.has(appId)) {
    return res.status(404).send('Application not found');
  }
  
  const app = applications.get(appId);
  
  // Generate client-side JavaScript
  const clientJs = `
    // Push Notification Client Helper
    // Generated for application: ${app.name}
    
    const PushClient = {
      appId: '${app.appId}',
      serverUrl: '${req.protocol}://${req.get('host')}',
      vapidPublicKey: '${app.vapidKeys.publicKey}',
      
      // Convert base64 VAPID key to Uint8Array
      urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      },
      
      // Register service worker
      async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service workers are not supported by this browser');
        }
        
        if (!('PushManager' in window)) {
          throw new Error('Push notifications are not supported by this browser');
        }
        
        // You need to create and host a service-worker.js file
        return navigator.serviceWorker.register('/service-worker.js');
      },
      
      // Subscribe to push notifications
      async subscribeToPush() {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Get existing subscription or create a new one
          let subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            return subscription;
          }
          
          // Subscribe the user
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
          });
          
          // Register subscription with server
          await this.saveSubscription(subscription);
          
          return subscription;
        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
          throw error;
        }
      },
      
      // Save subscription to server
      async saveSubscription(subscription) {
        const response = await fetch(\`\${this.serverUrl}/api/subscriptions\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            appId: this.appId,
            subscription,
            userAgent: navigator.userAgent
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save subscription on server');
        }
        
        return response.json();
      },
      
      // Unsubscribe from push notifications
      async unsubscribe() {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            return { success: true, message: 'Not subscribed' };
          }
          
          // Unsubscribe from browser
          const result = await subscription.unsubscribe();
          
          if (result) {
            // Remove from server
            await fetch(\`\${this.serverUrl}/api/subscriptions\`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                appId: this.appId,
                endpoint: subscription.endpoint
              })
            });
          }
          
          return { success: true, message: 'Unsubscribed successfully' };
        } catch (error) {
          console.error('Error unsubscribing:', error);
          throw error;
        }
      }
    };
    
    // Export to window
    window.PushClient = PushClient;
  `;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.send(clientJs);
});

// Sample service worker code endpoint
app.get('/api/service-worker.js', (req, res) => {
  const serviceWorkerJs = `
    // Push Notification Service Worker
    
    self.addEventListener('push', function(event) {
      if (!event.data) {
        console.log('Push event has no data');
        return;
      }
      
      try {
        const data = event.data.json();
        
        const options = {
          body: data.body || '',
          icon: data.icon || '/icon.png',
          badge: data.badge,
          image: data.image,
          vibrate: data.vibrate || [100, 50, 100],
          data: data.data || {},
          actions: data.actions || []
        };
        
        event.waitUntil(
          self.registration.showNotification(data.title, options)
        );
      } catch (e) {
        console.error('Error showing notification:', e);
      }
    });
    
    self.addEventListener('notificationclick', function(event) {
      console.log('Notification click received:', event);
      
      event.notification.close();
      
      // Add your custom handling logic here
      // For example, open a specific URL when the notification is clicked
      const clickUrl = event.notification.data.url || '/';
      
      event.waitUntil(
        clients.matchAll({type: 'window'}).then(windowClients => {
          // Check if there is already a window open with the target URL
          for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === clickUrl && 'focus' in client) {
              return client.focus();
            }
          }
          // If no existing window, open a new one
          if (clients.openWindow) {
            return clients.openWindow(clickUrl);
          }
        })
      );
    });
  `;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.send(serviceWorkerJs);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`);
});

// Export for testing or external access
module.exports = app;