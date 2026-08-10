// =====================================================
// AIO DIGITAL MALL
// ROOT CUSTOMER APP
// Firebase + Products + Cart + Phone Login
// =====================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
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


// =====================================================
// FIREBASE START
// =====================================================

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

let cart = [];

try {

  cart =
    JSON.parse(
      localStorage.getItem("aio_cart") || "[]"
    );

  if (!Array.isArray(cart)) {
    cart = [];
  }

} catch {

  cart = [];

}


let confirmationResult = null;

let recaptchaVerifier = null;

let recaptchaRendered = false;


// =====================================================
// PHONE LOGIN - RECAPTCHA
// =====================================================

function setupRecaptcha() {

  if (!$("recaptcha-container")) {
    return;
  }

  if (recaptchaVerifier) {
    return;
  }

  try {

    recaptchaVerifier =
      new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible"
        }
      );

    recaptchaVerifier
      .render()
      .then(() => {

        recaptchaRendered = true;

      })
      .catch(error => {

        console.error(
          "Recaptcha render error:",
          error
        );

      });

  } catch (error) {

    console.error(
      "Recaptcha setup error:",
      error
    );

  }

}


// =====================================================
// SEND OTP
// =====================================================

async function sendOTP() {

  const input = $("phoneInput");

  if (!input) {
    return;
  }

  let phone =
    input.value.trim();

  if (!phone) {

    alert(
      "Mobile number daalo."
    );

    return;
  }


  phone =
    phone.replace(
      /[\s-]/g,
      ""
    );


  if (!phone.startsWith("+")) {

    alert(
      "Country code ke saath number daalo.\n\n" +
      "Example:\n+919876543210"
    );

    return;
  }


  const button =
    $("sendOtpButton");


  try {

    if (button) {
      button.disabled = true;
      button.textContent = "SENDING...";
    }


    setupRecaptcha();


    if (!recaptchaVerifier) {

      throw new Error(
        "reCAPTCHA initialize nahi hua."
      );

    }


    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );


    if ($("otpInput")) {
      $("otpInput").style.display =
        "block";
    }


    if ($("verifyOtpButton")) {
      $("verifyOtpButton").style.display =
        "block";
    }


    if ($("loginStatus")) {

      $("loginStatus").textContent =
        "OTP bhej diya gaya ✅";

    }


    alert(
      "OTP bhej diya gaya ✅"
    );


  } catch (error) {

    console.error(
      "OTP send error:",
      error
    );


    if ($("loginStatus")) {

      $("loginStatus").textContent =
        error.message ||
        "OTP send nahi hua.";

    }


    alert(
      "OTP send nahi hua ❌\n\n" +
      (error.message || error)
    );


    /*
      reCAPTCHA reset
    */

    try {

      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }

    } catch {}


    recaptchaVerifier = null;
    recaptchaRendered = false;


  } finally {

    if (button) {

      button.disabled = false;
      button.textContent = "SEND OTP";

    }

  }

}


// =====================================================
// VERIFY OTP
// =====================================================

async function verifyOTP() {

  const input =
    $("otpInput");

  if (!input) {
    return;
  }

  const otp =
    input.value.trim();


  if (!confirmationResult) {

    alert(
      "Pehle OTP bhejo."
    );

    return;
  }


  if (!otp) {

    alert(
      "OTP daalo."
    );

    return;
  }


  try {

    const result =
      await confirmationResult.confirm(
        otp
      );


    console.log(
      "Customer logged in:",
      result.user.uid
    );


    if ($("loginStatus")) {

      $("loginStatus").textContent =
        "Login successful ✅";

    }


    alert(
      "Login successful ✅"
    );


    closeLogin();


  } catch (error) {

    console.error(
      "OTP verify error:",
      error
    );


    alert(
      "OTP galat hai ya expire ho gaya ❌"
    );

  }

}


// =====================================================
// GOOGLE LOGIN
// =====================================================

async function googleLogin() {

  try {

    const provider =
      new GoogleAuthProvider();

    await signInWithPopup(
      auth,
      provider
    );


    if ($("loginStatus")) {

      $("loginStatus").textContent =
        "Google login successful ✅";

    }


    closeLogin();


  } catch (error) {

    console.error(
      "Google login error:",
      error
    );


    alert(
      "Google login nahi hua ❌\n\n" +
      error.message
    );

  }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
  auth,
  user => {

    window.currentUser =
      user || null;


    const status =
      $("loginStatus");


    if (user) {

      console.log(
        "Logged in:",
        user.phoneNumber ||
        user.email ||
        user.uid
      );


      if (status) {

        status.textContent =
          user.phoneNumber ||
          user.email ||
          "Logged in";

      }


      const loginButton =
        $("loginButton");


      if (loginButton) {

        loginButton.textContent =
          "👤 Account";

      }

    } else {

      console.log(
        "Customer not logged in"
      );


      if (status) {
        status.textContent =
          "Guest";
      }


      const loginButton =
        $("loginButton");


      if (loginButton) {

        loginButton.textContent =
          "👤 Login";

      }

    }

  }
);


// =====================================================
// PRODUCT CARD
// =====================================================

function productCard(id, p) {

  const name =
    p.name ||
    "Product";


  const image =
    p.photo ||
    p.image ||
    "https://via.placeholder.com/400x300?text=AIO+Digital+Mall";


  const price =
    Number(
      p.price || 0
    );


  const stock =
    Number(
      p.stock === undefined
        ? 1
        : p.stock
    );


  return `

    <article class="product-card">

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(name)}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/400x300?text=Product'"
      >

      <div class="product-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        ${
          p.description
            ? `
              <p class="product-description">
                ${escapeHTML(
                  p.description
                )}
              </p>
            `
            : ""
        }

        <div class="product-price">
          ${money(price)}
        </div>

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
                data-add-product="${escapeHTML(id)}"
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


  if (!container) {
    return;
  }


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


      const localProducts =
        products.filter(
          p =>
            p.type !== "affiliate"
        );


      if (!localProducts.length) {

        container.innerHTML = `

          <div class="empty">

            Abhi products available
            nahi hain.

          </div>

        `;

        return;
      }


      container.innerHTML =
        localProducts
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


      container.innerHTML = `

        <div class="empty">

          Products load nahi ho paaye.

          <br><br>

          ${escapeHTML(
            error.message
          )}

        </div>

      `;

    }

  );

}


// =====================================================
// LOAD AFFILIATE PRODUCTS
// =====================================================

function loadAffiliateProducts() {

  const container =
    $("affiliateGrid");


  if (!container) {
    return;
  }


  onSnapshot(

    collection(
      db,
      "products"
    ),

    snapshot => {

      const affiliate =
        snapshot.docs
          .map(
            d => ({
              id: d.id,
              ...d.data()
            })
          )
          .filter(
            p =>
              p.type === "affiliate"
          );


      if (!affiliate.length) {

        container.innerHTML = `

          <div class="empty">

            Amazon deals
            available nahi hain.

          </div>

        `;

        return;
      }


      container.innerHTML =
        affiliate
          .map(p => {

            const image =
              p.photo ||
              p.image ||
              "https://via.placeholder.com/400x300?text=Amazon";


            return `

              <article class="product-card">

                <img
                  class="product-image"
                  src="${escapeHTML(image)}"
                  alt="${escapeHTML(
                    p.name ||
                    "Amazon Product"
                  )}"
                  loading="lazy"
                  onerror="this.src='https://via.placeholder.com/400x300?text=Amazon'"
                >

                <div class="product-info">

                  <h3>
                    ${escapeHTML(
                      p.name ||
                      "Amazon Product"
                    )}
                  </h3>

                  <div class="product-price">
                    ${money(p.price)}
                  </div>

                  <button
                    class="add-btn"
                    data-affiliate="${escapeHTML(
                      p.link || ""
                    )}"
                  >
                    BUY ON AMAZON
                  </button>

                </div>

              </article>

            `;

          })
          .join("");

    },

    error => {

      console.error(
        "Affiliate error:",
        error
      );


      container.innerHTML = `

        <div class="empty">

          Deals load nahi ho paaye.

        </div>

      `;

    }

  );

}


// =====================================================
// SEARCH
// =====================================================

function searchProducts() {

  const input =
    $("searchInput");


  const container =
    $("productGrid");


  if (!input || !container) {
    return;
  }


  const value =
    input.value
      .trim()
      .toLowerCase();


  if (!value) {

    const localProducts =
      products.filter(
        p =>
          p.type !== "affiliate"
      );


    container.innerHTML =
      localProducts
        .map(
          p =>
            productCard(
              p.id,
              p
            )
        )
        .join("");

    return;
  }


  const filtered =
    products.filter(
      p => {

        if (
          p.type ===
          "affiliate"
        ) {
          return false;
        }


        const name =
          String(
            p.name || ""
          ).toLowerCase();


        const description =
          String(
            p.description || ""
          ).toLowerCase();


        const category =
          String(
            p.category || ""
          ).toLowerCase();


        return (
          name.includes(value) ||
          description.includes(value) ||
          category.includes(value)
        );

      }
    );


  if (!filtered.length) {

    container.innerHTML = `

      <div class="empty">

        Product nahi mila 🔎

      </div>

    `;

    return;
  }


  container.innerHTML =
    filtered
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
// CART SAVE
// =====================================================

function saveCart() {

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );

}


// =====================================================
// ADD CART
// =====================================================

function addCart(
  id
) {

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


  const price =
    Number(
      product.price || 0
    );


  const existing =
    cart.find(
      item =>
        item.id === id
    );


  if (existing) {

    existing.quantity =
      Number(
        existing.quantity || 1
      ) + 1;

  } else {

    cart.push({

      id,

      name:
        product.name ||
        "Product",

      price,

      image:
        product.photo ||
        product.image ||
        "",

      quantity: 1

    });

  }


  saveCart();

  updateCartUI();

  openCart();

}


// =====================================================
// CHANGE QUANTITY
// =====================================================

function changeCartQty(
  index,
  amount
) {

  if (!cart[index]) {
    return;
  }


  cart[index].quantity =
    Number(
      cart[index].quantity || 1
    ) + amount;


  if (
    cart[index].quantity <= 0
  ) {

    cart.splice(
      index,
      1
    );

  }


  saveCart();

  updateCartUI();

}


// =====================================================
// REMOVE CART
// =====================================================

function removeCart(index) {

  if (!cart[index]) {
    return;
  }


  cart.splice(
    index,
    1
  );


  saveCart();

  updateCartUI();

}


// =====================================================
// CART UI
// =====================================================

function updateCartUI() {

  const count =
    $("cartCount");


  const items =
    $("cartItems");


  const subtotalElement =
    $("cartSubtotal");


  const deliveryElement =
    $("deliveryFee");


  const totalElement =
    $("cartTotal");


  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );


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


  const delivery =
    subtotal > 0
      ? 0
      : 0;


  const total =
    subtotal +
    delivery;


  if (count) {
    count.textContent =
      itemCount;
  }


  if (subtotalElement) {

    subtotalElement.textContent =
      subtotal.toLocaleString(
        "en-IN"
      );

  }


  if (deliveryElement) {

    deliveryElement.textContent =
      delivery.toLocaleString(
        "en-IN"
      );

  }


  if (totalElement) {

    totalElement.textContent =
      total.toLocaleString(
        "en-IN"
      );

  }


  if (!items) {
    return;
  }


  if (!cart.length) {

    items.innerHTML = `

      <div class="empty">

        Your cart is empty 🛒

      </div>

    `;

    return;
  }


  items.innerHTML =
    cart
      .map(
        (item, index) => `

          <div class="cart-item">

            ${
              item.image
                ? `
                  <img
                    class="cart-item-image"
                    src="${escapeHTML(
                      item.image
                    )}"
                    alt=""
                  >
                `
                : ""
            }

            <div class="cart-item-info">

              <div class="cart-item-name">

                ${escapeHTML(
                  item.name
                )}

              </div>

              <div class="cart-item-price">

                ${money(
                  item.price
                )}

              </div>

              <div class="quantity-row">

                <button
                  class="quantity-btn"
                  data-qty-index="${index}"
                  data-qty-change="-1"
                >
                  −
                </button>

                <strong>
                  ${item.quantity}
                </strong>

                <button
                  class="quantity-btn"
                  data-qty-index="${index}"
                  data-qty-change="1"
                >
                  +
                </button>

                <button
                  class="remove-item"
                  data-remove-index="${index}"
                >
                  🗑️
                </button>

              </div>

            </div>

          </div>

        `
      )
      .join("");

}


// =====================================================
// CART OPEN
// =====================================================

function openCart() {

  const overlay =
    $("cartOverlay");


  if (overlay) {

    overlay.classList.add(
      "active"
    );

  }

}


// =====================================================
// CART CLOSE
// =====================================================

function closeCart() {

  const overlay =
    $("cartOverlay");


  if (overlay) {

    overlay.classList.remove(
      "active"
    );

  }

}


// =====================================================
// LOGIN OPEN
// =====================================================

function openLogin() {

  const modal =
    $("loginModal");


  if (!modal) {
    return;
  }


  modal.classList.add(
    "active"
  );


  setTimeout(
    setupRecaptcha,
    100
  );

}


// =====================================================
// LOGIN CLOSE
// =====================================================

function closeLogin() {

  const modal =
    $("loginModal");


  if (modal) {

    modal.classList.remove(
      "active"
    );

  }

}


// =====================================================
// PLACE COD ORDER
// =====================================================

async function placeCODOrder() {

  if (!cart.length) {

    alert(
      "Cart khali hai ❌"
    );

    return;
  }


  const user =
    auth.currentUser;


  const phone =
    user?.phoneNumber ||
    prompt(
      "Mobile number daalo"
    );


  if (!phone) {

    alert(
      "Mobile number required hai."
    );

    return;
  }


  const address =
    prompt(
      "Complete delivery address daalo"
    );


  if (!address) {

    alert(
      "Address required hai."
    );

    return;
  }


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


  const deliveryOTP =
    String(
      Math.floor(
        1000 +
        Math.random() *
        9000
      )
    );


  try {

    const order = {

      userId:
        user?.uid ||
        null,

      phone,

      address,

      items:
        cart,

      total,

      paymentMethod:
        "COD",

      status:
        "NEW",

      deliveryOTP,

      createdAt:
        serverTimestamp()

    };


    const orderRef =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        order
      );


    cart = [];


    saveCart();

    updateCartUI();

    closeCart();


    alert(

      "Order Successfully " +
      "Place Ho Gaya ✅\n\n" +

      "Payment: CASH ON DELIVERY\n\n" +

      "Order ID:\n" +
      orderRef.id +

      "\n\nDelivery OTP:\n" +
      deliveryOTP

    );


  } catch (error) {

    console.error(
      "Order error:",
      error
    );


    alert(

      "Order place nahi hua ❌\n\n" +
      error.message

    );

  }

}


// =====================================================
// AFFILIATE CLICK
// =====================================================

function openAffiliate(url) {

  if (!url) {

    alert(
      "Product link available nahi hai."
    );

    return;
  }


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


// =====================================================
// CATEGORY CLICK
// =====================================================

function filterCategory(
  category
) {

  const input =
    $("searchInput");


  if (input) {

    input.value =
      category;

  }


  searchProducts();


  window.scrollTo({

    top:
      document.querySelector(
        ".section:nth-of-type(4)"
      )?.offsetTop || 0,

    behavior:
      "smooth"

  });

}


// =====================================================
// EVENT DELEGATION
// =====================================================

document.addEventListener(
  "click",
  event => {

    const addButton =
      event.target.closest(
        "[data-add-product]"
      );


    if (addButton) {

      addCart(
        addButton.dataset
          .addProduct
      );

      return;
    }


    const affiliateButton =
      event.target.closest(
        "[data-affiliate]"
      );


    if (affiliateButton) {

      openAffiliate(
        affiliateButton.dataset
          .affiliate
      );

      return;
    }


    const qtyButton =
      event.target.closest(
        "[data-qty-index]"
      );


    if (qtyButton) {

      changeCartQty(

        Number(
          qtyButton.dataset
            .qtyIndex
        ),

        Number(
          qtyButton.dataset
            .qtyChange
        )

      );

      return;
    }


    const removeButton =
      event.target.closest(
        "[data-remove-index]"
      );


    if (removeButton) {

      removeCart(
        Number(
          removeButton.dataset
            .removeIndex
        )
      );

      return;
    }


    const category =
      event.target.closest(
        ".category-card"
      );


    if (category) {

      const text =
        category
          .querySelector(
            "span"
          )
          ?.textContent
          ?.trim();


      if (text) {

        filterCategory(
          text
        );

      }

    }

  }
);


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {


    // Initial cart

    updateCartUI();


    // Search

    const searchInput =
      $("searchInput");


    if (searchInput) {

      searchInput.addEventListener(
        "input",
        searchProducts
      );

    }


    // Cart button

    const cartButton =
      $("cartButton");


    if (cartButton) {

      cartButton.addEventListener(
        "click",
        openCart
      );

    }


    // Close cart

    const closeCartButton =
      $("closeCartButton");


    if (closeCartButton) {

      closeCartButton.addEventListener(
        "click",
        closeCart
      );

    }


    // Overlay click

    const cartOverlay =
      $("cartOverlay");


    if (cartOverlay) {

      cartOverlay.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            cartOverlay
          ) {

            closeCart();

          }

        }
      );

    }


    // Login button

    const loginButton =
      $("loginButton");


    if (loginButton) {

      loginButton.addEventListener(
        "click",
        openLogin
      );

    }


    // Close login

    const closeLoginButton =
      $("closeLoginButton");


    if (closeLoginButton) {

      closeLoginButton.addEventListener(
        "click",
        closeLogin
      );

    }


    // Send OTP

    const sendOtpButton =
      $("sendOtpButton");


    if (sendOtpButton) {

      sendOtpButton.addEventListener(
        "click",
        sendOTP
      );

    }


    // Verify OTP

    const verifyOtpButton =
      $("verifyOtpButton");


    if (verifyOtpButton) {

      verifyOtpButton.addEventListener(
        "click",
        verifyOTP
      );

    }


    // Google

    const googleLoginButton =
      $("googleLoginButton");


    if (googleLoginButton) {

      googleLoginButton.addEventListener(
        "click",
        googleLogin
      );

    }


    // Checkout

    const checkoutButton =
      $("checkoutButton");


    if (checkoutButton) {

      checkoutButton.addEventListener(
        "click",
        placeCODOrder
      );

    }


    // Explore

    const exploreButton =
      $("exploreButton");


    if (exploreButton) {

      exploreButton.addEventListener(
        "click",
        () => {

          document
            .querySelector(
              ".section"
            )
            ?.scrollIntoView({
              behavior:
                "smooth"
            });

        }
      );

    }


    // Home

    const homeButton =
      $("homeNavButton");


    if (homeButton) {

      homeButton.addEventListener(
        "click",
        () => {

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );

    }


    // Search bottom nav

    const searchNav =
      $("searchNavButton");


    if (searchNav) {

      searchNav.addEventListener(
        "click",
        () => {

          searchInput?.focus();

        }
      );

    }


    // Profile

    const profileNav =
      $("profileNavButton");


    if (profileNav) {

      profileNav.addEventListener(
        "click",
        openLogin
      );

    }


    // Load Firebase data

    loadProducts();

    loadAffiliateProducts();

  }
);


// =====================================================
// GLOBAL COMPATIBILITY
// =====================================================

window.addCart =
  addCart;

window.removeCart =
  removeCart;

window.changeCartQty =
  changeCartQty;

window.updateCartUI =
  updateCartUI;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.openLogin =
  openLogin;

window.closeLogin =
  closeLogin;

window.sendOTP =
  sendOTP;

window.verifyOTP =
  verifyOTP;

window.googleLogin =
  googleLogin;

window.logout =
  logout;

window.placeCODOrder =
  placeCODOrder;

window.placeOrder =
  placeCODOrder;

window.openAffiliate =
  openAffiliate;

window.searchProducts =
  searchProducts;