import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const productsGrid = document.querySelector("#productsGrid");

function closeMenu() {
  if (!hamburger || !navMenu) return;
  hamburger.classList.remove("active");
  navMenu.classList.remove("active");
  hamburger.setAttribute("aria-expanded", "false");
}

if (hamburger && navMenu) {
  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productCard(product) {
  const image = product.imageUrl || "img/logo.png";
  const alt = product.imageAlt || product.name || "Produto da doceria";
  const actionLabel = product.actionLabel || "Encomendar";
  const actionUrl = product.actionUrl || "#contato";
  const price = product.price || "Consulte valores";

  return `
    <article class="product-card ${product.featured ? "featured" : ""}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" />
      <div class="product-info">
        ${product.featured ? '<span class="tag">Mais pedido</span>' : ""}
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-footer">
          <strong>${escapeHtml(price)}</strong>
          <a href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener">${escapeHtml(actionLabel)}</a>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(products) {
  if (!productsGrid) return;

  const activeProducts = products.filter((product) => product.active !== false);

  if (!activeProducts.length) {
    productsGrid.innerHTML = `
      <p class="empty-products">
        Nenhum produto cadastrado ainda. Entre no painel e adicione o primeiro produto.
      </p>
    `;
    return;
  }

  productsGrid.innerHTML = activeProducts.map(productCard).join("");
}

function loadProducts() {
  if (!productsGrid) return;

  try {
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));

    onSnapshot(
      productsQuery,
      (snapshot) => {
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        renderProducts(products);
      },
      (error) => {
        console.error("Erro ao carregar produtos:", error);
        productsGrid.innerHTML = `
          <p class="empty-products">
            Não foi possível carregar o cardápio. Confira a configuração do Firebase.
          </p>
        `;
      }
    );
  } catch (error) {
    console.error("Erro de configuração:", error);
    productsGrid.innerHTML = `
      <p class="empty-products">
        Configure o Firebase no arquivo firebase-config.js para carregar os produtos.
      </p>
    `;
  }
}

loadProducts();
