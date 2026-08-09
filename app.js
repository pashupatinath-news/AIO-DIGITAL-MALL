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

let productUnsubscribe = null;

let affiliateUnsubscribe = null;

let bannerUnsubscribe = null;


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function money(value) {

  return "₹" +
    Number(value || 0)
      .toLocaleString("en-IN");

}


function toast(message) {

  const element = $("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;

  element.classList.add("show");

  setTimeout(() => {

    element.classList.remove("show");

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

    const total =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0),
        0
      );

    $("cartTotal").textContent =
      total.toLocaleString("en-IN");

  }

  if ($("cartItems")) {

    if (!cart.length) {

      $("cartItems").innerHTML =
        "<p>Cart khali hai.</p>";

      return;

    }

    $("cartItems").innerHTML =
      cart.map((item, index) => {

        return `
          <div class="cart-row">

            <span>
              ${escapeHTML(item.name)}

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
        `;

      }).join("");

  }

}


function addCart(id, name, price) {

  cart.push({

    id: id,

    name: name,

    price: Number(price || 0)

  });

  saveCart();

  toast(
    name +
    " cart me add ho gaya ✅"
  );

  toggleCart(true);

}

window.addCart = addCart;


function removeCart(index) {

  cart.splice(index, 1);

  saveCart();

}

window.removeCart = removeCart;


function toggleCart(force) {

  const box = $("cartBox");

  if (!box) return;

  if (force === undefined) {

    box.classList.toggle("hidden");

    return;

  }

  box.classList.toggle(
    "hidden",
    !force
  );

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
        size: "invisible"
      }
    );

  await recaptchaVerifier.render();

}


async function sendOTP() {

  const phone =
    $("phone")?.value.trim();

  if (!phone) {

    toast(
      "Mobile number daalo."
    );

    return;

  }

  if (!phone.startsWith("+")) {

    toast(
      "Country code ke saath number daalo.\nExample: +919876543210"
    );

    return;

  }

  try {

    await setupRecaptcha();

    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );

    toast(
      "OTP bhej diya ✅"
    );

  } catch (error) {

    console.error(error);

    toast(
      "OTP error: " +
      error.message
    );

  }

}

window.sendOTP = sendOTP;


async function verifyOTP() {

  const otp =
    $("otp")?.value.trim();

  if (!confirmationResult) {

    toast(
      "Pehle OTP bhejo."
    );

    return;

  }

  if (!otp) {

    toast(
      "OTP daalo."
    );

    return;

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

  } catch (error) {

    console.error(error);

    toast(
      "Galat OTP ❌"
    );

  }

}

window.verifyOTP = verifyOTP;


function renderProducts(
  documents,
  containerId,
  affiliate = false
) {

  const container =
    $(containerId);

  if (!container) return;

  if (!documents.length) {

    container.innerHTML =
      "<p>Abhi products available nahi hain.</p>";

    return;

  }

  container.innerHTML =
    documents.map(document => {

      const data =
        document.data();

      const name =
        data.name ||
        "Product";

      const price =
        Number(data.price || 0);

      const image =
        data.photo ||
        data.image ||
        "https://via.placeholder.com/600x400?text=Product";

      if (affiliate) {

        const link =
          data.link || "#";

        return `
          <article class="card">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(name)}">

            <div class="card-body">

              <h3>
                ${escapeHTML(name)}
              </h3>

              <b>
                ${money(price)}
              </b>

              <button
                class="primary"
                data-buy="${escapeHTML(link)}">
                BUY ON AMAZON
              </button>

            </div>

          </article>
        `;

      }

      const stock =
        Number(
          data.stock ?? 1
        );

      return `
        <article class="card">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(name)}">

          <div class="card-body">

            <h3>
              ${escapeHTML(name)}
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
                  data-add="${escapeHTML(document.id)}"
                  data-name="${escapeHTML(name)}"
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

  if (productUnsubscribe) {

    productUnsubscribe();

  }

  const q =
    query(
      collection(db, "products"),
      where("type", "==", "local")
    );

  productUnsubscribe =
    onSnapshot(
      q,
      snapshot => {

        renderProducts(
          snapshot.docs,
          "localProducts"
        );

      },
      error => {

        console.error(
          "Local products:",
          error
        );

      }
    );

}


function loadAffiliateProducts() {

  if (affiliateUnsubscribe) {

    affiliateUnsubscribe();

  }

  const q =
    query(
      collection(db, "products"),
      where("type", "==", "affiliate")
    );

  affiliateUnsubscribe =
    onSnapshot(
      q,
      snapshot => {

        renderProducts(
          snapshot.docs,
          "affiliateProducts",
          true
        );

      },
      error => {

        console.error(
          "Affiliate products:",
          error
        );

      }
    );

}


function loadMainBanner() {

  if (!$("mainBanner")) return;

  bannerUnsubscribe =
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

          $("mainBanner")
            .style
            .backgroundImage =
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


let searchTimer = null;


function searchProducts() {

  clearTimeout(
    searchTimer
  );

  searchTimer =
    setTimeout(
      async () => {

        const value =
          $("search")
            ?.value
            .trim()
            .toLowerCase();

        if (!value) {

          loadLocalProducts();

          return;

        }

        try {

          const snapshot =
            await getDocs(
              query(
                collection(
                  db,
                  "products"
                ),
                where(
                  "type",
                  "==",
                  "local"
                )
              )
            );

          const filtered =
            snapshot.docs.filter(
              document => {

                const name =
                  String(
                    document.data().name ||
                    ""
                  ).toLowerCase();

                return name.includes(
                  value
                );

              }
            );

          renderProducts(
            filtered,
            "localProducts"
          );

        } catch (error) {

          console.error(
            error
          );

        }

      },
      300
    );

}

window.searchProducts =
  searchProducts;


async function placeOrder() {

  if (!cart.length) {

    toast(
      "Cart khali hai ❌"
    );

    return;

  }

  const user =
    auth.currentUser;

  if (!user) {

    $("loginBox")
      ?.classList.remove("hidden");

    toast(
      "Pehle OTP login karo."
    );

    return;

  }

  const address =
    $("address")
      ?.value
      .trim();

  if (!address) {

    toast(
      "Delivery address daalo."
    );

    return;

  }

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0),
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

    const orderData = {

      userId:
        user.uid,

      phone:
        user.phoneNumber || "",

      address:
        address,

      items:
        cart,

      total:
        total,

      paymentMethod:
        "COD",

      status:
        "NEW",

      deliveryOTP:
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
        orderData
      );

    cart = [];

    saveCart();

    $("address").value = "";

    toggleCart(false);

    alert(
      "Order Successfully Place Ho Gaya ✅\n\n" +
      "Payment: CASH ON DELIVERY\n\n" +
      "Order ID: " +
      orderRef.id +
      "\n\n" +
      "Delivery OTP: " +
      deliveryOTP
    );

  } catch (error) {

    console.error(
      "Order:",
      error
    );

    toast(
      "Order place nahi hua ❌\n" +
      error.message
    );

  }

}

window.placeOrder =
  placeOrder;

window.placeCODOrder =
  placeOrder;


onAuthStateChanged(
  auth,
  user => {

    if (user) {

      if ($("loginStatus")) {

        $("loginStatus")
          .textContent =
          "Logged in";

      }

      $("logoutBtn")
        ?.classList.remove(
          "hidden"
        );

    } else {

      if ($("loginStatus")) {

        $("loginStatus")
          .textContent =
          "Guest";

      }

      $("logoutBtn")
        ?.classList.add(
          "hidden"
        );

    }

  }
);


document.addEventListener(
  "click",
  event => {

    const addButton =
      event.target.closest(
        "[data-add]"
      );

    if (addButton) {

      addCart(
        addButton.dataset.add,
        addButton.dataset.name,
        addButton.dataset.price
      );

      return;

    }


    const removeButton =
      event.target.closest(
        "[data-remove]"
      );

    if (removeButton) {

      removeCart(
        Number(
          removeButton.dataset.remove
        )
      );

      return;

    }


    const buyButton =
      event.target.closest(
        "[data-buy]"
      );

    if (
      buyButton &&
      buyButton.dataset.buy !== "#"
    ) {

      window.open(
        buyButton.dataset.buy,
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


$("logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      await signOut(auth);

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

    setInterval(
      () => {

        time--;

        if (time <= 0) {

          time = 10800;

        }

        if ($("timer")) {

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

          $("timer")
            .textContent =
            String(h).padStart(2, "0") +
            ":" +
            String(m).padStart(2, "0") +
            ":" +
            String(s).padStart(2, "0");

        }

      },
      1000
    );

  }
);


if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(console.error);

}