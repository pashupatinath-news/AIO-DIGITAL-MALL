// ============================================================
// AIO DIGITAL MALL
// CUSTOMER APP.JS
// Email + Google Auth | Firestore | Shops | Products | Cart
// COD Orders | My Orders | Search | Categories
// ============================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",
  authDomain: "aio-digital-mall.firebaseapp.com",
  projectId: "aio-digital-mall",
  storageBucket: "aio-digital-mall.firebasestorage.app",
  messagingSenderId: "501384049673",
  appId: "1:501384049673:web:968bd8311cc700f82874d8",
  measurementId: "G-TNDT9FYNRP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let cart = JSON.parse(
  localStorage.getItem("aio_customer_cart") || "[]"
);

let allProducts = [];
let allShops = [];
let authMode = "login";


// ============================================================
// HELPER
// ============================================================

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {
  let toast = $("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "25px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "999999",
      background: "#222",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "10px",
      fontSize: "14px",
      maxWidth: "90%",
      textAlign: "center"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(window.__aioToastTimer);

  window.__aioToastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}


// ============================================================
// AUTH MODAL
// ============================================================

function getAuthElements() {
  return {
    modal: $("loginModal"),
    email: $("email"),
    password: $("password"),
    name: $("name"),
    authTitle: $("authTitle"),
    authButton: $("authButton"),
    authSwitch: $("authSwitch"),
    googleButton: $("googleButton")
  };
}


function ensureAuthUI() {
  let modal = $("loginModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "loginModal";

    Object.assign(modal.style, {
      display: "none",
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,.65)",
      zIndex: "99999",
      overflowY: "auto",
      padding: "20px"
    });

    modal.innerHTML = `
      <div style="
        max-width:420px;
        margin:50px auto;
        background:white;
        border-radius:18px;
        padding:25px;
        position:relative;
        box-shadow:0 15px 50px rgba(0,0,0,.3);
      ">

        <button
          id="closeLogin"
          style="
            position:absolute;
            right:15px;
            top:12px;
            border:0;
            background:transparent;
            font-size:25px;
            cursor:pointer;
          "
        >×</button>

        <h2 id="authTitle">Customer Login</h2>

        <p style="color:#666">
          AIO DIGITAL MALL
        </p>

        <input
          id="name"
          type="text"
          placeholder="Full Name"
          style="width:100%;padding:12px;margin:6px 0;box-sizing:border-box;"
        >

        <input
          id="email"
          type="email"
          placeholder="Email Address"
          autocomplete="email"
          style="width:100%;padding:12px;margin:6px 0;box-sizing:border-box;"
        >

        <input
          id="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          style="width:100%;padding:12px;margin:6px 0;box-sizing:border-box;"
        >

        <button
          id="authButton"
          style="
            width:100%;
            padding:13px;
            margin-top:10px;
            border:0;
            border-radius:10px;
            background:#ff6600;
            color:white;
            font-weight:bold;
            cursor:pointer;
          "
        >
          LOGIN
        </button>

        <button
          id="googleButton"
          style="
            width:100%;
            padding:13px;
            margin-top:10px;
            border:1px solid #ddd;
            border-radius:10px;
            background:white;
            cursor:pointer;
            font-weight:bold;
          "
        >
          CONTINUE WITH GOOGLE
        </button>

        <p style="text-align:center;margin-top:18px;">
          <span id="authSwitchText">
            New customer?
          </span>

          <button
            id="authSwitch"
            style="
              border:0;
              background:none;
              color:#ff6600;
              font-weight:bold;
              cursor:pointer;
            "
          >
            CREATE ACCOUNT
          </button>
        </p>

        <p
          id="authError"
          style="color:#d00;text-align:center;min-height:20px;"
        ></p>

      </div>
    `;

    document.body.appendChild(modal);

    $("closeLogin").onclick = closeLoginModal;

    $("authButton").onclick = handleEmailAuth;

    $("googleButton").onclick = loginWithGoogle;

    $("authSwitch").onclick = toggleAuthMode;
  }
}


function openLoginModal() {
  ensureAuthUI();

  const modal = $("loginModal");

  if (modal) {
    modal.style.display = "block";
  }
}


function closeLoginModal() {
  const modal = $("loginModal");

  if (modal) {
    modal.style.display = "none";
  }
}


window.openLogin = openLoginModal;
window.showLogin = openLoginModal;
window.closeLogin = closeLoginModal;


// ============================================================
// AUTH MODE
// ============================================================

function toggleAuthMode() {
  authMode =
    authMode === "login"
      ? "register"
      : "login";

  updateAuthModal();
}


function updateAuthModal() {
  ensureAuthUI();

  const title = $("authTitle");
  const button = $("authButton");
  const name = $("name");
  const switchText = $("authSwitchText");
  const switchButton = $("authSwitch");

  if (authMode === "register") {
    title.textContent = "Create Customer Account";
    button.textContent = "CREATE ACCOUNT";
    name.style.display = "block";
    switchText.textContent = "Already have an account?";
    switchButton.textContent = "LOGIN";
  } else {
    title.textContent = "Customer Login";
    button.textContent = "LOGIN";
    name.style.display = "none";
    switchText.textContent = "New customer?";
    switchButton.textContent = "CREATE ACCOUNT";
  }
}


// ============================================================
// EMAIL AUTH
// ============================================================

async function handleEmailAuth() {
  ensureAuthUI();

  const email = $("email")?.value.trim();
  const password = $("password")?.value;
  const name = $("name")?.value.trim();
  const errorBox = $("authError");

  if (errorBox) {
    errorBox.textContent = "";
  }

  if (!email) {
    showAuthError("Email address daalo.");
    return;
  }

  if (!password || password.length < 6) {
    showAuthError(
      "Password kam se kam 6 characters ka hona chahiye."
    );
    return;
  }

  try {
    let result;

    if (authMode === "register") {
      result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (name) {
        await updateProfile(result.user, {
          displayName: name
        });
      }

      await saveCustomerProfile(
        result.user,
        name
      );

      showToast("Account create ho gaya ✅");

    } else {
      result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      await saveCustomerProfile(
        result.user,
        result.user.displayName || ""
      );

      showToast("Login successful ✅");
    }

    currentUser = result.user;

    closeLoginModal();

    updateAuthUI();

    await loadUserProfile();
    await loadMyOrders();

  } catch (error) {
    console.error("Email auth error:", error);

    showAuthError(
      friendlyAuthError(error)
    );
  }
}


function showAuthError(message) {
  ensureAuthUI();

  const box = $("authError");

  if (box) {
    box.textContent = message;
  }

  showToast(message);
}


function friendlyAuthError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use":
      "Ye email already registered hai. Login karo.",

    "auth/invalid-email":
      "Email address galat hai.",

    "auth/weak-password":
      "Password weak hai. Kam se kam 6 characters rakho.",

    "auth/invalid-credential":
      "Email ya password galat hai.",

    "auth/user-not-found":
      "Account nahi mila. Pehle account create karo.",

    "auth/wrong-password":
      "Password galat hai.",

    "auth/too-many-requests":
      "Bahut attempts ho gaye. Thodi der baad try karo.",

    "auth/popup-closed-by-user":
      "Google login window close kar di gayi.",

    "auth/popup-blocked":
      "Browser ne Google login popup block kar diya.",

    "auth/unauthorized-domain":
      "Ye website Firebase Authorized Domains me add nahi hai.",

    "auth/operation-not-allowed":
      "Firebase Console me ye login provider enabled nahi hai."
  };

  return (
    messages[code] ||
    error?.message ||
    "Login failed. Dobara try karo."
  );
}


// ============================================================
// GOOGLE LOGIN
// ============================================================

async function loginWithGoogle() {
  try {
    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    currentUser = result.user;

    await saveCustomerProfile(
      result.user,
      result.user.displayName || ""
    );

    closeLoginModal();

    updateAuthUI();

    await loadUserProfile();
    await loadMyOrders();

    showToast(
      "Google login successful ✅"
    );

  } catch (error) {
    console.error(
      "Google login error:",
      error
    );

    showAuthError(
      friendlyAuthError(error)
    );
  }
}

window.loginWithGoogle = loginWithGoogle;


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    updateAuthUI();

    if (user) {
      await saveCustomerProfile(
        user,
        user.displayName || ""
      );

      await loadUserProfile();
      await loadMyOrders();
    }
  }
);


// ============================================================
// AUTH UI
// ============================================================

function updateAuthUI() {
  const loginButton =
    $("loginButton");

  const accountButton =
    $("accountButton");

  const accountName =
    $("customerName");

  if (currentUser) {

    if (loginButton) {
      loginButton.textContent =
        "ACCOUNT";
    }

    if (accountButton) {
      accountButton.style.display =
        "block";
    }

    if (accountName) {
      accountName.textContent =
        currentUser.displayName ||
        currentUser.email ||
        "Customer";
    }

  } else {

    if (loginButton) {
      loginButton.textContent =
        "LOGIN";
    }

    if (accountButton) {
      accountButton.style.display =
        "none";
    }
  }
}


// ============================================================
// LOGOUT
// ============================================================

window.logoutCustomer = async function() {
  try {
    await signOut(auth);

    currentUser = null;

    updateAuthUI();

    showToast(
      "Logout ho gaya ✅"
    );

  } catch (error) {
    console.error(error);
    showToast("Logout failed.");
  }
};


// ============================================================
// CUSTOMER PROFILE
// ============================================================

async function saveCustomerProfile(
  user,
  name = ""
) {
  if (!user) return;

  try {
    const ref =
      doc(
        db,
        "customers",
        user.uid
      );

    const existing =
      await getDoc(ref);

    const oldData =
      existing.exists()
        ? existing.data()
        : {};

    await setDoc(
      ref,
      {
        uid: user.uid,

        name:
          name ||
          user.displayName ||
          oldData.name ||
          "Customer",

        email:
          user.email ||
          oldData.email ||
          "",

        photoURL:
          user.photoURL ||
          oldData.photoURL ||
          "",

        provider:
          user.providerData?.[0]?.providerId ||
          oldData.provider ||
          "password",

        updatedAt:
          serverTimestamp(),

        createdAt:
          oldData.createdAt ||
          serverTimestamp()
      },
      {
        merge: true
      }
    );

  } catch (error) {
    console.error(
      "Customer profile error:",
      error
    );
  }
}


async function loadUserProfile() {
  if (!currentUser) return;

  try {
    const ref =
      doc(
        db,
        "customers",
        currentUser.uid
      );

    const snap =
      await getDoc(ref);

    let name =
      currentUser.displayName ||
      currentUser.email ||
      "Customer";

    if (snap.exists()) {
      const data = snap.data();

      name =
        data.name ||
        name;
    }

    if ($("customerName")) {
      $("customerName").textContent =
        name;
    }

  } catch (error) {
    console.error(
      "Profile loading error:",
      error
    );
  }
}


// ============================================================
// SHOPS
// ============================================================

async function loadShops() {
  try {
    const snapshot =
      await getDocs(
        collection(db, "shops")
      );

    allShops = [];

    snapshot.forEach(item => {
      allShops.push({
        id: item.id,
        ...item.data()
      });
    });

    renderShops();

  } catch (error) {
    console.error(
      "Shop loading error:",
      error
    );
  }
}


function renderShops() {
  const container =
    $("shopList");

  if (!container) return;

  if (!allShops.length) {
    container.innerHTML =
      "<p>No shops available.</p>";
    return;
  }

  container.innerHTML =
    allShops.map(shop => {

      const name =
        escapeHTML(
          shop.name ||
          "Shop"
        );

      const image =
        shop.image ||
        shop.photo ||
        "https://via.placeholder.com/300";

      const category =
        escapeHTML(
          shop.category ||
          "Shop"
        );

      return `
        <div
          class="shop-card"
          onclick="openShop('${shop.id}')"
        >

          <img
            src="${image}"
            alt="${name}"
          >

          <h3>${name}</h3>

          <p>${category}</p>

          <small>
            ${shop.rating || "4.5"} ⭐
          </small>

        </div>
      `;
    }).join("");
}


window.openShop = function(shopId) {

  const shop =
    allShops.find(
      item =>
        item.id === shopId
    );

  if (!shop) return;

  const products =
    allProducts.filter(
      product =>
        product.shopId === shopId
    );

  renderProductList(
    products,
    $("productList")
  );

  if ($("shopTitle")) {
    $("shopTitle").textContent =
      shop.name || "Shop";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// ============================================================
// PRODUCTS
// ============================================================

async function loadProducts() {
  try {
    const snapshot =
      await getDocs(
        collection(db, "products")
      );

    allProducts = [];

    snapshot.forEach(item => {
      allProducts.push({
        id: item.id,
        ...item.data()
      });
    });

    renderProductList(
      allProducts,
      $("productList")
    );

    renderFeaturedProducts();

  } catch (error) {
    console.error(
      "Products loading error:",
      error
    );
  }
}


function renderProductList(
  products,
  container
) {
  if (!container) return;

  if (!products.length) {
    container.innerHTML =
      "<p>Product nahi mila.</p>";
    return;
  }

  container.innerHTML =
    products.map(product => {

      const name =
        escapeHTML(
          product.name ||
          "Product"
        );

      const price =
        Number(
          product.price || 0
        );

      const image =
        product.photo ||
        product.image ||
        "https://via.placeholder.com/300x220";

      const stock =
        Number(
          product.stock ?? 1
        );

      return `
        <div class="product-card">

          <img
            src="${image}"
            alt="${name}"
          >

          <h3>${name}</h3>

          <p class="price">
            ₹${price}
          </p>

          ${
            stock <= 0
              ? `
                <button disabled>
                  OUT OF STOCK
                </button>
              `
              : `
                <button
                  onclick="addToCart('${product.id}')"
                >
                  ADD TO CART
                </button>
              `
          }

        </div>
      `;
    }).join("");
}


function renderFeaturedProducts() {
  const container =
    $("featuredProducts");

  if (!container) return;

  renderProductList(
    allProducts.slice(0, 10),
    container
  );
}


// ============================================================
// SEARCH
// ============================================================

window.searchProducts = function() {

  const input =
    $("searchInput");

  if (!input) return;

  const value =
    input.value
      .trim()
      .toLowerCase();

  if (!value) {
    renderProductList(
      allProducts,
      $("productList")
    );
    return;
  }

  const results =
    allProducts.filter(product => {

      const name =
        String(
          product.name || ""
        ).toLowerCase();

      const category =
        String(
          product.category || ""
        ).toLowerCase();

      return (
        name.includes(value) ||
        category.includes(value)
      );
    });

  renderProductList(
    results,
    $("productList")
  );
};


// ============================================================
// CATEGORY
// ============================================================

window.filterCategory =
function(category) {

  if (!category) return;

  const value =
    category.toLowerCase();

  const results =
    allProducts.filter(product =>
      String(
        product.category || ""
      ).toLowerCase() === value
    );

  renderProductList(
    results,
    $("productList")
  );
};


// ============================================================
// CART
// ============================================================

window.addToCart =
function(productId) {

  const product =
    allProducts.find(
      item =>
        item.id === productId
    );

  if (!product) {
    showToast(
      "Product nahi mila."
    );
    return;
  }

  const stock =
    Number(
      product.stock ?? 1
    );

  if (stock <= 0) {
    showToast(
      "Product out of stock."
    );
    return;
  }

  const existing =
    cart.find(
      item =>
        item.id === productId
    );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,

      name:
        product.name ||
        "Product",

      price:
        Number(
          product.price || 0
        ),

      image:
        product.photo ||
        product.image ||
        "",

      shopId:
        product.shopId ||
        "",

      quantity: 1
    });
  }

  saveCart();
  updateCartUI();

  showToast(
    "Cart me add ho gaya 🛒"
  );
};


function saveCart() {
  localStorage.setItem(
    "aio_customer_cart",
    JSON.stringify(cart)
  );
}


window.removeFromCart =
function(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) return;

  cart.splice(index, 1);

  saveCart();
  updateCartUI();
};


window.changeQuantity =
function(index, amount) {

  if (!cart[index]) return;

  cart[index].quantity += amount;

  if (
    cart[index].quantity <= 0
  ) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartUI();
};


function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Number(item.quantity || 1),
    0
  );
}


function updateCartUI() {

  const count =
    $("cartCount");

  const total =
    $("cartTotal");

  const items =
    $("cartItems");

  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 1),
      0
    );

  if (count) {
    count.textContent =
      itemCount;
  }

  if (total) {
    total.textContent =
      getCartTotal();
  }

  if (!items) return;

  if (!cart.length) {
    items.innerHTML =
      "<p>Cart khali hai 🛒</p>";
    return;
  }

  items.innerHTML =
    cart.map(
      (item, index) => `
        <div class="cart-item">

          <img
            src="${item.image || "https://via.placeholder.com/80"}"
            alt=""
          >

          <div>

            <strong>
              ${escapeHTML(item.name)}
            </strong>

            <p>
              ₹${Number(item.price)}
            </p>

            <div>

              <button
                onclick="changeQuantity(${index}, -1)"
              >
                −
              </button>

              <span>
                ${Number(item.quantity || 1)}
              </span>

              <button
                onclick="changeQuantity(${index}, 1)"
              >
                +
              </button>

            </div>

          </div>

          <button
            onclick="removeFromCart(${index})"
          >
            Remove
          </button>

        </div>
      `
    ).join("");
}


window.toggleCart =
function() {

  const cartBox =
    $("cartBox");

  if (!cartBox) return;

  cartBox.style.display =
    cartBox.style.display === "block"
      ? "none"
      : "block";
};


// ============================================================
// COD ORDER
// ============================================================

window.placeCODOrder =
async function() {

  if (!currentUser) {
    openLoginModal();

    showToast(
      "Order ke liye login karo."
    );

    return;
  }

  if (!cart.length) {
    showToast(
      "Cart khali hai."
    );
    return;
  }

  const phone =
    prompt(
      "Delivery mobile number daalo"
    );

  if (!phone) {
    showToast(
      "Mobile number required hai."
    );
    return;
  }

  const address =
    prompt(
      "Complete delivery address daalo"
    );

  if (!address) {
    showToast(
      "Address required hai."
    );
    return;
  }

  const total =
    getCartTotal();

  try {

    const orderData = {

      customerId:
        currentUser.uid,

      customerName:
        currentUser.displayName ||
        currentUser.email ||
        "Customer",

      customerEmail:
        currentUser.email ||
        "",

      customerPhone:
        phone,

      items:
        cart,

      total:
        total,

      paymentMethod:
        "COD",

      status:
        "NEW",

      address:
        address,

      createdAt:
        serverTimestamp()
    };

    const orderRef =
      await addDoc(
        collection(db, "orders"),
        orderData
      );

    cart = [];

    saveCart();
    updateCartUI();

    if ($("cartBox")) {
      $("cartBox").style.display =
        "none";
    }

    showToast(
      "Order successfully place ho gaya ✅"
    );

    alert(
      "Order Successfully Placed ✅\n\n" +
      "Order ID: " +
      orderRef.id +
      "\nPayment: CASH ON DELIVERY"
    );

    await loadMyOrders();

  } catch (error) {

    console.error(
      "Order error:",
      error
    );

    showToast(
      "Order place nahi hua: " +
      (error.message || "")
    );
  }
};


// ============================================================
// MY ORDERS
// ============================================================

async function loadMyOrders() {

  if (!currentUser) return;

  const container =
    $("myOrders");

  if (!container) return;

  try {

    const q =
      query(
        collection(db, "orders"),
        where(
          "customerId",
          "==",
          currentUser.uid
        )
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      container.innerHTML =
        "<p>Abhi koi order nahi hai.</p>";

      return;
    }

    const orders = [];

    snapshot.forEach(item => {

      orders.push({
        id: item.id,
        ...item.data()
      });

    });

    orders.sort(
      (a, b) => {

        const aTime =
          a.createdAt?.seconds ||
          0;

        const bTime =
          b.createdAt?.seconds ||
          0;

        return bTime - aTime;
      }
    );

    container.innerHTML =
      orders.map(order => {

        return `
          <div class="order-card">

            <strong>
              Order #${escapeHTML(order.id)}
            </strong>

            <p>
              Total:
              ₹${Number(order.total || 0)}
            </p>

            <p>
              Payment:
              ${escapeHTML(
                order.paymentMethod || "COD"
              )}
            </p>

            <p>
              Status:
              <strong>
                ${escapeHTML(
                  order.status || "NEW"
                )}
              </strong>
            </p>

            <p>
              Address:
              ${escapeHTML(
                order.address || ""
              )}
            </p>

          </div>
        `;
      }).join("");

  } catch (error) {

    console.error(
      "Orders loading error:",
      error
    );

    container.innerHTML =
      "<p>Orders load nahi ho paaye.</p>";
  }
}


// ============================================================
// PAGE INIT
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    ensureAuthUI();
    updateAuthModal();

    updateCartUI();
    updateAuthUI();

    await loadShops();
    await loadProducts();

  }
);