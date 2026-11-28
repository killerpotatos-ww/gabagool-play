// Push notifications on the web build ("your turn", reminders). Loaded by the
// page (export_presets.cfg head_include); WebPush (scripts/net/web_push.gd)
// drives it and hands the token to the server with NetClient.push_register.
//
//   gabagoolPush.state()     "unsupported", "default" (not asked yet),
//                            "granted" or "denied"
//   gabagoolPush.enable()    asks the player (call from a button press), then
//                            gets this browser's token
//   gabagoolPush.refresh()   gets the token again without asking (only when
//                            already "granted"); tokens can change
//   gabagoolPush.result      null while working, then {token} or {error}
//
// The Firebase SDK is only loaded once it's needed.
(function () {
	var P = window.gabagoolPush = { result: null };
	var sdkLoaded = null;

	P.state = function () {
		if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
			return "unsupported";
		}
		return Notification.permission;
	};

	function script(src) {
		return new Promise(function (ok, fail) {
			var s = document.createElement("script");
			s.src = src;
			s.onload = ok;
			s.onerror = function () { fail(new Error("Couldn't load " + src)); };
			document.head.appendChild(s);
		});
	}

	function loadSdk() {
		if (!sdkLoaded) {
			sdkLoaded = script("firebase_config.js").then(function () {
				return script(window.GABAGOOL_FIREBASE.sdk + "firebase-app-compat.js");
			}).then(function () {
				return script(window.GABAGOOL_FIREBASE.sdk + "firebase-messaging-compat.js");
			}).then(function () {
				if (!firebase.apps.length) firebase.initializeApp(window.GABAGOOL_FIREBASE.config);
			});
		}
		return sdkLoaded;
	}

	function getToken() {
		return loadSdk().then(function () {
			return navigator.serviceWorker.register("firebase-messaging-sw.js");
		}).then(function (reg) {
			return firebase.messaging().getToken({
				vapidKey: window.GABAGOOL_FIREBASE.vapidKey,
				serviceWorkerRegistration: reg,
			});
		});
	}

	function finish(p) {
		P.result = null;
		p.then(function (token) {
			P.result = token ? { token: token } : { error: "No token" };
		}).catch(function (e) {
			P.result = { error: String((e && e.message) || e) };
		});
	}

	P.enable = function () {
		if (P.state() === "unsupported") {
			P.result = { error: "unsupported" };
			return;
		}
		// Ask first, while the tap still counts: loading the SDK takes a moment.
		finish(Promise.resolve(Notification.requestPermission()).then(function (answer) {
			if (answer !== "granted") throw new Error(answer);
			return getToken();
		}));
	};

	P.refresh = function () {
		if (P.state() !== "granted") {
			P.result = { error: P.state() };
			return;
		}
		finish(getToken());
	};
})();
