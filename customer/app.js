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
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  firebaseConfig
} from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);

let cart =
  JSON.parse(
    localStorage.getItem("aio_cart") || "[]"
  );

let confirmationResult = null;
let recaptchaVerifier = null;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function money(value) {
  return "₹" +
    Number(value || 0)
      .toLocaleString("en-IN");
}

function toast(message) {

  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2200);
}

function saveCart() {

  localStorage.setItem(
    "aio_cart",
    JSON.stringify(cart)
  );

  updateCartUI();
}

function updateCartUI() {

  if ($("cartCount")) {
    $("cartCount").textContent =
      cart.length;
  }

  if ($("cartTotal")) {

    $("cartTotal").textContent =
      cart.reduce(
        (s,x) =>
          s + Number(x.price || 0),
        0
      ).toLocaleString("en-IN");

  }

  if ($("cartItems")) {

    $("cartItems").innerHTML =
      cart.length

      ? cart.map((item,index) => `
          <div class="cart-row">

            <span>
              ${esc(item.name)}

              <small>
                ${money(item.price)}
              </small>
            </span>

            <button
              class="danger"
              data-remove="${index}">
              ×
            </button>

          </div>
        `).join("")

      : "<p>Cart khali hai.</p>";
  }
}

function addCart(id,name,price) {

  cart.push({
    id,
    name,
    price:Number(price || 0)
  });

  saveCart();

  toast(
    name +
    " cart me add ho gaya ✅"
  );

}

window.addCart = addCart;

function removeCart(index) {

  cart.splice(index,1);

  saveCart();
}

window.removeCart = removeCart;

function toggleCart(force) {

  const box = $("cartBox");

  if (!box) return;

  if (force === undefined) {

    box.classList.toggle("hidden");

  } else {

    box.classList.toggle(
      "hidden",
      !force
    );

  }

}

window.toggleCart = toggleCart;

async function setupRecaptcha() {

  if (!$("recaptcha")) return;

  if (recaptchaVerifier) return;

  recaptchaVerifier =
    new RecaptchaVerifier(
      auth,
      "recaptcha",
      {
        size:"invisible"
      }
    );

  await recaptchaVerifier.render();
}

async function sendOTP() {

  const phone =
    $("phone")?.value.trim();

  if (!phone) {
    return toast(
      "Mobile number daalo."
    );
  }

  if (!phone.startsWith("+")) {
    return toast(
      "Country code ke saath number daalo."
    );
  }

  try {

    await setupRecaptcha();

    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );

    toast("OTP bhej diya ✅");

  } catch(error) {

    console.error(error);

    toast(
      error.message
    );

  }
}

window.sendOTP = sendOTP;

async function verifyOTP() {

  if (!confirmationResult) {
    return toast(
      "Pehle OTP bhejo."
    );
  }

  const otp =
    $("otp")?.value.trim();

  if (!otp) {
    return toast(
      "OTP daalo."
    );
  }

  try {

    await confirmationResult.confirm(
      otp
    );

    $("loginBox")
      ?.classList.add("hidden");

    toast(
      "Login ho gaya ✅"
    );

  } catch(error) {

    toast(
      "Galat OTP ❌"
    );

  }
}

window.verifyOTP = verifyOTP;

function renderProducts(
  docs,
  containerId,
  affiliate = false
) {

  const container =
    $(containerId);

  if (!container) return;

  if (!docs.length) {

    container.innerHTML =
      "<p>Products available nahi hain.</p>";

    return;
  }

  container.innerHTML =
    docs.map(d => {

      const p = d.data();

      const name =
        p.name || "Product";

      const price =
        Number(p.price || 0);

      const image =
        p.photo ||
        p.image ||
        "https://via.placeholder.com/600x400?text=Product";

      if (affiliate) {

        return `
          <article class="card">

            <img
              src="${esc(image)}"
              alt="${esc(name)}">

            <div class="card-body">

              <h3>
                ${esc(name)}
              </h3>

              <b>
                ${money(price)}
              </b>

              <button
                class="primary"
                data-buy="${esc(p.link || "#")}">
                BUY ON AMAZON
              </button>

            </div>

          </article>
        `;

      }

      const stock =
        Number(p.stock ?? 1);

      return `
        <article class="card">

          <img
            src="${esc(image)}"
            alt="${esc(name)}">

          <div class="card-body">

            <h3>
              ${esc(name)}
            </h3>

            <b>
              ${money(price)}
            </b>

            ${
              stock <= 0

              ? `
                <button
                  disabled
                  style="width:100%;margin-top:12px">
                  OUT OF STOCK
                </button>
              `

              : `
                <button
                  class="primary"
                  data-add="${esc(d.id)}"
                  data-name="${esc(name)}"
                  data-price="${price}">
                  ADD TO CART
                </button>
              `
            }

          </div>

        </article>
      `;

    }).join("");
}

function loadLocalProducts() {

  onSnapshot(
    query(
      collection(db,"products"),
      where("type","==","local")
    ),
    snapshot => {

      renderProducts(
        snapshot.docs,
        "localProducts"
      );

    },
    console.error
  );
}

function loadAffiliateProducts() {

  onSnapshot(
    query(
      collection(db,"products"),
      where("type","==","affiliate")
    ),
    snapshot => {

      renderProducts(
        snapshot.docs,
        "affiliateProducts",
        true
      );

    },
    console.error
  );
}

function loadMainBanner() {

  if (!$("mainBanner")) return;

  onSnapshot(
    doc(db,"banner","main"),
    snapshot => {

      if (
        snapshot.exists() &&
        snapshot.data().url
      ) {

        $("mainBanner")
          .style
          .backgroundImage =
          `url("${snapshot.data().url}")`;

      }

    },
    console.error
  );
}

let searchTimer = null;

function searchProducts() {

  clearTimeout(searchTimer);

  searchTimer =
    setTimeout(async () => {

      const value =
        $("search")
          ?.value
          .trim()
          .toLowerCase();

      if (!value) {

        loadLocalProducts();

        return;
      }

      const snapshot =
        await getDocs(
          query(
            collection(db,"products"),
            where(
              "type",
              "==",
              "local"
            )
          )
        );

      const filtered =
        snapshot.docs.filter(d => {

          return String(
            d.data().name || ""
          )
          .toLowerCase()
          .includes(value);

        });

      renderProducts(
        filtered,
        "localProducts"
      );

    },300);

}

window.searchProducts =
  searchProducts;

async function placeOrder() {

  if (!cart.length) {
    return toast(
      "Cart khali hai ❌"
    );
  }

  const user =
    auth.currentUser;

  if (!user) {

    $("loginBox")
      ?.classList.remove(
        "hidden"
      );

    return toast(
      "Pehle OTP login karo."
    );
  }

  const address =
    $("address")
      ?.value
      .trim();

  if (!address) {
    return toast(
      "Address daalo."
    );
  }

  const total =
    cart.reduce(
      (s,x) =>
        s + Number(x.price || 0),
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

    const ref =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        {
          userId:user.uid,
          phone:user.phoneNumber || "",
          address,
          items:cart,
          total,
          paymentMethod:"COD",
          status:"NEW",
          deliveryOTP,
          createdAt:
            serverTimestamp()
        }
      );

    cart = [];

    saveCart();

    toggleCart(false);

    alert(
      "Order Successfully Place Ho Gaya ✅\n\n" +
      "Payment: CASH ON DELIVERY\n" +
      "Order ID: " +
      ref.id +
      "\n\n" +
      "Delivery OTP: " +
      deliveryOTP
    );

  } catch(error) {

    console.error(error);

    toast(
      "Order failed: " +
      error.message
    );

  }
}

window.placeOrder = placeOrder;
window.placeCODOrder = placeOrder;

onAuthStateChanged(
  auth,
  user => {

    const status =
      $("loginStatus");

    if (status) {

      status.textContent =
        user
          ? "Logged in"
          : "Guest";

    }

  }
);

document.addEventListener(
  "click",
  event => {

    const add =
      event.target.closest(
        "[data-add]"
      );

    if (add) {

      addCart(
        add.dataset.add,
        add.dataset.name,
        add.dataset.price
      );

      return;
    }

    const remove =
      event.target.closest(
        "[data-remove]"
      );

    if (remove) {

      removeCart(
        Number(
          remove.dataset.remove
        )
      );

      return;
    }

    const buy =
      event.target.closest(
        "[data-buy]"
      );

    if (
      buy &&
      buy.dataset.buy !== "#"
    ) {

      window.open(
        buy.dataset.buy,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      event.target.closest(
        "[data-cart]"
      )
    ) {

      toggleCart();

      return;
    }

    if (
      event.target.closest(
        "[data-login]"
      )
    ) {

      $("loginBox")
        ?.classList.remove(
          "hidden"
        );

      return;
    }

    if (
      event.target.closest(
        "[data-close-login]"
      )
    ) {

      $("loginBox")
        ?.classList.add(
          "hidden"
        );

    }

  }
);

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateCartUI();

    loadLocalProducts();

    loadAffiliateProducts();

    loadMainBanner();

    setupRecaptcha()
      .catch(console.error);

    let time = 10800;

    setInterval(() => {

      time--;

      if (time <= 0) {
        time = 10800;
      }

      if ($("timer")) {

        const h =
          Math.floor(time / 3600);

        const m =
          Math.floor(
            (time % 3600) / 60
          );

        const s =
          time % 60;

        $("timer").textContent =
          `${String(h).padStart(2,"0")}:` +
          `${String(m).padStart(2,"0")}:` +
          `${String(s).padStart(2,"0")}`;

      }

    },1000);

  }
);

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(console.error);

}