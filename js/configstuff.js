

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAIzv7rOF5LtQmC1AVeQqAjrGHUZnJomFY",
  authDomain: "track-study-9f2eb.firebaseapp.com",
  projectId: "track-study-9f2eb",
  storageBucket: "track-study-9f2eb.firebasestorage.app",
  messagingSenderId: "461107985386",
  appId: "1:461107985386:web:15c694a7c946da0a5d1093",
  databaseURL: "https://track-study-9f2eb-default-rtdb.firebaseio.com"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Make global
window.auth = auth;
window.db = db;

firebase.database().ref(".info/connected").on("value", snap => {
  console.log("DB connected:", snap.val());
});

function isChromebook() {
  return navigator.userAgent.includes("CrOS");
}

function launchIframe(src) {
  console.log("[launchIframe] Called with src:", src);

  const contentDiv = document.getElementById("thestuff");
  if (!contentDiv) {
    console.error("[launchIframe] No element with ID 'thestuff' found.");
    return;
  }
  console.log("[launchIframe] Found content div.");

  // Only ever create ONE iframe
  let iframe = document.getElementById("mainGameFrame");
  if (!iframe) {
    console.log("[launchIframe] Creating new iframe.");
    iframe = document.createElement("iframe");
    iframe.id = "mainGameFrame";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.zIndex = "999999";
    iframe.allowFullscreen = true;
    document.body.appendChild(iframe);
  } else {
    console.log("[launchIframe] Reusing existing iframe.");
  }

  iframe.src = src;
  document.body.style.overflow = "hidden";
  contentDiv.style.display = "none";

  console.log("[launchIframe] Iframe launched with src:", src);
}

async function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  let result;
  try {
    result = await auth.signInWithPopup(provider);
  } catch {
    alert("Login failed");
    return;
  }

  const user = result.user;
  const uid = user.uid;
  const email = user.email;
  const name = user.displayName;
  const photo = user.photoURL;
  const ADMIN_EMAILS = ["advikmurthy12@gmail.com" , "632547@stu.sandi.net"];

  const userRef = db.ref("users/" + uid);
  const snap = await userRef.get();

  // ---- FIRST LOGIN ONLY ----
  if (!snap.exists()) {
    let initialRole = "user"; // Default to allowed for everyone

    if (ADMIN_EMAILS.includes(email)) {
      initialRole = "admin";
    }
    // Removed domain restriction - everyone can join
    if (email.endsWith("@stu.sandi.net")) {
      initialRole = "user";
    }

    await userRef.set({
      email,
      role: initialRole,
      name,
      icon: photo,
      created: Date.now(),
      online: true,
      timeSpent: 0,
      banned: false
    });
  }

  // ---- ALWAYS trust DB role ----

  if (ADMIN_EMAILS.includes(email)) {
    initialRole = "admin";
  } else if (email.endsWith("@stu.sandi.net")) {
    initialRole = "user";
  }

  const role = (await userRef.child("role").get()).val();
  const banned = (await userRef.child("banned").get()).val();

  console.log("This is  ", role);

  if (role === "blocked") {
    alert("Your account has been blocked by an administrator.");
    window.location.href = "https://google.com";
    return;
  }

  sessionStorage.setItem("uid", uid);
  window.trackUserOnlineStatus(uid);
  window.trackUser(uid);
  console.log("Have it ", role);

  return role;
}


async function codefree() {
  if (getCookie("Code")) {
    const role = await googleLogin();
    launchIframe(
      role === "admin"
        ? "./games.html?admin=True"
        : "./games.html?admin=False"
    );
  }
}


// Passcode handler
async function checkPasscodeClick() {
  const input = document.getElementById("passcodeInput").value;
  const year = new Date().getFullYear().toString().slice(-2);

  // Wait for the passwords to load
  const passwords = await window.fetchPasswords();
  const correctPasscode = passwords[0];
  const freeAccessCode = passwords[1];
  const correctPasscode2 = passwords[2];
  sessionStorage.clear();

  if (input === correctPasscode) {
    const role = await googleLogin();
    if (role === "blocked") {
      alert("Access Denied!");
      window.location.replace("https://www.google.com");
      return;
    }

    launchIframe(
      role === "admin"
        ? "./games.html?admin=True"
        : "./games.html?admin=False"
    );


  } else if (input === freeAccessCode) {
    document.cookie = "Codefree=true";
    launchIframe("./games.html?free=True");

  } else if (input === correctPasscode2) {
    const role = await googleLogin();
    if (role === "blocked") {
      alert("Access Denied!");
      window.location.replace("https://www.google.com");
      return;
    }

    launchIframe(
      role === "admin"
        ? "./games.html?admin=True"
        : "./games.html?admin=False"
    );
  } else {
    alert("Access Denied!");
    window.location.replace("https://www.google.com");
  }
}


// Expose handler
window.checkPasscodeClick = checkPasscodeClick;
window.googleLogin = googleLogin;
window.codefree = codefree;
// trackUser and trackUserOnlineStatus are defined in user.js and attached to window there.
