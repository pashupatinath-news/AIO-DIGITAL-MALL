// ============================================================
// AIO DIGITAL MALL
// CUSTOMER APP.JS
// Swiggy-style Customer Website + App
// Firebase Auth + Firestore + Cart + Orders + Search
// ============================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
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


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let confirmationResult = null;
let recaptchaVerifier = null;

let cart = JSON.parse(
  localStorage.getItem("aio_customer_cart") || "[]"
);

let allProducts = [];
let allShops = [];


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

    toast.style.position = "fixed";
    toast.style.bottom = "25px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "99999";
    toast.style.background = "#222";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "10px";
    toast.style.fontSize = "14px";

    document.body.appendChild(toast);
  }

  toast.innerText = message;
  toast.style.display = "block";

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}


// ============================================================
// AUTH
// ============================================================

function setupRecaptcha() {

  if (!$("recaptcha-container")) return;

  if (recaptchaVerifier) return;

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "invisible"
    }
  );
}


// ============================================================
// SEND OTP
// ============================================================

window.sendOTP = async function () {

  const phoneInput = $("phone");

  if (!phoneInput) return;

  let phone = phoneInput.value.trim();

  if (!phone) {
    showToast("Mobile number daalo");
    return;
  }

  if (!phone.startsWith("+")) {
    showToast(
      "Country code ke saath number daalo. Example: +919876543210"
    );
    return;
  }

  try {

    setupRecaptcha();

    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );

    showToast("OTP bhej diya ✅");

    if ($("otpBox")) {
      $("otpBox").style.display = "block";
    }

  } catch (error) {

    console.error(error);

    showToast(
      "OTP error: " + error.message
    );
  }
};


// ============================================================
// VERIFY OTP
// ============================================================

window.verifyOTP = async function () {

  const otpInput = $("otp");

  if (!otpInput) return;

  const otp = otpInput.value.trim();

  if (!confirmationResult) {
    showToast("Pehle OTP bhejo");
    return;
  }

  if (!otp) {
    showToast("OTP daalo");
    return;
  }

  try {

    const result =
      await confirmationResult.confirm(otp);

    currentUser = result.user;

    showToast("Login successful ✅");

    if ($("loginModal")) {
      $("loginModal").style.display = "none";
    }

    await loadUserProfile();

  } catch (error) {

    console.error(error);

    showToast("Galat OTP ❌");
  }
};


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async user => {

  currentUser = user;

  updateAuthUI();

  if (user) {
    await loadUserProfile();
    await loadMyOrders();
  }

});


// ============================================================
// AUTH UI
// ============================================================

function updateAuthUI() {

  const loginButton = $("loginButton");
  const accountButton = $("accountButton");

  if (currentUser) {

    if (loginButton) {
      loginButton.innerText = "ACCOUNT";
    }

    if (accountButton) {
      accountButton.style.display = "block";
    }

  } else {

    if (loginButton) {
      loginButton.innerText = "LOGIN";
    }

    if (accountButton) {
      accountButton.style.display = "none";
    }
  }
}


// ============================================================
// LOGOUT
// ============================================================

window.logoutCustomer = async function () {

  try {

    await signOut(auth);

    currentUser = null;

    showToast("Logout ho gaya");

  } catch (error) {

    console.error(error);

    showToast("Logout failed");
  }
};


// ============================================================
// USER PROFILE
// ============================================================

async function loadUserProfile() {

  if (!currentUser) return;

  try {

    const userRef =
      doc(db, "customers", currentUser.uid);

    const snap =
      await getDoc(userRef);

    if (snap.exists()) {

      const data = snap.data();

      if ($("customerName")) {
        $("customerName").innerText =
          data.name || "Customer";
      }

    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );
  }
}


// ============================================================
// LOAD SHOPS
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


// ============================================================
// RENDER SHOPS
// ============================================================

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
          shop.name || "Shop"
        );

      const image =
        shop.image ||
        shop.photo ||
        "https://via.placeholder.com/300";

      const category =
        escapeHTML(
          shop.category || "Shop"
        );

      return `
        <div class="shop-card"
             onclick="openShop('${shop.id}')">

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


// ============================================================
// OPEN SHOP
// ============================================================

window.openShop = function(shopId) {

  const shop =
    allShops.find(
      item => item.id === shopId
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

  const title =
    $("shopTitle");

  if (title) {
    title.innerText =
      shop.name || "Shop";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

  try {

    const snapshot =
      await getDocs(
        collection(db, "products")
      );

    allProducts = [];

    snapshot.forEach(item => {

      const data = item.data();

      allProducts.push({
        id: item.id,
        ...data
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


// ============================================================
// RENDER PRODUCTS
// ============================================================

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
          product.name || "Product"
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
                onclick="addToCart(
                  '${product.id}'
                )"
              >
                ADD TO CART
              </button>
            `
          }

        </div>
      `;

    }).join("");
}


// ============================================================
// FEATURED PRODUCTS
// ============================================================

function renderFeaturedProducts() {

  const container =
    $("featuredProducts");

  if (!container) return;

  const products =
    allProducts.slice(0, 10);

  renderProductList(
    products,
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
// CATEGORY FILTER
// ============================================================

window.filterCategory = function(category) {

  if (!category) return;

  const results =
    allProducts.filter(product => {

      return String(
        product.category || ""
      ).toLowerCase()
        === category.toLowerCase();

    });

  renderProductList(
    results,
    $("productList")
  );
};


// ============================================================
// CART
// ============================================================

window.addToCart = function(productId) {

  const product =
    allProducts.find(
      item => item.id === productId
    );

  if (!product) {

    showToast(
      "Product nahi mila"
    );

    return;
  }

  const existing =
    cart.find(
      item => item.id === productId
    );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      name:
        product.name || "Product",

      price:
        Number(product.price || 0),

      image:
        product.photo ||
        product.image ||
        "",

      shopId:
        product.shopId || "",

      quantity: 1

    });
  }

  saveCart();

  updateCartUI();

  showToast(
    "Cart me add ho gaya 🛒"
  );
};


// ============================================================
// SAVE CART
// ============================================================

function saveCart() {

  localStorage.setItem(
    "aio_customer_cart",
    JSON.stringify(cart)
  );
}


// ============================================================
// REMOVE CART ITEM
// ============================================================

window.removeFromCart = function(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) return;

  cart.splice(index, 1);

  saveCart();

  updateCartUI();
};


// ============================================================
// CHANGE QUANTITY
// ============================================================

window.changeQuantity = function(
  index,
  amount
) {

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


// ============================================================
// CART TOTAL
// ============================================================

function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      (
        Number(item.price || 0) *
        Number(item.quantity || 1)
      ),
    0
  );
}


// ============================================================
// CART UI
// ============================================================

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
    count.innerText =
      itemCount;
  }

  if (total) {
    total.innerText =
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
      (item, index) => {

        return `
          <div class="cart-item">

            <img
              src="${item.image}"
              alt=""
            >

            <div>

              <strong>
                ${escapeHTML(item.name)}
              </strong>

              <p>
                ₹${item.price}
              </p>

              <div>

                <button
                  onclick="changeQuantity(${index}, -1)"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
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
        `;
      }
    ).join("");
}


// ============================================================
// OPEN / CLOSE CART
// ============================================================

window.toggleCart = function() {

  const cartBox =
    $("cartBox");

  if (!cartBox) return;

  if (
    cartBox.style.display ===
    "none" ||
    !cartBox.style.display
  ) {

    cartBox.style.display =
      "block";

  } else {

    cartBox.style.display =
      "none";
  }
};


// ============================================================
// PLACE COD ORDER
// ============================================================

window.placeCODOrder = async function() {

  if (!currentUser) {

    showToast(
      "Order ke liye login karo"
    );

    return;
  }

  if (!cart.length) {

    showToast(
      "Cart khali hai"
    );

    return;
  }

  const phone =
    currentUser.phoneNumber ||
    prompt("Mobile number daalo");

  const address =
    prompt(
      "Complete delivery address daalo"
    );

  if (!address) {

    showToast(
      "Address required hai"
    );

    return;
  }

  const total =
    getCartTotal();

  try {

    const orderData = {

      customerId:
        currentUser.uid,

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

    showToast(
      "Order successfully place ho gaya ✅"
    );

    if ($("cartBox")) {
      $("cartBox").style.display =
        "none";
    }

    console.log(
      "Order ID:",
      orderRef.id
    );

  } catch (error) {

    console.error(
      "Order error:",
      error
    );

    showToast(
      "Order place nahi hua ❌"
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
      (a, b) =>
        String(b.createdAt || "")
          .localeCompare(
            String(a.createdAt || "")
          )
    );

    container.innerHTML =
      orders.map(order => {

        return `
          <div class="order-card">

            <strong>
              Order #${escapeHTML(order.id)}
            </strong>

            <p>
              Total: ₹${Number(order.total || 0)}
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

          </div>
        `;

      }).join("");

  } catch (error) {

    console.error(
      "Orders error:",
      error
    );
  }
}


// ============================================================
// REAL-TIME ORDER STATUS
// ============================================================

function listenToMyOrders() {

  if (!currentUser) return;

  const q =
    query(
      collection(db, "orders"),
      where(
        "customerId",
        "==",
        currentUser.uid
      )
    );

  onSnapshot(
    q,
    snapshot => {

      console.log(
        "Orders updated:",
        snapshot.size
      );

      loadMyOrders();
    },
    error => {

      console.error(
        "Order listener error:",
        error
      );
    }
  );
}


// ============================================================
// BANNER
// ============================================================

function loadBanner() {

  const banner =
    $("mainBanner");

  if (!banner) return;

  onSnapshot(
    doc(
      db,
      "banner",
      "main"
    ),
    snapshot => {

      if (!snapshot.exists()) return;

      const data =
        snapshot.data();

      if (data.url) {

        banner.style.backgroundImage =
          `url("${data.url}")`;
      }

    },
    error => {

      console.error(
        "Banner error:",
        error
      );
    }
  );
}


// ============================================================
// FLASH SALE TIMER
// ============================================================

let flashTime =
  3 * 60 * 60;

function startFlashTimer() {

  const timer =
    $("flashTimer");

  if (!timer) return;

  setInterval(() => {

    if (flashTime <= 0) {
      flashTime =
        3 * 60 * 60;
    }

    flashTime--;

    const hours =
      Math.floor(
        flashTime / 3600
      );

    const minutes =
      Math.floor(
        (flashTime % 3600) / 60
      );

    const seconds =
      flashTime % 60;

    timer.innerText =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

  }, 1000);
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    updateCartUI();

    setupRecaptcha();

    await loadShops();

    await loadProducts();

    loadBanner();

    startFlashTimer();

    if (currentUser) {
      listenToMyOrders();
    }

  }
);


// ============================================================
// GLOBAL ACCESS
// ============================================================

window.AIO = {

  auth,
  db,

  get currentUser() {
    return currentUser;
  },

  get cart() {
    return cart;
  },

  get products() {
    return allProducts;
  },

  get shops() {
    return allShops;
  }

};

console.log(
  "AIO DIGITAL MALL Customer App Loaded ✅"
);
