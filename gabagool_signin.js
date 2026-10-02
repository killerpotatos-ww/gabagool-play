// Sign in with Google and Apple on the web build (GDD §6). Loaded by the page
// (export_presets.cfg head_include); SocialSignIn (scripts/net/social_sign_in.gd)
// drives it and hands the token to the server (NetClient).
//
//   gabagoolSignIn.prepare(appleId)   loads Apple's script ahead of the tap
//   gabagoolSignIn.google(clientId)   opens Google's sign-in (call from a tap)
//   gabagoolSignIn.apple(appleId)     opens Apple's sign-in (call from a tap)
//   gabagoolSignIn.cancel()           stops waiting
//   gabagoolSignIn.result             null while working, then {token} or {error}
//
// Google: its sign-in page in a popup, which comes back to signin.html on this
// site with an ID token; that page hands it over on a BroadcastChannel (the
// popup's link to this page can be cut by Google's pages). Apple: Apple's own
// script in popup mode.
(function () {
	var S = window.gabagoolSignIn = { result: null };
	var APPLE_JS = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
	var appleLoaded = null;
	var waiting = null; // {state, nonce} of the Google sign-in in progress

	function random() {
		var a = new Uint8Array(16);
		crypto.getRandomValues(a);
		return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
	}

	function claims(token) {
		try {
			var b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
			return JSON.parse(atob(b + "===".slice((b.length + 3) % 4)));
		} catch (e) {
			return {};
		}
	}

	function loadApple() {
		if (!appleLoaded) {
			appleLoaded = new Promise(function (ok, fail) {
				var s = document.createElement("script");
				s.src = APPLE_JS;
				s.onload = ok;
				s.onerror = function () { appleLoaded = null; fail(new Error("Couldn't load Apple's sign-in")); };
				document.head.appendChild(s);
			});
		}
		return appleLoaded;
	}

	S.prepare = function () {
		loadApple().catch(function () {});
	};

	S.cancel = function () {
		waiting = null;
		if (!S.result) S.result = { error: "cancelled" };
	};

	function got(msg) {
		if (!waiting || !msg || msg.state !== waiting.state) return;
		var nonce = waiting.nonce;
		waiting = null;
		if (msg.error) {
			S.result = { error: msg.error === "access_denied" ? "cancelled" : msg.error };
		} else if (!msg.id_token || claims(msg.id_token).nonce !== nonce) {
			S.result = { error: "No token" };
		} else {
			S.result = { token: msg.id_token };
		}
	}

	if ("BroadcastChannel" in window) {
		new BroadcastChannel("gabagool_signin").onmessage = function (e) { got(e.data); };
	}
	// Browsers without BroadcastChannel: signin.html leaves it in localStorage.
	window.addEventListener("storage", function (e) {
		if (e.key !== "gabagool_signin" || !e.newValue) return;
		try { got(JSON.parse(e.newValue)); } catch (err) {}
		localStorage.removeItem("gabagool_signin");
	});

	S.google = function (clientId) {
		S.result = null;
		waiting = { state: random(), nonce: random() };
		var url = "https://accounts.google.com/o/oauth2/v2/auth?" + [
			"client_id=" + encodeURIComponent(clientId),
			"response_type=id_token",
			"scope=" + encodeURIComponent("openid"),
			"redirect_uri=" + encodeURIComponent(location.origin + "/signin.html"),
			"state=" + waiting.state,
			"nonce=" + waiting.nonce,
			"prompt=select_account",
		].join("&");
		var w = window.open(url, "gabagool_google", "width=480,height=640");
		if (!w) {
			waiting = null;
			S.result = { error: "popup blocked" };
		}
	};

	S.apple = function (appleId) {
		S.result = null;
		if (!window.AppleID) {
			// Not loaded yet (prepare() wasn't called or is still going): the
			// popup has to open during the tap, so this tap can't be used.
			S.prepare();
			S.result = { error: "not ready" };
			return;
		}
		AppleID.auth.init({
			clientId: appleId,
			scope: "",
			redirectURI: location.origin + "/",
			usePopup: true,
		});
		AppleID.auth.signIn().then(function (data) {
			var token = data && data.authorization && data.authorization.id_token;
			S.result = token ? { token: token } : { error: "No token" };
		}).catch(function (e) {
			var why = (e && e.error) || String(e);
			S.result = { error: /popup_closed|user_cancel/.test(why) ? "cancelled" : why };
		});
	};
})();
