// =====================================================
// AIO DIGITAL MALL - MAIN ROOT APP.JS
// Firebase + Login + Products + Cart + COD Orders
// =====================================================

// ================= FIREBASE CONFIG ====================

const firebaseConfig = {
  apiKey: "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",
  authDomain: "aio-digital-mall.firebaseapp.com",
  projectId: "aio-digital-mall",
  storageBucket: "aio-digital-mall.firebasestorage.app",
  messagingSenderId: "501384049673",
  appId: "1:501384049673:web:968bd8311cc700f82874d8",
  measurementId: "G-TNDT9FYNRP"
};

// Firebase initialize
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();


// =====================================================
// HELPER
// =====================================================

const $ = id => document.getElementById(id);


// =====================================================
// PHONE OTP LOGIN
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


// Send OTP
function sendOTP() {

  setupRecaptcha();

  const phoneNumber = $("phone")?.value.trim();

  if (!phoneNumber) {
    alert("Mobile number daalo");
    return;
  }

  if (!phoneNumber.startsWith("+")) {
    alert("Number country code ke saath daalo.\nExample: +919876543210");
    return;
  }

  auth.signInWithPhoneNumber(
    phoneNumber,
    recaptchaVerifier
  )
  .then(result => {

    confirmationResult = result;

    alert("OTP Bhej diya ✅");

  })
  .catch(error => {

    console.error(error);

    alert("OTP error: " + error.message);

  });
}


// Verify OTP
function verifyOTP() {

  const otp = $("otp")?.value.trim();

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

      console.log("Logged in:", result.user);

      alert("Login Ho Gaya ✅");

      if ($("loginBox")) {
        $("loginBox").style.display = "none";
      }

    })
    .catch(error => {

      console.error(error);

      alert("Galat OTP ❌");

    });
}


// Auth state
auth.onAuthStateChanged(user => {

  if (user) {

    console.log(
      "Customer Login:",
      user.phoneNumber || user.uid
    );

  } else {

    console.log("Customer Not Logged In");

  }

});


// =====================================================
// PRODUCT RENDER
// =====================================================

function renderLocalProducts(snapshot) {

  const container = $("localProducts");

  if (!container) return;

  if (snapshot.empty) {

    container.innerHTML =
      "<p style='padding:10px'>Abhi local products available nahi hain.</p>";

    return;
  }

  container.innerHTML = snapshot.docs.map(doc => {

    const p = doc.data();

    const photo =
      p.photo ||
      p.image ||
      "https://via.placeholder.com/300x200?text=Product";

    const name =
      p.name || "Product";

    const price =
      Number(p.price || 0);

    return `
      <div class="card">

        <img
          src="${photo}"
          alt="${escapeHTML(name)}"
        >

        <h4>${escapeHTML(name)}</h4>

        <p>₹${price}</p>

        ${
          p.stock === 0
          ? `<button class="btn" disabled>OUT OF STOCK</button>`
          : `<button
              class="btn"
              onclick="addCart('${doc.id}', '${escapeJS(name)}', ${price})"
            >
              ADD TO CART
            </button>`
        }

      </div>
    `;

  }).join("");
}


// =====================================================
// AFFILIATE PRODUCTS
// =====================================================

function renderAffiliateProducts(snapshot) {

  const container = $("affiliateProducts");

  if (!container) return;

  if (snapshot.empty) {

    container.innerHTML =
      "<p style='padding:10px'>Amazon deals abhi available nahi hain.</p>";

    return;
  }

  container.innerHTML = snapshot.docs.map(doc => {

    const p = doc.data();

    const photo =
      p.photo ||
      p.image ||
      "https://via.placeholder.com/300x200?text=Amazon";

    const name =
      p.name || "Amazon Product";

    const price =
      Number(p.price || 0);

    const link =
      p.link || "#";

    return `
      <div class="card affiliate">

        <img
          src="${photo}"
          alt="${escapeHTML(name)}"
        >

        <h4>${escapeHTML(name)}</h4>

        <p>₹${price}</p>

        <button
          class="btn"
          onclick="window.open('${escapeJS(link)}','_blank')"
        >
          BUY ON AMAZON
        </button>

      </div>
    `;

  }).join("");
}


// =====================================================
// LOAD LOCAL PRODUCTS
// =====================================================

function loadLocalProducts() {

  db.collection("products")
    .where("type", "==", "local")
    .onSnapshot(

      snapshot => {

        renderLocalProducts(snapshot);

      },

      error => {

        console.error("Local product error:", error);

      }

    );
}


// =====================================================
// LOAD AFFILIATE PRODUCTS
// =====================================================

function loadAffiliateProducts() {

  db.collection("products")
    .where("type", "==", "affiliate")
    .onSnapshot(

      snapshot => {

        renderAffiliateProducts(snapshot);

      },

      error => {

        console.error("Affiliate product error:", error);

      }

    );
}


// =====================================================
// BANNER
// =====================================================

function loadMainBanner() {

  if (!$("mainBanner")) return;

  db.collection("banner")
    .doc("main")
    .onSnapshot(

      doc => {

        if (doc.exists) {

          const data = doc.data();

          if (data.url) {

            $("mainBanner").style.backgroundImage =
              `url("${data.url}")`;

          }

        }

      },

      error => {

        console.error("Banner error:", error);

      }

    );
}


// =====================================================
// CART
// =====================================================

let cart =
  JSON.parse(
    localStorage.getItem("aio_cart")
  ) || [];


// Update cart UI
function updateCartUI() {

  const count = $("cartCount");
  const total = $("cartTotal");
  const items = $("cartItems");

  if (count) {

    count.innerText = cart.length;

  }

  if (total) {

    total.innerText =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0),
        0
      );

  }

  if (items) {

    if (cart.length === 0) {

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
            padding:8px;
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
                border:none;
                padding:5px 8px;
                border-radius:5px;
              "
            >
              X
            </button>

          </div>
        `;

      }).join("");

  }

}


// Add product
function addCart(id, name, price) {

  cart.push({

    id: id,

    name: name,

    price: Number(price)

  });

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );

  updateCartUI();

  alert(
    name + " Cart me add ho gaya ✅"
  );

}


// Remove product
function removeCart(index) {

  cart.splice(index, 1);

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );

  updateCartUI();

}


// =====================================================
// COD ORDER
// =====================================================

async function placeOrder() {

  if (cart.length === 0) {

    alert("Cart khali hai ❌");

    return;

  }

  const phone =
    prompt(
      "Mobile number daalo"
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


  // COD only
  const paymentMethod = "COD";

  const deliveryOTP =
    Math.floor(
      1000 +
      Math.random() * 9000
    ).toString();


  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price || 0),
      0
    );


  try {

    const orderData = {

      items: cart,

      phone: phone,

      address: address,

      total: total,

      paymentMethod: paymentMethod,

      status: "NEW",

      deliveryOTP: deliveryOTP,

      createdAt:
        firebase.firestore.FieldValue.serverTimestamp()

    };


    const orderRef =
      await db
        .collection("orders")
        .add(orderData);


    console.log(
      "Order ID:",
      orderRef.id
    );


    // Clear cart
    cart = [];

    localStorage.removeItem(
      "aio_cart"
    );

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


    if ($("cartBox")) {

      $("cartBox").style.display =
        "none";

    }

  }
  catch (error) {

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
// SEARCH
// =====================================================

let searchTimer = null;

function searchProducts() {

  clearTimeout(searchTimer);

  searchTimer =
    setTimeout(() => {

      const input =
        $("search");

      if (!input) return;

      const value =
        input.value
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

          const container =
            $("localProducts");

          if (!container) return;

          const filtered =
            snapshot.docs.filter(doc => {

              const data =
                doc.data();

              const name =
                String(
                  data.name || ""
                ).toLowerCase();

              return name.includes(value);

            });


          if (filtered.length === 0) {

            container.innerHTML =
              "<p style='padding:10px'>Product nahi mila.</p>";

            return;

          }


          container.innerHTML =
            filtered.map(doc => {

              const p =
                doc.data();

              const photo =
                p.photo ||
                p.image ||
                "https://via.placeholder.com/300x200?text=Product";

              const name =
                p.name || "Product";

              const price =
                Number(p.price || 0);


              return `
                <div class="card">

                  <img
                    src="${photo}"
                    alt="${escapeHTML(name)}"
                  >

                  <h4>${escapeHTML(name)}</h4>

                  <p>₹${price}</p>

                  <button
                    class="btn"
                    onclick="addCart(
                      '${doc.id}',
                      '${escapeJS(name)}',
                      ${price}
                    )"
                  >
                    ADD TO CART
                  </button>

                </div>
              `;

            }).join("");

        })
        .catch(error => {

          console.error(
            "Search error:",
            error
          );

        });

    }, 300);

}


// =====================================================
// FLASH SALE TIMER
// =====================================================

let time = 10799;

setInterval(() => {

  if (!$("timer")) return;

  if (time <= 0) {

    time = 10799;

  }

  time--;

  const h =
    Math.floor(
      time / 3600
    );

  const m =
    Math.floor(
      (time % 3600) / 60
    );

  const s =
    time % 60;


  $("timer").innerText =
    `${String(h).padStart(2, "0")}:` +
    `${String(m).padStart(2, "0")}:` +
    `${String(s).padStart(2, "0")}`;

}, 1000);


// =====================================================
// HTML SAFETY HELPERS
// =====================================================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeJS(value) {

  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");

}


// =====================================================
// SERVICE WORKER
// =====================================================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .then(() => {

      console.log(
        "Service Worker registered ✅"
      );

    })
    .catch(error => {

      console.error(
        "Service Worker error:",
        error
      );

    });

}


// =====================================================
// START APP
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