// Firebase web settings for push notifications (project gabagool-178ea, web
// app "Gabagool Web"). Not secret: every web page that uses Firebase ships
// these. Shared by gabagool_push.js (the page) and firebase-messaging-sw.js
// (the service worker). The server's side is server/js/push.js.
self.GABAGOOL_FIREBASE = {
	config: {
		apiKey: "AIzaSyBU4SwbP08HrgrIS5bp8oF2r9xgOKfVK5Y",
		authDomain: "gabagool-178ea.firebaseapp.com",
		projectId: "gabagool-178ea",
		storageBucket: "gabagool-178ea.firebasestorage.app",
		messagingSenderId: "512709125663",
		appId: "1:512709125663:web:d71b9cb1dda15848b8572a",
	},
	// Web Push public key (Firebase console, Cloud Messaging, Web Push certificates).
	vapidKey: "BJ6uJvhfJasIPkCNP6CYvDk4owQgNVBoZpSmT70bZo9QSSi35biWW3RaQ0Lz4JptEAr_vlJLYCB5v_FW6ZWmaH0",
	sdk: "https://www.gstatic.com/firebasejs/10.14.1/",
};
