// =====================================================
// AIO DIGITAL MALL
// MAIN ROOT APP.JS
// Customer + Team shared Firebase backend
// =====================================================

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
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// =====================================================
// FIREBASE CONFIG
// =====================================================

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

// =====================================================
// HELPERS
// =====================================================

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

// =====================================================
// GLOBAL STATE
// =====================================================

let products = [];
let cart = JSON.parse(localStorage.getItem("aio_cart") || "[]");

let confirmationResult = null;
let recaptchaVerifier = null;

// =====================================================
// PHONE LOGIN
// =====================================================

window.setupRecaptcha = function () {

  if (!$("recaptcha")) return;

  if (recaptchaVerifier) return;

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha",
    {
      size: "invisible"
    }
  );

  recaptchaVerifier.render();
};

// =====================================================
// SEND OTP
// =====================================================

window.sendOTP = async function () {

  const phoneInput = $("phone");

  if (!phoneInput) return;

  const phone = phoneInput.value.trim();

  if (!phone) {
    alert("Mobile number daalo.");
    return;
  }

  if (!phone.startsWith("+")) {
    alert("Country code ke saath number daalo.\nExample: +919876543210");
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

    alert("OTP bhej diya ✅");

  } catch (error) {

    console.error(error);

    alert(
      "OTP send nahi hua ❌\n" +
      error.message
    );
  }
};

// =====================================================
// VERIFY OTP
// =====================================================

window.verifyOTP = async function () {

  const otpInput = $("otp");

  if (!otpInput) return;

  const otp = otpInput.value.trim();

  if (!confirmationResult) {
    alert("Pehle OTP bhejo.");
    return;
  }

  if (!otp) {
    alert("OTP daalo.");
    return;
  }

  try {

    const result =
      await confirmationResult.confirm(otp);

    console.log(
      "Customer logged in:",
      result.user.uid
    );

    alert("Login successful ✅");

    if ($("loginBox")) {
      $("loginBox").style.display = "none";
    }

  } catch (error) {

    console.error(error);

    alert(
      "OTP galat hai ya expire ho gaya ❌"
    );
  }
};

// =====================================================
// LOGOUT
// =====================================================

window.logout = async function () {

  try {

    await signOut(auth);

    alert("Logout ho gaya.");

  } catch (error) {

    console.error(error);
  }
};

// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(auth, user => {

  window.currentUser = user || null;

  if (user) {

    console.log(
      "Logged in:",
      user.phoneNumber || user.uid
    );

    if ($("loginStatus")) {
      $("loginStatus").textContent =
        user.phoneNumber || "Logged in";
    }

  } else {

    console.log("Customer not logged in");

    if ($("loginStatus")) {
      $("loginStatus").textContent =
        "Guest";
    }
  }
});

// =====================================================
// PRODUCTS
// =====================================================

function productCard(id, p) {

  const name =
    p.name || "Product";

  const image =
    p.photo ||
    p.image ||
    "https://via.placeholder.com/400x300?text=AIO+Digital+Mall";

  const price =
    Number(p.price || 0);

  const stock =
    Number(
      p.stock === undefined
        ? 1
        : p.stock
    );

  return `
    <article class="product-card">

      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(name)}"
        loading="lazy"
      >

      <div class="product-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(
            p.description || ""
          )}
        </p>

        <strong>
          ${money(price)}
        </strong>

        ${
          stock <= 0

          ? `
            <button
              class="btn"
              disabled
            >
              OUT OF STOCK
            </button>
          `

          : `
            <button
              class="btn"
              onclick="addCart(
                '${id}',
                ${JSON.stringify(name)},
                ${price}
              )"
            >
              ADD TO CART
            </button>
          `
        }

      </div>

    </article>
  `;
}

// =====================================================
// LOAD PRODUCTS
// =====================================================

window.loadProducts = function () {

  const container =
    $("localProducts");

  if (!container) return;

  const productsRef =
    collection(db, "products");

  onSnapshot(
    productsRef,

    snapshot => {

      products = [];

      snapshot.forEach(item => {

        const data = item.data();

        products.push({
          id: item.id,
          ...data
        });
      });

      const localProducts =
        products.filter(
          p => p.type !== "affiliate"
        );

      if (!localProducts.length) {

        container.innerHTML = `
          <p>
            Abhi products available nahi hain.
          </p>
        `;

        return;
      }

      container.innerHTML =
        localProducts
          .map(p =>
            productCard(p.id, p)
          )
          .join("");

    },

    error => {

      console.error(
        "Products error:",
        error
      );

      container.innerHTML =
        "<p>Products load nahi ho paaye.</p>";
    }
  );
};

// =====================================================
// AFFILIATE PRODUCTS
// =====================================================

window.loadAffiliateProducts = function () {

  const container =
    $("affiliateProducts");

  if (!container) return;

  onSnapshot(
    collection(db, "products"),

    snapshot => {

      const affiliate =
        snapshot.docs
          .map(d => ({
            id: d.id,
            ...d.data()
          }))
          .filter(
            p => p.type === "affiliate"
          );

      if (!affiliate.length) {

        container.innerHTML =
          "<p>Amazon deals available nahi hain.</p>";

        return;
      }

      container.innerHTML =
        affiliate.map(p => {

          const image =
            p.photo ||
            p.image ||
            "https://via.placeholder.com/400x300?text=Amazon";

          return `
            <article class="product-card affiliate">

              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(p.name || "Amazon Product")}"
                loading="lazy"
              >

              <div class="product-info">

                <h3>
                  ${escapeHTML(
                    p.name || "Amazon Product"
                  )}
                </h3>

                <strong>
                  ${money(p.price)}
                </strong>

                <button
                  class="btn"
                  onclick="openAffiliate(
                    ${JSON.stringify(p.link || "#")}
                  )"
                >
                  BUY ON AMAZON
                </button>

              </div>

            </article>
          `;

        }).join("");
    }
  );
};

window.openAffiliate = function (url) {

  if (!url || url === "#") {
    alert("Product link available nahi hai.");
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
};

// =====================================================
// SEARCH
// =====================================================

window.searchProducts = function () {

  const input = $("search");

  if (!input) return;

  const value =
    input.value
      .trim()
      .toLowerCase();

  const container =
    $("localProducts");

  if (!container) return;

  const filtered =
    products.filter(p => {

      if (p.type === "affiliate") {
        return false;
      }

      return String(
        p.name || ""
      )
        .toLowerCase()
        .includes(value);
    });

  if (!filtered.length) {

    container.innerHTML =
      "<p>Product nahi mila.</p>";

    return;
  }

  container.innerHTML =
    filtered
      .map(p => productCard(p.id, p))
      .join("");
};

// =====================================================
// CART
// =====================================================

function saveCart() {

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );
}

window.addCart = function (
  id,
  name,
  price
) {

  const existing =
    cart.find(
      item => item.id === id
    );

  if (existing) {

    existing.quantity =
      Number(existing.quantity || 1) + 1;

  } else {

    cart.push({
      id,
      name,
      price: Number(price || 0),
      quantity: 1
    });
  }

  saveCart();

  updateCartUI();

  alert(
    `${name} cart me add ho gaya ✅`
  );
};

window.removeCart = function (index) {

  cart.splice(index, 1);

  saveCart();

  updateCartUI();
};

window.changeCartQty = function (
  index,
  amount
) {

  if (!cart[index]) return;

  cart[index].quantity =
    Number(cart[index].quantity || 1)
    + amount;

  if (cart[index].quantity <= 0) {

    cart.splice(index, 1);
  }

  saveCart();

  updateCartUI();
};

// =====================================================
// CART UI
// =====================================================

window.updateCartUI = function () {

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

  const cartTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 1),
      0
    );

  if (count) {
    count.textContent =
      itemCount;
  }

  if (total) {
    total.textContent =
      cartTotal.toLocaleString(
        "en-IN"
      );
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

          <div>

            <strong>
              ${escapeHTML(item.name)}
            </strong>

            <div>
              ${money(item.price)}
            </div>

          </div>

          <div class="cart-controls">

            <button
              onclick="changeCartQty(${index}, -1)"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              onclick="changeCartQty(${index}, 1)"
            >
              +
            </button>

            <button
              onclick="removeCart(${index})"
            >
              🗑️
            </button>

          </div>

        </div>
      `
    ).join("");
};

// =====================================================
// CART TOGGLE
// =====================================================

window.toggleCart = function () {

  const box =
    $("cartBox");

  if (!box) return;

  box.style.display =
    box.style.display === "none"
      ? "block"
      : "none";
};

// =====================================================
// PLACE COD ORDER
// =====================================================

window.placeCODOrder =
async function () {

  if (!cart.length) {

    alert("Cart khali hai ❌");

    return;
  }

  const user =
    auth.currentUser;

  const phone =
    user?.phoneNumber ||
    prompt("Mobile number daalo");

  if (!phone) {

    alert("Mobile number required hai.");

    return;
  }

  const address =
    prompt(
      "Complete delivery address daalo"
    );

  if (!address) {

    alert("Address required hai.");

    return;
  }

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 1),
      0
    );

  const deliveryOTP =
    String(
      Math.floor(
        1000 +
        Math.random() * 9000
      )
    );

  try {

    const order = {

      userId:
        user?.uid || null,

      phone,

      address,

      items: cart,

      total,

      paymentMethod: "COD",

      status: "NEW",

      deliveryOTP,

      createdAt:
        serverTimestamp()
    };

    const orderRef =
      await addDoc(
        collection(db, "orders"),
        order
      );

    cart = [];

    saveCart();

    updateCartUI();

    alert(
      "Order Successfully Place Ho Gaya ✅\n\n" +
      "Payment: CASH ON DELIVERY\n" +
      "Order ID: " +
      orderRef.id +
      "\n\n" +
      "Delivery OTP: " +
      deliveryOTP
    );

  } catch (error) {

    console.error(
      "Order error:",
      error
    );

    alert(
      "Order place nahi hua ❌\n" +
      error.message
    );
  }
};

// Compatibility
window.placeOrder =
  window.placeCODOrder;

// =====================================================
// BANNER
// =====================================================

window.loadMainBanner = function () {

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
    }
  );
};

// =====================================================
// FLASH SALE
// =====================================================

let flashTime = 10799;

setInterval(() => {

  const timer =
    $("timer");

  if (!timer) return;

  if (flashTime <= 0) {
    flashTime = 10799;
  }

  flashTime--;

  const h =
    Math.floor(
      flashTime / 3600
    );

  const m =
    Math.floor(
      (flashTime % 3600) / 60
    );

  const s =
    flashTime % 60;

  timer.textContent =
    `${String(h).padStart(2, "0")}:` +
    `${String(m).padStart(2, "0")}:` +
    `${String(s).padStart(2, "0")}`;

}, 1000);

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
              "SW error:",
              error
            )
        );
    }
  );
}

// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateCartUI();

    setupRecaptcha();

    loadProducts();

    loadAffiliateProducts();

    loadMainBanner();

  }
);
