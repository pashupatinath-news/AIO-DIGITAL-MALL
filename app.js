// ======================================================
// AIO DIGITAL MALL
// CUSTOMER APP + WEBSITE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",
  authDomain: "aio-digital-mall.firebaseapp.com",
  projectId: "aio-digital-mall",
  storageBucket: "aio-digital-mall.firebasestorage.app",
  messagingSenderId: "501384049673",
  appId: "1:501384049673:web:968bd8311cc700f82874d8",
  measurementId: "G-TNDT9FYNRP"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const $ = id => document.getElementById(id);

let confirmationResult = null;
let recaptchaVerifier = null;
let cart = JSON.parse(localStorage.getItem("aio_cart") || "[]");
let allLocalProducts = [];
let timerSeconds = 10799;

// ======================================================
// SECURITY HELPERS
// ======================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// LOGIN
// ======================================================

function openLogin() {
  $("loginModal").style.display = "flex";
}

function closeLogin() {
  $("loginModal").style.display = "none";
}

function setupRecaptcha() {

  if (!$("recaptcha")) return;
  if (recaptchaVerifier) return;

  recaptchaVerifier =
    new firebase.auth.RecaptchaVerifier(
      "recaptcha",
      {
        size: "invisible"
      }
    );

  recaptchaVerifier.render();
}

async function sendOTP() {

  try {

    setupRecaptcha();

    const phone = $("phone").value.trim();

    if (!phone) {
      alert("Mobile number daalo");
      return;
    }

    if (!phone.startsWith("+")) {
      alert("Country code ke saath number daalo");
      return;
    }

    confirmationResult =
      await auth.signInWithPhoneNumber(
        phone,
        recaptchaVerifier
      );

    alert("OTP Bhej diya ✅");

  } catch (error) {

    console.error(error);

    alert(
      "OTP error:\n" +
      error.message
    );

    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_) {}

      recaptchaVerifier = null;
    }
  }
}

async function verifyOTP() {

  try {

    const otp = $("otp").value.trim();

    if (!confirmationResult) {
      alert("Pehle OTP bhejo");
      return;
    }

    if (!otp) {
      alert("OTP daalo");
      return;
    }

    const result =
      await confirmationResult.confirm(otp);

    alert(
      "Login Ho Gaya ✅\n" +
      (result.user.phoneNumber || "")
    );

    closeLogin();

  } catch (error) {

    console.error(error);
    alert("Galat OTP ❌");

  }
}

auth.onAuthStateChanged(user => {

  if (user) {

    console.log(
      "Customer logged in:",
      user.phoneNumber || user.uid
    );

  } else {

    console.log("Customer not logged in");

  }

});

// ======================================================
// PRODUCTS
// ======================================================

function productImage(p) {

  return (
    p.photo ||
    p.image ||
    "https://via.placeholder.com/500x400?text=Product"
  );
}

function renderLocalProducts(products) {

  const container = $("localProducts");

  if (!container) return;

  if (!products.length) {

    container.innerHTML =
      "<p>Product nahi mila.</p>";

    return;
  }

  container.innerHTML =
    products.map(item => {

      const p = item.data;
      const id = item.id;

      const name =
        p.name || "Product";

      const price =
        Number(p.price || 0);

      const stock =
        Number(
          p.stock === undefined
            ? 1
            : p.stock
        );

      return `
        <div class="card">

          <img
            src="${escapeHTML(productImage(p))}"
            alt="${escapeHTML(name)}"
          >

          <h3>${escapeHTML(name)}</h3>

          <div class="price">
            ₹${price}
          </div>

          <div class="stock">
            ${stock > 0
              ? "Stock Available"
              : "OUT OF STOCK"}
          </div>

          ${
            stock > 0
            ?
            `
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
            :
            `
            <button disabled>
              OUT OF STOCK
            </button>
            `
          }

        </div>
      `;

    }).join("");
}

function loadLocalProducts() {

  db.collection("products")
    .where("type", "==", "local")
    .onSnapshot(

      snapshot => {

        allLocalProducts =
          snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }));

        renderLocalProducts(
          allLocalProducts
        );

      },

      error => {

        console.error(
          "Products error:",
          error
        );

        $("localProducts").innerHTML =
          "<p>Products load nahi ho paaye.</p>";

      }

    );
}

function loadAffiliateProducts() {

  db.collection("products")
    .where("type", "==", "affiliate")
    .onSnapshot(

      snapshot => {

        const container =
          $("affiliateProducts");

        if (!container) return;

        if (snapshot.empty) {

          container.innerHTML =
            "<p>Amazon deals available nahi hain.</p>";

          return;
        }

        container.innerHTML =
          snapshot.docs.map(doc => {

            const p = doc.data();

            const name =
              p.name || "Amazon Product";

            const price =
              Number(p.price || 0);

            const link =
              p.link || "#";

            return `
              <div class="card">

                <img
                  src="${escapeHTML(productImage(p))}"
                  alt="${escapeHTML(name)}"
                >

                <h3>
                  ${escapeHTML(name)}
                </h3>

                <div class="price">
                  ₹${price}
                </div>

                <button
                  class="btn"
                  onclick="window.open(
                    ${JSON.stringify(link)},
                    '_blank',
                    'noopener'
                  )"
                >
                  BUY ON AMAZON
                </button>

              </div>
            `;

          }).join("");

      },

      error => {

        console.error(
          "Affiliate error:",
          error
        );

      }

    );
}

// ======================================================
// CATEGORY
// ======================================================

function filterCategory(category) {

  const filtered =
    allLocalProducts.filter(item => {

      const p = item.data;

      return String(
        p.category || ""
      ).toLowerCase() ===
      category.toLowerCase();

    });

  renderLocalProducts(filtered);

  window.scrollTo({
    top: $("localProducts").offsetTop - 70,
    behavior: "smooth"
  });
}

// ======================================================
// SEARCH
// ======================================================

function searchProducts() {

  const value =
    $("search").value
      .trim()
      .toLowerCase();

  if (!value) {

    renderLocalProducts(
      allLocalProducts
    );

    return;
  }

  const filtered =
    allLocalProducts.filter(item => {

      const p = item.data;

      return (
        String(p.name || "")
          .toLowerCase()
          .includes(value)
        ||
        String(p.category || "")
          .toLowerCase()
          .includes(value)
      );

    });

  renderLocalProducts(filtered);
}

// ======================================================
// CART
// ======================================================

function saveCart() {

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );

}

function addCart(id, name, price) {

  cart.push({
    id,
    name,
    price: Number(price)
  });

  saveCart();
  updateCartUI();

  alert(
    name +
    " Cart me add ho gaya ✅"
  );
}

function removeCart(index) {

  cart.splice(index, 1);

  saveCart();
  updateCartUI();
}

function toggleCart() {

  $("cartBox").scrollIntoView({
    behavior: "smooth"
  });

}

function updateCartUI() {

  const count = $("cartCount");
  const total = $("cartTotal");
  const items = $("cartItems");

  if (count) {

    count.innerText =
      cart.length;

  }

  if (total) {

    total.innerText =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0),
        0
      );

  }

  if (!items) return;

  if (!cart.length) {

    items.innerHTML =
      "<p>Cart khali hai.</p>";

    return;
  }

  items.innerHTML =
    cart.map((item, index) => {

      return `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          padding:10px 0;
          border-bottom:1px solid #ddd;
        ">

          <span>
            ${escapeHTML(item.name)}
            - ₹${Number(item.price)}
          </span>

          <button
            onclick="removeCart(${index})"
            style="
              background:red;
              color:white;
            "
          >
            X
          </button>

        </div>
      `;

    }).join("");
}

// ======================================================
// COD ORDER
// ======================================================

async function placeOrder() {

  if (!cart.length) {

    alert("Cart khali hai ❌");
    return;

  }

  const user =
    auth.currentUser;

  if (!user) {

    alert(
      "Order place karne ke liye pehle login karo."
    );

    openLogin();
    return;

  }

  const phone =
    prompt(
      "Delivery mobile number daalo",
      user.phoneNumber || ""
    );

  if (!phone) {

    alert("Mobile number required hai");
    return;

  }

  const address =
    prompt(
      "Complete delivery address daalo"
    );

  if (!address) {

    alert("Address required hai");
    return;

  }

  const deliveryOTP =
    String(
      Math.floor(
        1000 +
        Math.random() * 9000
      )
    );

  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price || 0),
      0
    );

  try {

    const orderData = {

      customerId: user.uid,

      customerPhone:
        user.phoneNumber || "",

      phone,

      address,

      items: cart,

      total,

      paymentMethod: "COD",

      status: "NEW",

      deliveryOTP,

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };

    const ref =
      await db
        .collection("orders")
        .add(orderData);

    cart = [];

    saveCart();
    updateCartUI();

    alert(
      "ORDER SUCCESSFULLY PLACE HO GAYA ✅\n\n" +
      "Payment: CASH ON DELIVERY\n\n" +
      "Order ID: " +
      ref.id +
      "\n\n" +
      "Delivery OTP: " +
      deliveryOTP
    );

  } catch (error) {

    console.error(error);

    alert(
      "Order place nahi hua ❌\n" +
      error.message
    );

  }
}

// ======================================================
// BANNER
// ======================================================

function loadMainBanner() {

  const banner =
    $("mainBanner");

  if (!banner) return;

  db.collection("banner")
    .doc("main")
    .onSnapshot(

      doc => {

        if (!doc.exists) return;

        const data =
          doc.data();

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

// ======================================================
// TIMER
// ======================================================

setInterval(() => {

  if (timerSeconds <= 0) {

    timerSeconds = 10799;

  }

  timerSeconds--;

  const h =
    Math.floor(
      timerSeconds / 3600
    );

  const m =
    Math.floor(
      (timerSeconds % 3600) / 60
    );

  const s =
    timerSeconds % 60;

  if ($("timer")) {

    $("timer").innerText =
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0");

  }

}, 1000);

// ======================================================
// START
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateCartUI();
    setupRecaptcha();
    loadLocalProducts();
    loadAffiliateProducts();
    loadMainBanner();

  }
);

// ======================================================
// SERVICE WORKER
// ======================================================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(console.error);

}