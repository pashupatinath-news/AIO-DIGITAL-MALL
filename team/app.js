// ======================================================
// AIO DIGITAL MALL - TEAM APP
// ======================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",

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

let teamConfirmation = null;
let teamRecaptcha = null;

// ======================================================
// TEAM OTP LOGIN
// ======================================================

function setupTeamRecaptcha() {

  if (!$("recaptcha")) return;
  if (teamRecaptcha) return;

  teamRecaptcha =
    new firebase.auth.RecaptchaVerifier(
      "recaptcha",
      {
        size:"invisible"
      }
    );

  teamRecaptcha.render();
}

async function sendTeamOTP() {

  try {

    setupTeamRecaptcha();

    const phone =
      $("phone").value.trim();

    if (!phone) {
      alert("Mobile number daalo");
      return;
    }

    teamConfirmation =
      await auth.signInWithPhoneNumber(
        phone,
        teamRecaptcha
      );

    alert("Team OTP bhej diya ✅");

  } catch(error) {

    console.error(error);

    alert(error.message);

  }
}

async function verifyTeamOTP() {

  try {

    const otp =
      $("otp").value.trim();

    if (!teamConfirmation) {

      alert("Pehle OTP bhejo");
      return;

    }

    const result =
      await teamConfirmation.confirm(otp);

    const uid =
      result.user.uid;

    const roleDoc =
      await db
        .collection("teamUsers")
        .doc(uid)
        .get();

    if (!roleDoc.exists) {

      await auth.signOut();

      alert(
        "Aap Team Member ke roop mein authorized nahi ho."
      );

      return;

    }

    const role =
      roleDoc.data().role;

    if (!role) {

      await auth.signOut();

      alert("Team role missing hai.");
      return;

    }

    location.href =
      "dashboard.html";

  } catch(error) {

    console.error(error);

    alert(
      "Team login failed:\n" +
      error.message
    );

  }
}

// ======================================================
// TEAM AUTH
// ======================================================

async function requireTeam() {

  return new Promise(resolve => {

    auth.onAuthStateChanged(
      async user => {

        if (!user) {

          if (
            !location.pathname.endsWith(
              "/index.html"
            )
          ) {
            location.href =
              "index.html";
          }

          resolve(false);
          return;

        }

        const doc =
          await db
            .collection("teamUsers")
            .doc(user.uid)
            .get();

        if (!doc.exists) {

          await auth.signOut();

          location.href =
            "index.html";

          resolve(false);
          return;

        }

        resolve(true);

      }
    );

  });

}

function logoutTeam() {

  auth.signOut()
    .then(() => {

      location.href =
        "index.html";

    });

}

// ======================================================
// DASHBOARD STATS
// ======================================================

async function loadDashboardStats() {

  try {

    const orders =
      await db
        .collection("orders")
        .get();

    const products =
      await db
        .collection("products")
        .get();

    const shops =
      await db
        .collection("shops")
        .get();

    if ($("ordersCount"))
      $("ordersCount").innerText =
        orders.size;

    if ($("newOrdersCount"))
      $("newOrdersCount").innerText =
        orders.docs.filter(
          d => d.data().status === "NEW"
        ).length;

    if ($("productsCount"))
      $("productsCount").innerText =
        products.size;

    if ($("shopsCount"))
      $("shopsCount").innerText =
        shops.size;

  } catch(error) {

    console.error(error);

  }

}

// ======================================================
// SAVE SHOP
// ======================================================

async function saveShop() {

  const name =
    $("shopName").value.trim();

  if (!name) {

    alert("Shop name required");
    return;

  }

  try {

    await db.collection("shops").add({

      name,

      category:
        $("shopCategory").value,

      phone:
        $("shopPhone").value.trim(),

      address:
        $("shopAddress").value.trim(),

      createdBy:
        auth.currentUser.uid,

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    });

    alert("Shop saved ✅");

    $("shopName").value = "";
    $("shopPhone").value = "";
    $("shopAddress").value = "";

    loadShops();

  } catch(error) {

    alert(
      "Shop save error:\n" +
      error.message
    );

  }

}

// ======================================================
// LOCAL PRODUCT
// ======================================================

async function saveLocalProduct() {

  const name =
    $("pName").value.trim();

  const price =
    Number($("pPrice").value);

  if (!name || price < 0) {

    alert(
      "Product name aur valid price daalo"
    );

    return;

  }

  try {

    await db.collection("products").add({

      name,

      price,

      photo:
        $("pPhoto").value.trim(),

      category:
        $("pCategory").value,

      stock:
        Number($("pStock").value || 0),

      shopId:
        $("pShopId").value.trim(),

      type:
        "local",

      createdBy:
        auth.currentUser.uid,

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    });

    alert("Product saved ✅");

    $("pName").value = "";
    $("pPrice").value = "";
    $("pPhoto").value = "";
    $("pStock").value = "1";
    $("pShopId").value = "";

    loadProducts();

  } catch(error) {

    alert(
      "Product save error:\n" +
      error.message
    );

  }

}

// ======================================================
// AFFILIATE PRODUCT
// ======================================================

async function saveAffiliateProduct() {

  const name =
    $("aName").value.trim();

  const link =
    $("aLink").value.trim();

  if (!name || !link) {

    alert(
      "Product name aur Amazon link required hai"
    );

    return;

  }

  try {

    await db.collection("products").add({

      name,

      price:
        Number(
          $("aPrice").value || 0
        ),

      photo:
        $("aPhoto").value.trim(),

      link,

      type:
        "affiliate",

      createdBy:
        auth.currentUser.uid,

      createdAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    });

    alert("Affiliate product saved ✅");

    $("aName").value = "";
    $("aPrice").value = "";
    $("aPhoto").value = "";
    $("aLink").value = "";

    loadProducts();

  } catch(error) {

    alert(error.message);

  }

}

// ======================================================
// BANNER
// ======================================================

async function saveBanner() {

  const url =
    $("bannerUrl").value.trim();

  if (!url) {

    alert("Banner URL daalo");
    return;

  }

  try {

    await db
      .collection("banner")
      .doc("main")
      .set({

        url,

        updatedBy:
          auth.currentUser.uid,

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    alert("Banner updated ✅");

  } catch(error) {

    alert(error.message);

  }

}

// ======================================================
// ORDERS
// ======================================================

function loadOrders() {

  const container =
    $("ordersList") ||
    $("dashboardOrders");

  if (!container) return;

  db.collection("orders")
    .orderBy(
      "createdAt",
      "desc"
    )
    .onSnapshot(

      snapshot => {

        if (snapshot.empty) {

          container.innerHTML =
            "<p>No orders.</p>";

          return;

        }

        container.innerHTML =
          snapshot.docs.map(doc => {

            const o =
              doc.data();

            return `
              <div class="item">

                <h3>
                  Order #${doc.id}
                </h3>

                <p>
                  <b>Customer:</b>
                  ${escapeHTML(
                    o.phone || ""
                  )}
                </p>

                <p>
                  <b>Address:</b>
                  ${escapeHTML(
                    o.address || ""
                  )}
                </p>

                <p>
                  <b>Total:</b>
                  ₹${Number(
                    o.total || 0
                  )}
                </p>

                <p>
                  <b>Payment:</b>
                  ${o.paymentMethod || "COD"}
                </p>

                <p>
                  <b>Status:</b>
                  ${o.status || "NEW"}
                </p>

                <p>
                  <b>Delivery OTP:</b>
                  ${o.deliveryOTP || "----"}
                </p>

                <select
                  onchange="updateOrderStatus(
                    '${doc.id}',
                    this.value
                  )"
                >

                  <option
                    ${o.status==="NEW"?"selected":""}
                  >
                    NEW
                  </option>

                  <option
                    ${o.status==="CONFIRMED"?"selected":""}
                  >
                    CONFIRMED
                  </option>

                  <option
                    ${o.status==="PACKED"?"selected":""}
                  >
                    PACKED
                  </option>

                  <option
                    ${o.status==="OUT_FOR_DELIVERY"?"selected":""}
                  >
                    OUT_FOR_DELIVERY
                  </option>

                  <option
                    ${o.status==="DELIVERED"?"selected":""}
                  >
                    DELIVERED
                  </option>

                  <option
                    ${o.status==="CANCELLED"?"selected":""}
                  >
                    CANCELLED
                  </option>

                </select>

              </div>
            `;

          }).join("");

      },

      error => {

        console.error(
          "Order load error:",
          error
        );

        container.innerHTML =
          "<p>Orders load nahi hue.</p>";

      }

    );

}

async function updateOrderStatus(
  orderId,
  status
) {

  try {

    await db
      .collection("orders")
      .doc(orderId)
      .update({

        status,

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        updatedBy:
          auth.currentUser.uid

      });

  } catch(error) {

    alert(
      "Status update failed:\n" +
      error.message
    );

  }

}

// ======================================================
// PRODUCTS LIST
// ======================================================

function loadProducts() {

  const container =
    $("productsList");

  if (!container) return;

  db.collection("products")
    .onSnapshot(snapshot => {

      if (snapshot.empty) {

        container.innerHTML =
          "<p>No products.</p>";

        return;

      }

      container.innerHTML =
        snapshot.docs.map(doc => {

          const p =
            doc.data();

          return `
            <div class="item">

              <img
                src="${
                  p.photo ||
                  p.image ||
                  "https://via.placeholder.com/400"
                }"
              >

              <h3>
                ${escapeHTML(
                  p.name || "Product"
                )}
              </h3>

              <p>
                ₹${Number(
                  p.price || 0
                )}
              </p>

              <p>
                Type:
                ${p.type || ""}
              </p>

              ${
                p.stock !== undefined
                ?
                `<p>Stock: ${p.stock}</p>`
                :
                ""
              }

              <button
                class="danger"
                onclick="deleteProduct(
                  '${doc.id}'
                )"
              >
                DELETE
              </button>

            </div>
          `;

        }).join("");

    });

}

async function deleteProduct(id) {

  if (
    !confirm(
      "Product delete karna hai?"
    )
  ) return;

  try {

    await db
      .collection("products")
      .doc(id)
      .delete();

  } catch(error) {

    alert(error.message);

  }

}

// ======================================================
// SHOPS
// ======================================================

function loadShops() {

  const container =
    $("shopsList");

  if (!container) return;

  db.collection("shops")
    .onSnapshot(snapshot => {

      if (snapshot.empty) {

        container.innerHTML =
          "<p>No shops.</p>";

        return;

      }

      container.innerHTML =
        snapshot.docs.map(doc => {

          const s =
            doc.data();

          return `
            <div class="item">

              <h3>
                ${escapeHTML(
                  s.name || "Shop"
                )}
              </h3>

              <p>
                ${escapeHTML(
                  s.category || ""
                )}
              </p>

              <p>
                ${escapeHTML(
                  s.phone || ""
                )}
              </p>

              <p>
                ${escapeHTML(
                  s.address || ""
                )}
              </p>

              <button
                class="danger"
                onclick="deleteShop(
                  '${doc.id}'
                )"
              >
                DELETE
              </button>

            </div>
          `;

        }).join("");

    });

}

async function deleteShop(id) {

  if (
    !confirm(
      "Shop delete karna hai?"
    )
  ) return;

  try {

    await db
      .collection("shops")
      .doc(id)
      .delete();

  } catch(error) {

    alert(error.message);

  }

}

// ======================================================
// ATTENDANCE
// ======================================================

async function dutyIn() {

  const user =
    auth.currentUser;

  if (!user) return;

  try {

    await db
      .collection("attendance")
      .add({

        uid:user.uid,

        type:"DUTY_IN",

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    alert("Duty IN recorded ✅");

  } catch(error) {

    alert(error.message);

  }

}

async function dutyOff() {

  const user =
    auth.currentUser;

  if (!user) return;

  try {

    await db
      .collection("attendance")
      .add({

        uid:user.uid,

        type:"DUTY_OFF",

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    alert("Duty OFF recorded ✅");

  } catch(error) {

    alert(error.message);

  }

}

// ======================================================
// ESCAPE
// ======================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}