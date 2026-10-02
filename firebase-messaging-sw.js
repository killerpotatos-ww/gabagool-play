// Service worker for push notifications on the web build (see gabagool_push.js).
// Firebase shows the notification when the game isn't open, and a tap opens
// the link the server put in it (server/js/push.js, PU_WEB_LINK).
importScripts("firebase_config.js");
importScripts(self.GABAGOOL_FIREBASE.sdk + "firebase-app-compat.js");
importScripts(self.GABAGOOL_FIREBASE.sdk + "firebase-messaging-compat.js");
firebase.initializeApp(self.GABAGOOL_FIREBASE.config);
firebase.messaging();
