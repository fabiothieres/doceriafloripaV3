import { auth, db } from "../firebase-config.js";
import { cloudinaryConfig } from "../cloudinary-config.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const loginView = document.querySelector("#loginView");
const dashboardView = document.querySelector("#dashboardView");
const loginForm = document.querySelector("#loginForm");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginMessage = document.querySelector("#loginMessage");
const logoutBtn = document.querySelector("#logoutBtn");

const productForm = document.querySelector("#productForm");
const productId = document.querySelector("#productId");
const formTitle = document.querySelector("#formTitle");
const productMessage = document.querySelector("#productMessage");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const adminProducts = document.querySelector("#adminProducts");
const productsCount = document.querySelector("#productsCount");
const uploadPreview = document.querySelector("#uploadPreview");

const fields = {
  name: document.querySelector("#name"),
  description: document.querySelector("#description"),
  price: document.querySelector("#price"),
  actionLabel: document.querySelector("#actionLabel"),
  actionUrl: document.querySelector("#actionUrl"),
  imageFile: document.querySelector("#imageFile"),
  imageUrl: document.querySelector("#imageUrl"),
  manualImageUrl: document.querySelector("#manualImageUrl"),
  imageAlt: document.querySelector("#imageAlt"),
  featured: document.querySelector("#featured"),
  active: document.querySelector("#active"),
};

let productsCache = [];
let unsubscribeProducts = null;

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAdminImageSrc(imageUrl = "") {
  if (!imageUrl) return "../img/logo.png";

  if (imageUrl.startsWith("img/")) {
    return `../${imageUrl}`;
  }

  return imageUrl;
}

function showDashboard() {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
}

function showLogin() {
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function updateUploadPreview(imageUrl = "") {
  if (!uploadPreview) return;

  if (!imageUrl) {
    uploadPreview.innerHTML = "<span>Nenhuma imagem selecionada</span>";
    return;
  }

  uploadPreview.innerHTML = `
    <img src="${escapeHtml(getAdminImageSrc(imageUrl))}" alt="Prévia da imagem" />
  `;
}

function validateCloudinaryConfig() {
  const { cloudName, uploadPreset } = cloudinaryConfig;

  if (
    !cloudName ||
    !uploadPreset ||
    cloudName.includes("COLE_") ||
    uploadPreset.includes("COLE_")
  ) {
    throw new Error("Configure cloudName e uploadPreset no arquivo cloudinary-config.js.");
  }
}

async function uploadImageToCloudinary(file) {
  validateCloudinaryConfig();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);

  if (cloudinaryConfig.folder) {
    formData.append("folder", cloudinaryConfig.folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro no upload da imagem: ${errorText}`);
  }

  const result = await response.json();
  return result.secure_url;
}

function getFormData() {
  return {
    name: fields.name.value.trim(),
    description: fields.description.value.trim(),
    price: fields.price.value.trim() || "Consulte valores",
    actionLabel: fields.actionLabel.value.trim() || "Encomendar",
    actionUrl: fields.actionUrl.value.trim() || "#contato",
    imageUrl:
      fields.imageUrl.value.trim() ||
      fields.manualImageUrl.value.trim() ||
      "img/logo.png",
    imageAlt: fields.imageAlt.value.trim(),
    featured: fields.featured.checked,
    active: fields.active.checked,
  };
}

function resetForm() {
  productForm.reset();
  productId.value = "";
  fields.imageUrl.value = "";
  fields.manualImageUrl.value = "";
  fields.active.checked = true;
  formTitle.textContent = "Novo produto";
  updateUploadPreview();
  setMessage(productMessage, "");
}

function fillForm(product) {
  productId.value = product.id;
  fields.name.value = product.name || "";
  fields.description.value = product.description || "";
  fields.price.value = product.price || "";
  fields.actionLabel.value = product.actionLabel || "";
  fields.actionUrl.value = product.actionUrl || "";
  fields.imageUrl.value = product.imageUrl || "";
  fields.manualImageUrl.value = product.imageUrl || "";
  fields.imageAlt.value = product.imageAlt || "";
  fields.featured.checked = Boolean(product.featured);
  fields.active.checked = product.active !== false;
  formTitle.textContent = "Editar produto";
  updateUploadPreview(product.imageUrl || "");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProducts(products) {
  productsCount.textContent = String(products.length);

  if (!products.length) {
    adminProducts.innerHTML = '<p class="muted">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  adminProducts.innerHTML = products
    .map((product) => {
      const image = getAdminImageSrc(product.imageUrl);
      const status = product.active !== false ? "Visível" : "Oculto";

      return `
        <article class="admin-product">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(product.imageAlt || product.name || "Produto")}" />

          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>

            <div class="product-meta">
              <span>${escapeHtml(product.price || "Consulte valores")}</span>
              <span>${status}</span>
              ${product.featured ? "<span>Mais pedido</span>" : ""}
            </div>

            <div class="product-buttons">
              <button class="btn secondary" type="button" data-action="edit" data-id="${product.id}">
                Editar
              </button>

              <button class="btn ghost" type="button" data-action="toggle" data-id="${product.id}">
                ${product.active !== false ? "Ocultar" : "Mostrar"}
              </button>

              <button class="btn danger" type="button" data-action="delete" data-id="${product.id}">
                Excluir
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function listenProducts() {
  if (unsubscribeProducts) return;

  const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));

  unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
    productsCache = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    renderProducts(productsCache);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Entrando...");

  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
    loginForm.reset();
    setMessage(loginMessage, "");
  } catch (error) {
    console.error(error);
    setMessage(loginMessage, "E-mail ou senha inválidos. Confira os dados e tente novamente.", "error");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

fields.imageFile.addEventListener("change", () => {
  const file = fields.imageFile.files?.[0];

  if (!file) {
    updateUploadPreview(fields.imageUrl.value || fields.manualImageUrl.value);
    return;
  }

  const localPreviewUrl = URL.createObjectURL(file);
  updateUploadPreview(localPreviewUrl);
});

fields.manualImageUrl.addEventListener("input", () => {
  if (!fields.imageFile.files?.[0]) {
    fields.imageUrl.value = fields.manualImageUrl.value.trim();
    updateUploadPreview(fields.imageUrl.value);
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  let data = getFormData();

  if (!data.name || !data.description) {
    setMessage(productMessage, "Preencha nome e descrição do produto.", "error");
    return;
  }

  try {
    const selectedImage = fields.imageFile.files?.[0];

    if (selectedImage) {
      setMessage(productMessage, "Enviando imagem...");
      const uploadedImageUrl = await uploadImageToCloudinary(selectedImage);

      fields.imageUrl.value = uploadedImageUrl;
      fields.manualImageUrl.value = uploadedImageUrl;
      updateUploadPreview(uploadedImageUrl);

      data = getFormData();
    }

    setMessage(productMessage, "Salvando produto...");

    if (productId.value) {
      await updateDoc(doc(db, "products", productId.value), {
        ...data,
        updatedAt: serverTimestamp(),
      });

      setMessage(productMessage, "Produto atualizado com sucesso.", "success");
    } else {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage(productMessage, "Produto cadastrado com sucesso.", "success");
    }

    resetForm();
  } catch (error) {
    console.error(error);

    setMessage(
      productMessage,
      "Não foi possível salvar. Confira o Cloudinary, Firebase e as regras do banco.",
      "error"
    );
  }
});

cancelEditBtn.addEventListener("click", resetForm);

adminProducts.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const product = productsCache.find((item) => item.id === id);

  if (!product) return;

  if (action === "edit") {
    fillForm(product);
  }

  if (action === "toggle") {
    await updateDoc(doc(db, "products", id), {
      active: product.active === false,
      updatedAt: serverTimestamp(),
    });
  }

  if (action === "delete") {
    const confirmed = confirm(`Excluir o produto "${product.name}"?`);
    if (!confirmed) return;

    await deleteDoc(doc(db, "products", id));
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showDashboard();
    listenProducts();
  } else {
    showLogin();

    if (unsubscribeProducts) {
      unsubscribeProducts();
      unsubscribeProducts = null;
    }
  }
});