import {
  auth,
  db
} from "./firebaseConfig.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// =====================================================
// TEAM LOGIN
// =====================================================

window.teamLogin = async function () {

  const email =
    document
      .getElementById("teamEmail")
      ?.value
      .trim();

  const password =
    document
      .getElementById("teamPassword")
      ?.value;

  if (!email || !password) {

    alert(
      "Email aur password daalo."
    );

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Team login successful ✅");

  } catch (error) {

    console.error(error);

    alert(
      "Login failed ❌\n" +
      error.message
    );
  }
};

// =====================================================
// LOGOUT
// =====================================================

window.teamLogout = async function () {

  try {

    await signOut(auth);

    alert("Logout successful.");

  } catch (error) {

    console.error(error);
  }
};

// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  user => {

    const userBox =
      document.getElementById(
        "teamUser"
      );

    if (userBox) {

      userBox.textContent =
        user
          ? user.email || "Team User"
          : "Guest";
    }

  }
);

// =====================================================
// ORDERS
// =====================================================

onSnapshot(
  collection(db,"orders"),
  snapshot => {

    const total =
      document.getElementById(
        "totalOrders"
      );

    const fresh =
      document.getElementById(
        "newOrders"
      );

    if (total) {
      total.textContent =
        snapshot.size;
    }

    if (fresh) {

      fresh.textContent =
        snapshot.docs.filter(
          d =>
            d.data().status === "NEW"
        ).length;
    }

  },
  error =>
    console.error(
      "Orders:",
      error
    )
);

// =====================================================
// PRODUCTS
// =====================================================

onSnapshot(
  collection(db,"products"),
  snapshot => {

    const box =
      document.getElementById(
        "totalProducts"
      );

    if (box) {
      box.textContent =
        snapshot.size;
    }

  },
  error =>
    console.error(
      "Products:",
      error
    )
);

// =====================================================
// SHOPS
// =====================================================

onSnapshot(
  collection(db,"shops"),
  snapshot => {

    const box =
      document.getElementById(
        "totalShops"
      );

    if (box) {
      box.textContent =
        snapshot.size;
    }

  },
  error =>
    console.error(
      "Shops:",
      error
    )
);

// =====================================================
// REFRESH
// =====================================================

window.refreshTeamData =
function () {

  window.location.reload();

};

// =====================================================
// SERVICE WORKER
// =====================================================

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .catch(
          error =>
            console.error(
              "SW:",
              error
            )
        );

    }
  );

}