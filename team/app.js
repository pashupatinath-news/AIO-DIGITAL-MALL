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
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

import {
  firebaseConfig
} from "./firebaseConfig.js";


const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const storage =
  getStorage(app);

const $ =
  id => document.getElementById(id);


let confirmationResult = null;

let recaptchaVerifier = null;

let currentUser = null;

let listenersStarted = false;


function escapeHTML(value) {

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


function message(text) {

  const el =
    $("message");

  if (!el) {

    alert(text);

    return;

  }

  el.textContent =
    text;

  el.classList.add(
    "show"
  );

  setTimeout(() => {

    el.classList.remove(
      "show"
    );

  },2300);

}


async function setupRecaptcha() {

  if (!$("recaptcha")) {
    return;
  }

  if (recaptchaVerifier) {
    return;
  }

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
    $("teamPhone")
      ?.value
      .trim();

  if (!phone) {

    return message(
      "Mobile number daalo."
    );

  }

  if (!phone.startsWith("+")) {

    return message(
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

    message(
      "OTP bhej diya ✅"
    );

  } catch(error) {

    console.error(error);

    message(
      error.message
    );

  }

}

window.sendOTP =
  sendOTP;


async function verifyOTP() {

  if (!confirmationResult) {

    return message(
      "Pehle OTP bhejo."
    );

  }

  const otp =
    $("teamOTP")
      ?.value
      .trim();

  if (!otp) {

    return message(
      "OTP daalo."
    );

  }

  try {

    await confirmationResult.confirm(
      otp
    );

  } catch(error) {

    console.error(error);

    message(
      "Galat OTP ❌"
    );

  }

}

window.verifyOTP =
  verifyOTP;


async function checkTeamAccess(user) {

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );

  const snapshot =
    await getDoc(
      userRef
    );

  if (!snapshot.exists()) {

    await signOut(auth);

    message(
      "Team access nahi hai."
    );

    return false;

  }

  const role =
    snapshot.data().role;

  if (
    ![
      "team",
      "admin",
      "owner"
    ].includes(role)
  ) {

    await signOut(auth);

    message(
      "Team access denied."
    );

    return false;

  }

  return true;

}


onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;

    if (!user) {

      $("loginScreen")
        ?.classList.remove(
          "hidden"
        );

      $("dashboard")
        ?.classList.add(
          "hidden"
        );

      return;

    }

    const allowed =
      await checkTeamAccess(
        user
      );

    if (!allowed) {
      return;
    }

    $("loginScreen")
      ?.classList.add(
        "hidden"
      );

    $("dashboard")
      ?.classList.remove(
        "hidden"
      );

    startDashboard();

  }
);


async function saveShop() {

  if (!currentUser) {
    return message(
      "Team login required."
    );
  }

  const name =
    $("shopName")
      ?.value
      .trim();

  if (!name) {

    return message(
      "Shop name daalo."
    );

  }

  try {

    await addDoc(
      collection(
        db,
        "shops"
      ),
      {
        name,
        category:
          $("shopCategory")
            .value,
        createdBy:
          currentUser.uid,
        createdAt:
          serverTimestamp()
      }
    );

    $("shopName").value =
      "";

    message(
      "Shop save ho gaya ✅"
    );

  } catch(error) {

    message(
      error.message
    );

  }

}

window.saveShop =
  saveShop;


async function saveProduct() {

  if (!currentUser) {
    return message(
      "Login required."
    );
  }

  const name =
    $("pName")
      ?.value
      .trim();

  const price =
    Number(
      $("pPrice")
        ?.value
    );

  const stock =
    Number(
      $("pStock")
        ?.value || 0
    );

  if (
    !name ||
    !Number.isFinite(price)
  ) {

    return message(
      "Product name aur price required."
    );

  }

  try {

    await addDoc(
      collection(
        db,
        "products"
      ),
      {
        name,
        price,
        photo:
          $("pPhoto")
            ?.value
            .trim() || "",
        category:
          $("pCategory")
            .value,
        stock,
        type:
          "local",
        createdBy:
          currentUser.uid,
        createdAt:
          serverTimestamp()
      }
    );

    $("pName").value = "";
    $("pPrice").value = "";
    $("pPhoto").value = "";
    $("pStock").value = "1";

    message(
      "Product save ho gaya ✅"
    );

  } catch(error) {

    message(
      error.message
    );

  }

}

window.saveProduct =
  saveProduct;


async function saveAffiliate() {

  const name =
    $("aName")
      ?.value
      .trim();

  const link =
    $("aLink")
      ?.value
      .trim();

  if (!name || !link) {

    return message(
      "Name aur Amazon link required."
    );

  }

  try {

    await addDoc(
      collection(
        db,
        "products"
      ),
      {
        name,
        price:
          Number(
            $("aPrice")
              ?.value || 0
          ),
        photo:
          $("aPhoto")
            ?.value
            .trim() || "",
        link,
        type:
          "affiliate",
        createdBy:
          currentUser.uid,
        createdAt:
          serverTimestamp()
      }
    );

    $("aName").value = "";
    $("aPrice").value = "";
    $("aPhoto").value = "";
    $("aLink").value = "";

    message(
      "Affiliate product save ho gaya ✅"
    );

  } catch(error) {

    message(
      error.message
    );

  }

}

window.saveAffiliate =
  saveAffiliate;


async function saveBanner() {

  const url =
    $("bannerUrl")
      ?.value
      .trim();

  if (!url) {

    return message(
      "Banner URL daalo."
    );

  }

  try {

    await setDoc(
      doc(
        db,
        "banner",
        "main"
      ),
      {
        url,
        updatedBy:
          currentUser.uid,
        updatedAt:
          serverTimestamp()
      }
    );

    message(
      "Banner update ho gaya ✅"
    );

  } catch(error) {

    message(
      error.message
    );

  }

}

window.saveBanner =
  saveBanner;


async function uploadSelfie() {

  const file =
    $("selfie")
      ?.files?.[0];

  if (!file) {

    return message(
      "Selfie select karo."
    );

  }

  try {

    const fileRef =
      ref(
        storage,
        `attendance/${currentUser.uid}/${Date.now()}-${file.name}`
      );

    await uploadBytes(
      fileRef,
      file
    );

    const url =
      await getDownloadURL(
        fileRef
      );

    await addDoc(
      collection(
        db,
        "attendance"
      ),
      {
        uid:
          currentUser.uid,
        type:
          "IN",
        photo:
          url,
        createdAt:
          serverTimestamp()
      }
    );

    message(
      "Duty IN recorded ✅"
    );

  } catch(error) {

    console.error(error);

    message(
      error.message
    );

  }

}

window.uploadSelfie =
  uploadSelfie;


async function dutyOff() {

  try {

    await addDoc(
      collection(
        db,
        "attendance"
      ),
      {
        uid:
          currentUser.uid,
        type:
          "OUT",
        createdAt:
          serverTimestamp()
      }
    );

    message(
      "Duty OFF recorded ✅"
    );

  } catch(error) {

    message(
      error.message
    );

  }

}

window.dutyOff =
  dutyOff;


function startDashboard() {

  if (listenersStarted) {
    return;
  }

  listenersStarted = true;


  onSnapshot(
    query(
      collection(
        db,
        "orders"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    ),
    snapshot => {

      $("ordersCount")
        .textContent =
        snapshot.size;

      if (!$("ordersList")) {
        return;
      }

      $("ordersList").innerHTML =
        snapshot.docs.map(
          d => {

            const o =
              d.data();

            return `
              <div class="item">

                <b>
                  Order ID:
                  ${escapeHTML(d.id)}
                </b>

                <br>

                Amount:
                ${money(o.total)}

                <br>

                Status:
                ${escapeHTML(
                  o.status || "NEW"
                )}

                <br>

                Phone:
                ${escapeHTML(
                  o.phone || ""
                )}

                <br>

                Address:
                ${escapeHTML(
                  o.address || ""
                )}

                <br><br>

                <button
                  class="primary"
                  data-status="${d.id}|CONFIRMED">
                  CONFIRM
                </button>

                <button
                  class="secondary"
                  data-status="${d.id}|DELIVERED">
                  DELIVERED
                </button>

                <button
                  class="danger"
                  data-status="${d.id}|CANCELLED">
                  CANCEL
                </button>

              </div>
            `;

          }
        ).join("")
        ||
        "<p>No orders.</p>";

    },
    error => {

      console.error(
        "Orders:",
        error
      );

    }
  );


  onSnapshot(
    collection(
      db,
      "products"
    ),
    snapshot => {

      $("productsCount")
        .textContent =
        snapshot.size;

      if (!$("productsList")) {
        return;
      }

      $("productsList").innerHTML =
        snapshot.docs.map(
          d => {

            const p =
              d.data();

            return `
              <div class="item">

                <b>
                  ${escapeHTML(
                    p.name
                  )}
                </b>

                •
                ${money(p.price)}

                •
                ${escapeHTML(
                  p.type
                )}

                <br><br>

                <button
                  class="danger"
                  data-delete="${d.id}">
                  DELETE
                </button>

              </div>
            `;

          }
        ).join("")
        ||
        "<p>No products.</p>";

    }
  );


  onSnapshot(
    collection(
      db,
      "shops"
    ),
    snapshot => {

      $("shopsCount")
        .textContent =
        snapshot.size;

      if (!$("shopsList")) {
        return;
      }

      $("shopsList").innerHTML =
        snapshot.docs.map(
          d => {

            const s =
              d.data();

            return `
              <div class="item">

                <b>
                  ${escapeHTML(
                    s.name
                  )}
                </b>

                •
                ${escapeHTML(
                  s.category
                )}

              </div>
            `;

          }
        ).join("")
        ||
        "<p>No shops.</p>";

    }
  );

}


document.addEventListener(
  "click",
  async event => {

    const statusButton =
      event.target.closest(
        "[data-status]"
      );

    if (statusButton) {

      const [
        orderId,
        status
      ] =
        statusButton
          .dataset
          .status
          .split("|");

      try {

        await updateDoc(
          doc(
            db,
            "orders",
            orderId
          ),
          {
            status,
            updatedBy:
              currentUser.uid,
            updatedAt:
              serverTimestamp()
          }
        );

        message(
          "Order updated ✅"
        );

      } catch(error) {

        message(
          error.message
        );

      }

      return;
    }


    const deleteButton =
      event.target.closest(
        "[data-delete]"
      );

    if (deleteButton) {

      if (
        !confirm(
          "Product delete karna hai?"
        )
      ) {
        return;
      }

      try {

        await deleteDoc(
          doc(
            db,
            "products",
            deleteButton.dataset.delete
          )
        );

        message(
          "Product deleted."
        );

      } catch(error) {

        message(
          error.message
        );

      }

    }

  }
);


$("logoutBtn")
  ?.addEventListener(
    "click",
    () => {
      signOut(auth);
    }
  );