// =====================================================
// AIO DIGITAL MALL - TEAM APP
// =====================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",

  authDomain:
    "aio-digital-mall.firebaseapp.com",

  projectId:
    "aio-digital-mall",

  storageBucket:
    "aio-digital-mall.firebasestorage.app",

  messagingSenderId:
    "501384049673",

  appId:
    "1:501384049673:web:968bd8311cc700f82874d8",

  measurementId:
    "G-TNDT9FYNRP"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const $ = id =>
  document.getElementById(id);

let unsubscribeOrders = null;
let unsubscribeProducts = null;
let unsubscribeShops = null;

// =====================================================
// TEAM LOGIN
// =====================================================

function teamLogin() {

  const email =
    $("teamEmail").value.trim();

  const password =
    $("teamPassword").value;

  if (!email || !password) {

    $("loginError").innerText =
      "Email aur password required.";

    return;
  }

  auth.signInWithEmailAndPassword(
    email,
    password
  )
  .then(async result => {

    const uid = result.user.uid;

    const teamDoc =
      await db
        .collection("teamUsers")
        .doc(uid)
        .get();

    if (
      !teamDoc.exists ||
      teamDoc.data().active !== true
    ) {

      await auth.signOut();

      throw new Error(
        "Team access allowed nahi hai."
      );
    }

    showApp();

  })
  .catch(error => {

    console.error(error);

    $("loginError").innerText =
      error.message;
  });
}

function teamLogout() {

  auth.signOut()
    .then(() => {
      location.reload();
    });
}

function showApp() {

  $("loginScreen")
    .classList.add("hidden");

  $("app")
    .classList.remove("hidden");

  loadAll();
}

// =====================================================
// AUTH STATE
// =====================================================

auth.onAuthStateChanged(async user => {

  if (!user) return;

  try {

    const doc =
      await db
        .collection("teamUsers")
        .doc(user.uid)
        .get();

    if (
      doc.exists &&
      doc.data().active === true
    ) {
      showApp();
    }

  } catch(error) {

    console.error(error);
  }
});

// =====================================================
// ADD SHOP
// =====================================================

async function addShop() {

  const name =
    $("shopName").value.trim();

  const category =
    $("shopCategory").value;

  const phone =
    $("shopPhone").value.trim();

  const address =
    $("shopAddress").value.trim();

  if (!name) {

    alert("Shop name required.");
    return;
  }

  try {

    await db
      .collection("shops")
      .add({

        name,
        category,
        phone,
        address,

        active: true,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    $("shopName").value = "";
    $("shopPhone").value = "";
    $("shopAddress").value = "";

    alert("Shop added ✅");

    loadShops();

  } catch(error) {

    alert(
      "Shop error: " +
      error.message
    );
  }
}

// =====================================================
// ADD LOCAL PRODUCT
// =====================================================

async function addLocalProduct() {

  const name =
    $("pName").value.trim();

  const price =
    Number($("pPrice").value);

  const photo =
    $("pPhoto").value.trim();

  const category =
    $("pCategory").value;

  const stock =
    Number($("pStock").value);

  const shopId =
    $("pShop").value;

  if (!name) {

    alert("Product name required.");
    return;
  }

  if (!price || price < 0) {

    alert("Valid price daalo.");
    return;
  }

  try {

    await db
      .collection("products")
      .add({

        name,
        price,
        photo,
        category,
        stock,

        shopId,

        type: "local",

        active: true,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    $("pName").value = "";
    $("pPrice").value = "";
    $("pPhoto").value = "";
    $("pStock").value = "1";

    alert("Product saved ✅");

  } catch(error) {

    alert(
      "Product error: " +
      error.message
    );
  }
}

// =====================================================
// ADD AFFILIATE
// =====================================================

async function addAffiliateProduct() {

  const name =
    $("aName").value.trim();

  const price =
    Number($("aPrice").value);

  const photo =
    $("aPhoto").value.trim();

  const link =
    $("aLink").value.trim();

  if (!name || !link) {

    alert(
      "Name aur Amazon link required."
    );

    return;
  }

  try {

    await db
      .collection("products")
      .add({

        name,
        price,
        photo,
        link,

        type: "affiliate",

        active: true,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    $("aName").value = "";
    $("aPrice").value = "";
    $("aPhoto").value = "";
    $("aLink").value = "";

    alert("Affiliate product saved ✅");

  } catch(error) {

    alert(
      "Affiliate error: " +
      error.message
    );
  }
}

// =====================================================
// BANNER
// =====================================================

async function saveBanner() {

  const url =
    $("bannerURL").value.trim();

  if (!url) {

    alert("Banner URL required.");
    return;
  }

  try {

    await db
      .collection("banner")
      .doc("main")
      .set({

        url,

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    alert("Banner updated ✅");

  } catch(error) {

    alert(
      "Banner error: " +
      error.message
    );
  }
}

// =====================================================
// ORDERS
// =====================================================

function loadOrders() {

  if (unsubscribeOrders) {
    unsubscribeOrders();
  }

  unsubscribeOrders =
    db.collection("orders")
      .orderBy(
        "createdAt",
        "desc"
      )
      .onSnapshot(
        snapshot => {

          const container =
            $("orders");

          container.innerHTML = "";

          let newOrders = 0;

          snapshot.forEach(doc => {

            const o =
              doc.data();

            if (o.status === "NEW") {
              newOrders++;
            }

            const items =
              (o.items || [])
                .map(
                  item =>
                    `${item.name} - ₹${item.price}`
                )
                .join("<br>");

            const status =
              o.status || "NEW";

            container.innerHTML += `

              <div class="order">

                <b>Order ID:</b>
                ${doc.id}

                <br><br>

                <b>Phone:</b>
                ${o.customerPhone || o.phone || "-"}

                <br>

                <b>Address:</b>
                ${escapeHTML(
                  o.address || "-"
                )}

                <br><br>

                <b>Items:</b>
                <br>
                ${items}

                <br><br>

                <b>Total:</b>
                ₹${Number(o.total || 0)}

                <br>

                <b>Payment:</b>
                ${o.paymentMethod || "COD"}

                <br>

                <b>Delivery OTP:</b>
                ${o.deliveryOTP || "-"}

                <br><br>

                <b>Status:</b>
                ${status}

                <br><br>

                <button
                  class="green"
                  onclick="updateOrderStatus(
                    '${doc.id}',
                    'CONFIRMED'
                  )"
                >
                  CONFIRM
                </button>

                <button
                  class="orange"
                  onclick="updateOrderStatus(
                    '${doc.id}',
                    'OUT_FOR_DELIVERY'
                  )"
                >
                  OUT FOR DELIVERY
                </button>

                <button
                  class="white"
                  onclick="updateOrderStatus(
                    '${doc.id}',
                    'DELIVERED'
                  )"
                >
                  DELIVERED
                </button>

                <button
                  class="red"
                  onclick="updateOrderStatus(
                    '${doc.id}',
                    'CANCELLED'
                  )"
                >
                  CANCEL
                </button>

              </div>

            `;

          });

          $("statOrders").innerText =
            snapshot.size;

          $("statNewOrders").innerText =
            newOrders;

        },
        error => {

          console.error(
            "Orders:",
            error
          );

          $("orders").innerHTML =
            "<p>Orders load nahi hue.</p>";
        }
      );
}

async function updateOrderStatus(
  id,
  status
) {

  try {

    await db
      .collection("orders")
      .doc(id)
      .update({
        status,
        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()
      });

  } catch(error) {

    alert(
      "Status update failed: " +
      error.message
    );
  }
}

// =====================================================
// PRODUCTS
// =====================================================

function loadProducts() {

  if (unsubscribeProducts) {
    unsubscribeProducts();
  }

  unsubscribeProducts =
    db.collection("products")
      .onSnapshot(
        snapshot => {

          $("statProducts").innerText =
            snapshot.size;

          const container =
            $("products");

          container.innerHTML = "";

          snapshot.forEach(doc => {

            const p =
              doc.data();

            const image =
              p.photo ||
              p.image ||
              "https://via.placeholder.com/400x300?text=Product";

            container.innerHTML += `

              <div class="product">

                <img
                  src="${escapeHTML(image)}"
                >

                <div class="productContent">

                  <b>
                    ${escapeHTML(
                      p.name || "Product"
                    )}
                  </b>

                  <p>
                    ₹${Number(p.price || 0)}
                  </p>

                  <small>
                    Type:
                    ${p.type || "local"}
                    <br>
                    Stock:
                    ${p.stock ?? "-"}
                  </small>

                  <br>

                  <button
                    class="red"
                    onclick="deleteProduct(
                      '${doc.id}'
                    )"
                  >
                    DELETE
                  </button>

                </div>

              </div>

            `;

          });

        }
      );
}

async function deleteProduct(id) {

  if (
    !confirm(
      "Product delete karna hai?"
    )
  ) {
    return;
  }

  try {

    await db
      .collection("products")
      .doc(id)
      .delete();

  } catch(error) {

    alert(
      "Delete failed: " +
      error.message
    );
  }
}

// =====================================================
// SHOPS
// =====================================================

function loadShops() {

  if (unsubscribeShops) {
    unsubscribeShops();
  }

  unsubscribeShops =
    db.collection("shops")
      .orderBy(
        "createdAt",
        "desc"
      )
      .onSnapshot(
        snapshot => {

          $("statShops").innerText =
            snapshot.size;

          const container =
            $("shops");

          const select =
            $("pShop");

          container.innerHTML = "";

          select.innerHTML =
            `<option value="">
              Select Shop
            </option>`;

          snapshot.forEach(doc => {

            const s =
              doc.data();

            select.innerHTML += `
              <option value="${doc.id}">
                ${escapeHTML(
                  s.name || "Shop"
                )}
              </option>
            `;

            container.innerHTML += `

              <div class="card">

                <b>
                  ${escapeHTML(
                    s.name || "Shop"
                  )}
                </b>

                <p>
                  ${escapeHTML(
                    s.category || ""
                  )}
                </p>

                <small>
                  ${escapeHTML(
                    s.phone || ""
                  )}
                  <br>
                  ${escapeHTML(
                    s.address || ""
                  )}
                </small>

                <br>

                <button
                  class="red"
                  onclick="deleteShop(
                    '${doc.id}'
                  )"
                >
                  DELETE
                </button>

              </div>

            `;

          });

        }
      );
}

async function deleteShop(id) {

  if (
    !confirm(
      "Shop delete karna hai?"
    )
  ) {
    return;
  }

  try {

    await db
      .collection("shops")
      .doc(id)
      .delete();

  } catch(error) {

    alert(
      "Delete failed: " +
      error.message
    );
  }
}

// =====================================================
// UTILITIES
// =====================================================

function escapeHTML(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}

function openCustomer() {

  window.open(
    "../customer/index.html",
    "_blank"
  );
}

function refreshData() {

  loadOrders();
  loadProducts();
  loadShops();

  alert("Data refreshed ✅");
}

function loadAll() {

  loadOrders();
  loadProducts();
  loadShops();
}

// =====================================================
// SERVICE WORKER
// =====================================================

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(console.error);

    }
  );
}