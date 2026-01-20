// launchfirebase.js - Firebase v8
//<script src="./js/launchfirebase.js"></script> in HTML

// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>



// Export globally
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

/* ------------------ USER LOGIN / SIGNUP ------------------ */
async function handleLogin(user) {
  const uid = user.uid;
  sessionStorage.setItem("uid", uid);
  const email = user.email.toLowerCase();
  const userRef = db.ref("users/" + uid);
  const snap = await userRef.once("value");


  let role = "blocked";
  if (email.endsWith("@stu")) role = "user";
  if (!snap.exists()) {
    await userRef.set({
      email: email,
      role: role,
      created: Date.now(),
      online : true,
      timeSpent: 0,
      banned: false
    });
  }
  if (email === "advikmurthy12@gmail.com") role = "admin";

  // Optional Chromebook redirect
  const chromeb = window.isChromebook ? isChromebook() : false;
  if ((role === "user" || role === "blocked") && !chromeb) {
    alert("This account requires a Chromebook.");
    console.log("blocked for chromebook")
    await userRef.update({ role: "blocked" });
    window.location.replace("https://www.youtube.com/watch?v=8ELbX5CMomE");
  }
  
  return role;
}

async function emailSignup(email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  return await handleLogin(cred.user);
}

async function emailLogin(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return await handleLogin(cred.user);
}

async function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const res = await auth.signInWithPopup(provider);
  return await handleLogin(res.user);
}

const logout = () => auth.signOut();

function onUserChange(cb) {
  auth.onAuthStateChanged(async user => {
    if (!user) return cb(null);
    const snap = await db.ref("users/" + user.uid).once("value");
    const profile = snap.val();
    if (profile.role === "blocked") {
      alert("Your account is blocked.");
      await auth.signOut();
      return cb(null);
    }
    cb(profile);
  });
}

// Export functions globally
window.handleLogin = handleLogin;
window.emailSignup = emailSignup;
window.emailLogin = emailLogin;
window.googleLogin = googleLogin;
window.logout = logout;
window.onUserChange = onUserChange;
