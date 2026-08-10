// =====================================================
// AIO DIGITAL MALL
// ROOT APP.JS
// EMAIL + GOOGLE LOGIN
// FIRESTORE + CART + PRODUCTS + ORDERS
// =====================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// FIREBASE
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
// STATE
// =====================================================

let currentUser = null;
let products = [];

let cart = JSON.parse(
  localStorage.getItem("aio_cart") || "[]"
);


// =====================================================
// HELPERS
// =====================================================

const $ = id =>
  document.getElementById(id);

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

function showStatus(message) {

  const status = $("loginStatus");

  if (status) {
    status.textContent = message;
  }

  console.log(message);
}


// =====================================================
// LOGIN MODAL
// =====================================================

function openLogin() {

  const modal = $("loginModal");

  if (modal) {
    modal.classList.add("active");
  }
}

function closeLogin() {

  const modal = $("loginModal");

  if (modal) {
    modal.classList.remove("active");
  }
}


// =====================================================
// GOOGLE LOGIN
// =====================================================

async function googleLogin() {

  try {

    showStatus("Google login opening...");

    const provider =
      new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    await createCustomerProfile(
      result.user
    );

    showStatus("Google login successful ✅");

    closeLogin();

  } catch (error) {

    console.error(
      "Google login error:",
      error
    );

    showStatus(
      getAuthErrorMessage(error)
    );
  }
}


// =====================================================
// EMAIL LOGIN / SIGNUP UI
// =====================================================

function createEmailLoginUI() {

  const box =
    document.querySelector(".modal-box");

  if (!box) return;

  const existing =
    document.getElementById(
      "emailLoginSection"
    );

  if (existing) return;

  const section =
    document.createElement("div");

  section.id =
    "emailLoginSection";

  section.style.marginTop =
    "10px";

  section.innerHTML = `

    <input
      class="input"
      id="emailInput"
      type="email"
      placeholder="Email address"
      autocomplete="email"
    >

    <input
      class="input"
      id="passwordInput"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
    >

    <button
      class="primary-btn"
      id="emailLoginButton"
      type="button"
    >
      LOGIN WITH EMAIL
    </button>

    <button
      class="secondary-btn"
      id="emailSignupButton"
      type="button"
    >
      CREATE ACCOUNT
    </button>

  `;

  const googleButton =
    $("googleLoginButton");

  if (googleButton) {

    googleButton.before(section);

  } else {

    box.appendChild(section);
  }


  $("emailLoginButton")
    ?.addEventListener(
      "click",
      loginWithEmail
    );

  $("emailSignupButton")
    ?.addEventListener(
      "click",
      signupWithEmail
    );
}


// =====================================================
// EMAIL LOGIN
// =====================================================

async function loginWithEmail() {

  const email =
    $("emailInput")
      ?.value
      .trim();

  const password =
    $("passwordInput")
      ?.value;

  if (!email) {

    showStatus(
      "Email daalo."
    );

    return;
  }

  if (!password) {

    showStatus(
      "Password daalo."
    );

    return;
  }

  try {

    showStatus(
      "Logging in..."
    );

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    await createCustomerProfile(
      result.user
    );

    showStatus(
      "Login successful ✅"
    );

    closeLogin();

  } catch (error) {

    console.error(
      "Email login error:",
      error
    );

    showStatus(
      getAuthErrorMessage(error)
    );
  }
}


// =====================================================
// EMAIL SIGNUP
// =====================================================

async function signupWithEmail() {

  const email =
    $("emailInput")
      ?.value
      .trim();

  const password =
    $("passwordInput")
      ?.value;

  if (!email) {

    showStatus(
      "Email daalo."
    );

    return;
  }

  if (!password) {

    showStatus(
      "Password daalo."
    );

    return;
  }

  if (password.length < 6) {

    showStatus(
      "Password minimum 6 characters ka hona chahiye."
    );

    return;
  }

  try {

    showStatus(
      "Account create ho raha hai..."
    );

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await createCustomerProfile(
      result.user
    );

    showStatus(
      "Account created successfully ✅"
    );

    closeLogin();

  } catch (error) {

    console.error(
      "Signup error:",
      error
    );

    showStatus(
      getAuthErrorMessage(error)
    );
  }
}


// =====================================================
// FIREBASE ERROR MESSAGE
// =====================================================

function getAuthErrorMessage(error) {

  const code =
    error?.code || "";

  switch (code) {

    case "auth/invalid-email":
      return "Email address galat hai.";

    case "auth/user-not-found":
      return "Is email ka account nahi mila.";

    case "auth/wrong-password":
      return "Password galat hai.";

    case "auth/invalid-credential":
      return "Email ya password galat hai.";

    case "auth/email-already-in-use":
      return "Is email se account already bana hua hai.";

    case "auth/weak-password":
      return "Password minimum 6 characters ka rakho.";

    case "auth/popup-closed-by-user":
      return "Google login cancel kar diya gaya.";

    case "auth/popup-blocked":
      return "Browser ne Google popup block kar diya.";

    case "auth/operation-not-allowed":
      return "Firebase Authentication provider enabled nahi hai.";

    case "auth/network-request-failed":
      return "Internet connection check karo.";

    default:
      return (
        "Login error: " +
        (error?.message || "Unknown error")
      );
  }
}


// =====================================================
// CUSTOMER PROFILE
// =====================================================

async function createCustomerProfile(user) {

  if (!user) return;

  try {

    await setDoc(
      doc(
        db,
        "customers",
        user.uid
      ),
      {
        uid: user.uid,
        email: user.email || "",
        name:
          user.displayName ||
          "Customer",
        photo:
          user.photoURL ||
          "",
        phone:
          user.phoneNumber ||
          "",
        updatedAt:
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


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user || null;

    window.currentUser =
      currentUser;

    updateAuthUI();

    if (user) {

      await createCustomerProfile(
        user
      );

      showStatus(
        user.email ||
        user.displayName ||
        "Logged in"
      );

    } else {

      showStatus(
        "Guest"
      );
    }
  }
);


// =====================================================
// AUTH UI
// =====================================================

function updateAuthUI() {

  const loginButton =
    $("loginButton");

  if (!loginButton) return;

  if (currentUser) {

    loginButton.textContent =
      "👤 Account";

  } else {

    loginButton.textContent =
      "👤 Login";
  }
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    await signOut(auth);

    closeLogin();

    showStatus(
      "Logout successful."
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }
}


// =====================================================
// PRODUCTS
// =====================================================

function productCard(
  id,
  product
) {

  const name =
    product.name ||
    "Product";

  const image =
    product.photo ||
    product.image ||
    "https://via.placeholder.com/400x300?text=AIO+Digital+Mall";

  const price =
    Number(
      product.price || 0
    );

  const stock =
    Number(
      product.stock === undefined
        ? 1
        : product.stock
    );

  return `

    <article
      class="product-card"
    >

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(name)}"
        loading="lazy"
      >

      <div
        class="product-info"
      >

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(
            product.description || ""
          )}
        </p>

        <strong
          class="product-price"
        >
          ${money(price)}
        </strong>

        ${
          stock <= 0

          ? `
            <button
              class="add-btn"
              disabled
            >
              OUT OF STOCK
            </button>
          `

          : `
            <button
              class="add-btn"
              onclick="addCart(
                '${id}'
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

function loadProducts() {

  const container =
    $("productGrid");

  if (!container) return;

  onSnapshot(
    collection(
      db,
      "products"
    ),

    snapshot => {

      products = [];

      snapshot.forEach(
        item => {

          products.push({
            id: item.id,
            ...item.data()
          });

        }
      );

      const local =
        products.filter(
          p =>
            p.type !==
            "affiliate"
        );

      if (!local.length) {

        container.innerHTML =
          `<div class="empty">
             Abhi products available nahi hain.
           </div>`;

        return;
      }

      container.innerHTML =
        local
          .map(
            p =>
              productCard(
                p.id,
                p
              )
          )
          .join("");
    },

    error => {

      console.error(
        "Products error:",
        error
      );

      container.innerHTML =
        `<div class="empty">
           Products load nahi ho paaye.
         </div>`;
    }
  );
}


// =====================================================
// CART
// =====================================================

function saveCart() {

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );
}


window.addCart =
function(id) {

  const product =
    products.find(
      p =>
        p.id === id
    );

  if (!product) {

    alert(
      "Product nahi mila."
    );

    return;
  }

  const existing =
    cart.find(
      item =>
        item.id === id
    );

  if (existing) {

    existing.quantity++;

  } else {

    cart.push({

      id,

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

  alert(
    "Cart me add ho gaya ✅"
  );
};


window.removeCart =
function(index) {

  cart.splice(
    index,
    1
  );

  saveCart();

  updateCartUI();
};


window.changeCartQty =
function(
  index,
  amount
) {

  if (!cart[index]) return;

  cart[index].quantity +=
    amount;

  if (
    cart[index].quantity <=
    0
  ) {

    cart.splice(
      index,
      1
    );
  }

  saveCart();

  updateCartUI();
};


// =====================================================
// CART UI
// =====================================================

function updateCartUI() {

  const count =
    $("cartCount");

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 1
        ),
      0
    );

  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );

  if (count) {

    count.textContent =
      itemCount;
  }

  if ($("cartSubtotal")) {

    $("cartSubtotal")
      .textContent =
      subtotal.toLocaleString(
        "en-IN"
      );
  }

  if ($("deliveryFee")) {

    $("deliveryFee")
      .textContent =
      "0";
  }

  if ($("cartTotal")) {

    $("cartTotal")
      .textContent =
      subtotal.toLocaleString(
        "en-IN"
      );
  }

  const items =
    $("cartItems");

  if (!items) return;

  if (!cart.length) {

    items.innerHTML =
      `<div class="empty">
         Your cart is empty.
       </div>`;

    return;
  }

  items.innerHTML =
    cart.map(
      (item, index) => `

        <div class="cart-item">

          <img
            class="cart-item-image"
            src="${escapeHTML(
              item.image || ""
            )}"
            alt=""
          >

          <div
            class="cart-item-info"
          >

            <div
              class="cart-item-name"
            >
              ${escapeHTML(
                item.name
              )}
            </div>

            <div>
              ${money(
                item.price
              )}
            </div>

            <div
              class="quantity-row"
            >

              <button
                class="quantity-btn"
                onclick="changeCartQty(
                  ${index},
                  -1
                )"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                class="quantity-btn"
                onclick="changeCartQty(
                  ${index},
                  1
                )"
              >
                +
              </button>

              <button
                class="quantity-btn"
                onclick="removeCart(
                  ${index}
                )"
              >
                🗑️
              </button>

            </div>

          </div>

        </div>

      `
    ).join("");
}


// =====================================================
// SEARCH
// =====================================================

function searchProducts() {

  const input =
    $("searchInput");

  if (!input) return;

  const value =
    input.value
      .trim()
      .toLowerCase();

  const container =
    $("productGrid");

  if (!container) return;

  const result =
    products
      .filter(
        p =>
          p.type !==
          "affiliate"
      )
      .filter(
        p => {

          const name =
            String(
              p.name || ""
            )
              .toLowerCase();

          const category =
            String(
              p.category || ""
            )
              .toLowerCase();

          return (
            name.includes(value) ||
            category.includes(value)
          );
        }
      );

  if (!result.length) {

    container.innerHTML =
      `<div class="empty">
         Product nahi mila.
       </div>`;

    return;
  }

  container.innerHTML =
    result
      .map(
        p =>
          productCard(
            p.id,
            p
          )
      )
      .join("");
}


// =====================================================
// CART OPEN/CLOSE
// =====================================================

function openCart() {

  $("cartOverlay")
    ?.classList.add(
      "active"
    );
}

function closeCart() {

  $("cartOverlay")
    ?.classList.remove(
      "active"
    );
}


// =====================================================
// CHECKOUT
// =====================================================

async function checkout() {

  if (!currentUser) {

    closeCart();

    openLogin();

    showStatus(
      "Order karne ke liye login karo."
    );

    return;
  }

  if (!cart.length) {

    alert(
      "Cart khali hai."
    );

    return;
  }

  const address =
    prompt(
      "Complete delivery address daalo:"
    );

  if (!address) return;

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 1
        ),
      0
    );

  try {

    const orderRef =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        {

          customerId:
            currentUser.uid,

          customerEmail:
            currentUser.email ||
            "",

          customerName:
            currentUser.displayName ||
            "Customer",

          address,

          items:
            cart,

          total,

          paymentMethod:
            "COD",

          status:
            "NEW",

          createdAt:
            serverTimestamp()
        }
      );

    cart = [];

    saveCart();

    updateCartUI();

    closeCart();

    alert(
      "Order successfully place ho gaya ✅\n\n" +
      "Order ID: " +
      orderRef.id
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
}


// =====================================================
// EVENT LISTENERS
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    createEmailLoginUI();

    updateCartUI();

    loadProducts();


    $("loginButton")
      ?.addEventListener(
        "click",
        openLogin
      );


    $("closeLoginButton")
      ?.addEventListener(
        "click",
        closeLogin
      );


    $("googleLoginButton")
      ?.addEventListener(
        "click",
        googleLogin
      );


    $("cartButton")
      ?.addEventListener(
        "click",
        openCart
      );


    $("closeCartButton")
      ?.addEventListener(
        "click",
        closeCart
      );


    $("checkoutButton")
      ?.addEventListener(
        "click",
        checkout
      );


    $("searchInput")
      ?.addEventListener(
        "input",
        searchProducts
      );


    $("cartOverlay")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("cartOverlay")
          ) {

            closeCart();
          }
        }
      );


    $("exploreButton")
      ?.addEventListener(
        "click",
        () => {

          document
            .getElementById(
              "productGrid"
            )
            ?.scrollIntoView({
              behavior: "smooth"
            });

        }
      );


    $("profileNavButton")
      ?.addEventListener(
        "click",
        openLogin
      );


    $("ordersNavButton")
      ?.addEventListener(
        "click",
        () => {

          if (!currentUser) {

            openLogin();

            showStatus(
              "Orders dekhne ke liye login karo."
            );

            return;
          }

          alert(
            "My Orders section connected hai."
          );
        }
      );


    $("homeNavButton")
      ?.addEventListener(
        "click",
        () => {

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );


    $("searchNavButton")
      ?.addEventListener(
        "click",
        () => {

          $("searchInput")
            ?.focus();

        }
      );


    $("locationButton")
      ?.addEventListener(
        "click",
        () => {

          alert(
            "Location selection next step me connect ki jayegi."
          );

        }
      );

  }
);


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
        .register(
          "./sw.js"
        )
        .catch(
          error =>
            console.error(
              "Service Worker error:",
              error
            )
        );

    }
  );
}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.googleLogin =
  googleLogin;

window.loginWithEmail =
  loginWithEmail;

window.signupWithEmail =
  signupWithEmail;

window.logout =
  logout;

window.updateCartUI =
  updateCartUI;

window.searchProducts =
  searchProducts;

window.checkout =
  checkout;