// =====================================================
// AIO DIGITAL MALL - CUSTOMER APP
// Firebase + OTP + Products + Cart + COD
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",
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

// =====================================================
// OTP
// =====================================================

let confirmationResult = null;
let recaptchaVerifier = null;

function setupRecaptcha() {
  if (!$("recaptcha")) return;

  if (recaptchaVerifier) return;

  recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    "recaptcha",
    {
      size: "invisible"
    }
  );

  recaptchaVerifier.render();
}

function openLogin() {
  $("loginModal").style.display = "block";
  setTimeout(setupRecaptcha, 200);
}

function closeLogin() {
  $("loginModal").style.display = "none";
}

function sendOTP() {
  setupRecaptcha();

  const phone = $("phone").value.trim();

  if (!phone) {
    alert("Mobile number daalo");
    return;
  }

  if (!phone.startsWith("+")) {
    alert("Country code ke saath number daalo.\nExample: +919876543210");
    return;
  }

  auth.signInWithPhoneNumber(
    phone,
    recaptchaVerifier
  )
  .then(result => {
    confirmationResult = result;
    alert("OTP Bhej diya ✅");
  })
  .catch(error => {
    console.error(error);
    alert("OTP Error: " + error.message);

    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  });
}

function verifyOTP() {
  const otp = $("otp").value.trim();

  if (!confirmationResult) {
    alert("Pehle OTP bhejo");
    return;
  }

  if (!otp) {
    alert("OTP daalo");
    return;
  }

  confirmationResult.confirm(otp)
    .then(result => {
      alert("Login Ho Gaya ✅");
      closeLogin();

      console.log(
        "Customer:",
        result.user.phoneNumber || result.user.uid
      );
    })
    .catch(error => {
      console.error(error);
      alert("Galat OTP ❌");
    });
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log(
      "Customer Logged In:",
      user.phoneNumber || user.uid
    );
  }
});

// =====================================================
// ESCAPE
// =====================================================

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// CART
// =====================================================

let cart = [];

try {
  cart = JSON.parse(
    localStorage.getItem("aio_digital_mall_cart")
  ) || [];
} catch {
  cart = [];
}

function saveCart() {
  localStorage.setItem(
    "aio_digital_mall_cart",
    JSON.stringify(cart)
  );

  updateCartUI();
}

function addCart(id, name, price) {

  cart.push({
    id: id,
    name: name,
    price: Number(price || 0)
  });

  saveCart();

  alert(name + " Cart me add ho gaya ✅");
}

function removeCart(index) {
  cart.splice(index, 1);
  saveCart();
}

function updateCartUI() {

  const count = $("cartCount");
  const total = $("cartTotal");
  const items = $("cartItems");

  if (count) {
    count.innerText = cart.length;
  }

  const totalValue = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0),
    0
  );

  if (total) {
    total.innerText = totalValue;
  }

  if (!items) return;

  if (cart.length === 0) {
    items.innerHTML = "<p>Cart khali hai.</p>";
    return;
  }

  items.innerHTML = cart.map(
    (item, index) => `
      <div class="cartItem">
        <span>
          ${escapeHTML(item.name)}
          <br>
          ₹${Number(item.price)}
        </span>

        <button
          class="danger"
          onclick="removeCart(${index})"
        >
          X
        </button>
      </div>
    `
  ).join("");
}

function openCart() {
  updateCartUI();
  $("cartModal").style.display = "block";
}

function closeCart() {
  $("cartModal").style.display = "none";
}

// =====================================================
// PRODUCTS
// =====================================================

function productImage(p) {
  return p.photo ||
         p.image ||
         "https://via.placeholder.com/500x400?text=AIO+PRODUCT";
}

function renderLocalProducts(snapshot) {

  const container = $("localProducts");

  if (!container) return;

  if (snapshot.empty) {
    container.innerHTML =
      "<p>Abhi local products available nahi hain.</p>";
    return;
  }

  container.innerHTML = snapshot.docs.map(doc => {

    const p = doc.data();

    const name = p.name || "Product";
    const price = Number(p.price || 0);
    const photo = productImage(p);

    const out =
      Number(p.stock) === 0;

    return `
      <div class="card">

        <img
          src="${escapeHTML(photo)}"
          alt="${escapeHTML(name)}"
        >

        <h3>${escapeHTML(name)}</h3>

        <div class="price">
          ₹${price}
        </div>

        ${
          out
          ?
          `
          <button class="out" disabled>
            OUT OF STOCK
          </button>
          `
          :
          `
          <button
            onclick="addCart(
              '${doc.id}',
              ${JSON.stringify(name)},
              ${price}
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

function renderAffiliateProducts(snapshot) {

  const container = $("affiliateProducts");

  if (!container) return;

  if (snapshot.empty) {
    container.innerHTML =
      "<p>Amazon deals available nahi hain.</p>";
    return;
  }

  container.innerHTML = snapshot.docs.map(doc => {

    const p = doc.data();

    const name = p.name || "Amazon Product";
    const price = Number(p.price || 0);
    const photo = productImage(p);
    const link = p.link || "#";

    return `
      <div class="card">

        <img
          src="${escapeHTML(photo)}"
          alt="${escapeHTML(name)}"
        >

        <h3>${escapeHTML(name)}</h3>

        <div class="price">
          ₹${price}
        </div>

        <button
          onclick="window.open(
            ${JSON.stringify(link)},
            '_blank'
          )"
        >
          BUY ON AMAZON
        </button>

      </div>
    `;

  }).join("");
}

// =====================================================
// LOAD PRODUCTS
// =====================================================

let localUnsubscribe = null;

function loadLocalProducts() {

  if (localUnsubscribe) {
    localUnsubscribe();
  }

  localUnsubscribe =
    db.collection("products")
      .where("type", "==", "local")
      .onSnapshot(
        snapshot => {
          renderLocalProducts(snapshot);
        },
        error => {
          console.error(
            "Local Products:",
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
        renderAffiliateProducts(snapshot);
      },
      error => {
        console.error(
          "Affiliate Products:",
          error
        );
      }
    );
}

// =====================================================
// SEARCH
// =====================================================

let searchTimer = null;

function searchProducts() {

  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {

    const value =
      $("search").value
        .trim()
        .toLowerCase();

    if (!value) {
      loadLocalProducts();
      return;
    }

    db.collection("products")
      .where("type", "==", "local")
      .get()
      .then(snapshot => {

        const filtered =
          snapshot.docs.filter(doc => {

            const p = doc.data();

            const name =
              String(p.name || "")
                .toLowerCase();

            const category =
              String(p.category || "")
                .toLowerCase();

            return (
              name.includes(value) ||
              category.includes(value)
            );
          });

        if (!filtered.length) {
          $("localProducts").innerHTML =
            "<p>Product nahi mila.</p>";
          return;
        }

        renderLocalProducts({
          empty: false,
          docs: filtered
        });

      })
      .catch(error => {
        console.error(
          "Search:",
          error
        );
      });

  }, 250);
}

// =====================================================
// BANNER
// =====================================================

function loadMainBanner() {

  db.collection("banner")
    .doc("main")
    .onSnapshot(
      doc => {

        if (!doc.exists) return;

        const data = doc.data();

        if (data.url) {
          $("mainBanner").style.backgroundImage =
            `url("${data.url}")`;
        }

      },
      error => {
        console.error(
          "Banner:",
          error
        );
      }
    );
}

// =====================================================
// COD ORDER
// =====================================================

async function placeCODOrder() {

  if (!cart.length) {
    alert("Cart khali hai ❌");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    alert("Pehle mobile OTP se login karo.");
    openLogin();
    return;
  }

  const address = prompt(
    "Complete delivery address daalo"
  );

  if (!address || address.trim().length < 10) {
    alert("Complete address required hai.");
    return;
  }

  const phone =
    user.phoneNumber ||
    prompt("Mobile number daalo");

  if (!phone) {
    alert("Mobile number required hai.");
    return;
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0),
    0
  );

  const deliveryOTP =
    Math.floor(
      1000 + Math.random() * 9000
    ).toString();

  const orderData = {

    customerUid: user.uid,

    customerPhone: phone,

    items: cart,

    total: total,

    address: address.trim(),

    paymentMethod: "COD",

    status: "NEW",

    deliveryOTP: deliveryOTP,

    createdAt:
      firebase.firestore.FieldValue
        .serverTimestamp()
  };

  try {

    const orderRef =
      await db
        .collection("orders")
        .add(orderData);

    cart = [];

    localStorage.removeItem(
      "aio_digital_mall_cart"
    );

    updateCartUI();

    closeCart();

    alert(
      "ORDER SUCCESSFULLY PLACED ✅\n\n" +
      "Payment: CASH ON DELIVERY\n\n" +
      "Order ID:\n" +
      orderRef.id +
      "\n\n" +
      "Delivery OTP:\n" +
      deliveryOTP
    );

  } catch (error) {

    console.error(
      "Order:",
      error
    );

    alert(
      "Order place nahi hua ❌\n\n" +
      error.message
    );
  }
}

// Compatibility
window.placeOrder = placeCODOrder;

// =====================================================
// FLASH TIMER
// =====================================================

let time = 10799;

setInterval(() => {

  if (!$("timer")) return;

  time--;

  if (time <= 0) {
    time = 10799;
  }

  const h =
    Math.floor(time / 3600);

  const m =
    Math.floor(
      (time % 3600) / 60
    );

  const s =
    time % 60;

  $("timer").innerText =
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0");

}, 1000);

// =====================================================
// SERVICE WORKER
// =====================================================

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .then(() => {
          console.log(
            "Customer Service Worker OK"
          );
        })
        .catch(error => {
          console.error(
            "Service Worker:",
            error
          );
        });

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

    loadLocalProducts();

    loadAffiliateProducts();

    loadMainBanner();

  }
);