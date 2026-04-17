
    const IMAGE_POOL = [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80"
    ];

    const PRODUCT_DATA = [
      ["Oversized Plain T-Shirt", 249],
      ["PC Matti T-Shirt", 299],
      ["FIFA T-Shirt", 299],
      ["Coca Cola T-Shirt", 119],
      ["Black Full Sleeve T-Shirt", 119],
      ["Sarina T-Shirt", 69],
      ["Sublimation T-Shirt", 349],
      ["Dry Fit T-Shirt", 59],
      ["Football Dress", 349],
      ["Polo T-Shirt", 299],
      ["Round Neck", 49],
      ["Hoodie", 449],
      ["Hoodie Set", 1199],
      ["Fleez Set", 1199],
      ["Holi T-Shirt", 39],
      ["Security Jacket", 149],
      ["Army Sandow", 79],
      ["Cap (Printing)", 59],
      ["Black Flame Lower", 399]
    ];

    const STORAGE_KEYS = {
      cart: "esskay-cart",
      details: "esskay-saved-details"
    };

    const WHATSAPP_NUMBER = "919899565707";
    const MIN_ORDER_QUANTITY = 6;

    const products = PRODUCT_DATA.map(([name, price], index) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name,
      price,
      image: IMAGE_POOL[index % IMAGE_POOL.length],
      description: getProductDescription(name)
    }));

    const elements = {
      productGrid: document.getElementById("productGrid"),
      cartCount: document.getElementById("cartCount"),
      cartButton: document.getElementById("cartButton"),
      startOrderBtn: document.getElementById("startOrderBtn"),
      saveDetailsBtn: document.getElementById("saveDetailsBtn"),
      contactDetailsBtn: document.getElementById("contactDetailsBtn"),
      cartModal: document.getElementById("cartModal"),
      detailsModal: document.getElementById("detailsModal"),
      cartItems: document.getElementById("cartItems"),
      cartTotal: document.getElementById("cartTotal"),
      savedDetailsPreview: document.getElementById("savedDetailsPreview"),
      placeOrderBtn: document.getElementById("placeOrderBtn"),
      validationMessage: document.getElementById("validationMessage"),
      detailsForm: document.getElementById("detailsForm"),
      customerName: document.getElementById("customerName"),
      customerAddress: document.getElementById("customerAddress"),
      toast: document.getElementById("toast"),
      navLinks: document.getElementById("navLinks"),
      menuToggle: document.getElementById("menuToggle"),
      footerDrawer: document.getElementById("footerDrawer"),
      footerToggle: document.getElementById("footerToggle"),
      copyrightYear: document.getElementById("copyrightYear")
    };

    const state = {
      cart: loadCart(),
      savedDetails: loadSavedDetails(),
      toastTimer: null
    };

    initialize();

    function initialize() {
      elements.copyrightYear.textContent = new Date().getFullYear();
      renderProducts();
      renderCart();
      hydrateSavedDetailsUI();
      setupObservers();
      bindEvents();
    }

    function bindEvents() {
      elements.productGrid.addEventListener("click", handleProductGridClick);
      elements.cartButton.addEventListener("click", () => openModal(elements.cartModal));
      elements.startOrderBtn.addEventListener("click", handleStartOrder);
      elements.saveDetailsBtn.addEventListener("click", () => openDetailsModal());
      elements.contactDetailsBtn.addEventListener("click", () => openDetailsModal());
      elements.placeOrderBtn.addEventListener("click", placeOrder);
      elements.detailsForm.addEventListener("submit", handleDetailsSubmit);

      document.querySelectorAll("[data-scroll-target]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = document.getElementById(button.dataset.scrollTarget);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });

      document.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => {
          const modal = document.getElementById(button.dataset.closeModal);
          closeModal(modal);
        });
      });

      [elements.cartModal, elements.detailsModal].forEach((modal) => {
        modal.addEventListener("click", (event) => {
          if (event.target === modal) {
            closeModal(modal);
          }
        });
      });

      elements.cartItems.addEventListener("click", handleCartInteraction);
      elements.menuToggle.addEventListener("click", toggleMenu);
      elements.footerToggle.addEventListener("click", toggleFooter);

      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => closeMenu());
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeModal(elements.cartModal);
          closeModal(elements.detailsModal);
          closeMenu();
        }
      });
    }
    function renderProducts() {
      elements.productGrid.innerHTML = products
        .map((product) => {
          return `
            <article class="product-card reveal">
              <div class="product-media">
                <img src="${product.image}" alt="${product.name}">
              </div>
              <div class="product-content">
                <div class="product-top">
                  <span class="product-tag">Min ${MIN_ORDER_QUANTITY} pcs</span>
                  <strong class="product-price">${formatCurrency(product.price)}</strong>
                </div>
                <h3 class="product-name">${product.name}</h3>
                <p>${product.description}</p>
                <button class="add-to-cart" type="button" data-product-id="${product.id}">
                  Add to Cart
                </button>
              </div>
            </article>
          `;
        })
        .join("");

      setupObservers();
    }

    function renderCart() {
      const totalUnits = state.cart.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = state.cart.reduce((sum, item) => sum + getLineTotal(item), 0);
      const invalidItems = state.cart.filter((item) => item.quantity < MIN_ORDER_QUANTITY);

      elements.cartCount.textContent = totalUnits;
      elements.cartTotal.textContent = formatCurrency(totalPrice);
      elements.validationMessage.textContent = state.cart.length
        ? invalidItems.length
          ? "Some items are below 6 pieces. Increase each line item to continue."
          : "All products meet the minimum. Your order is ready for WhatsApp."
        : "Add products to start building a bulk order.";

      elements.placeOrderBtn.disabled = state.cart.length === 0;

      if (!state.cart.length) {
        elements.cartItems.innerHTML = `
          <div class="empty-cart">
            <div>
              <div class="product-tag">Cart Empty</div>
              <h3>Start with any product and we’ll build the order from there.</h3>
              <p>Add a style to the cart. Each new item starts at ${MIN_ORDER_QUANTITY} pieces so the bulk workflow feels faster.</p>
              <button class="empty-cart-button" type="button" id="browseProductsBtn">Browse Products</button>
            </div>
          </div>
        `;

        const browseButton = document.getElementById("browseProductsBtn");
        browseButton.addEventListener("click", () => {
          closeModal(elements.cartModal);
          document.getElementById("products").scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } else {
        elements.cartItems.innerHTML = state.cart
          .map((item) => {
            const product = getProductById(item.id);
            const isInvalid = item.quantity < MIN_ORDER_QUANTITY;

            return `
              <article class="cart-item ${isInvalid ? "is-invalid" : ""}" data-cart-item-id="${item.id}">
                <div class="cart-item-thumb">
                  <img src="${product.image}" alt="${product.name}">
                </div>
                <div>
                  <div class="cart-item-head">
                    <div>
                      <h3 class="cart-item-name">${product.name}</h3>
                      <span class="cart-item-price">${formatCurrency(product.price)} per piece</span>
                    </div>
                    <button class="remove-item" type="button" data-remove-item="${item.id}">Remove</button>
                  </div>
                  <p class="cart-item-copy">${product.description}</p>
                  ${isInvalid ? `<div class="item-warning">Minimum ${MIN_ORDER_QUANTITY} pieces required for checkout.</div>` : ""}
                  <div class="cart-item-footer">
                    <div class="qty-controls" role="group" aria-label="Quantity controls for ${product.name}">
                      <button class="qty-button" type="button" data-qty-action="decrease" data-product-id="${item.id}" aria-label="Decrease quantity">-</button>
                      <span class="qty-value">${item.quantity}</span>
                      <button class="qty-button" type="button" data-qty-action="increase" data-product-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="cart-line-total">
                      <span class="cart-item-price">Line total</span>
                      <strong>${formatCurrency(getLineTotal(item))}</strong>
                    </div>
                  </div>
                </div>
              </article>
            `;
          })
          .join("");
      }

      updateSavedDetailsPreview();
      persistCart();
      updateSavedButtonState();
    }

    function handleProductGridClick(event) {
      const button = event.target.closest("[data-product-id]");
      if (!button) {
        return;
      }

      const { productId } = button.dataset;
      addToCart(productId);
    }

    function handleCartInteraction(event) {
      const actionButton = event.target.closest("[data-qty-action]");
      const removeButton = event.target.closest("[data-remove-item]");

      if (actionButton) {
        const { productId, qtyAction } = actionButton.dataset;
        updateQuantity(productId, qtyAction === "increase" ? 1 : -1);
        return;
      }

      if (removeButton) {
        removeFromCart(removeButton.dataset.removeItem);
      }
    }

    function addToCart(productId) {
      const existingItem = state.cart.find((item) => item.id === productId);

      if (existingItem) {
        existingItem.quantity += MIN_ORDER_QUANTITY;
      } else {
        state.cart.push({ id: productId, quantity: MIN_ORDER_QUANTITY });
      }

      renderCart();
      showToast("Added to cart " + String.fromCodePoint(0x2705));
    }

    function updateQuantity(productId, delta) {
      const item = state.cart.find((entry) => entry.id === productId);
      if (!item) {
        return;
      }

      item.quantity = Math.max(1, item.quantity + delta);
      renderCart();
    }

    function removeFromCart(productId) {
      state.cart = state.cart.filter((item) => item.id !== productId);
      renderCart();
      showToast("Item removed");
    }

    function handleStartOrder() {
      if (!state.savedDetails.name || !state.savedDetails.address) {
        openDetailsModal();
        showToast("Save your details once to speed up repeat orders.");
        return;
      }

      openModal(elements.cartModal);
    }

    function handleDetailsSubmit(event) {
      event.preventDefault();

      const name = elements.customerName.value.trim();
      const address = elements.customerAddress.value.trim();

      if (!name || !address) {
        showToast("Please enter both name and address.");
        return;
      }

      state.savedDetails = { name, address };
      localStorage.setItem(STORAGE_KEYS.details, JSON.stringify(state.savedDetails));
      hydrateSavedDetailsUI();
      renderCart();
      closeModal(elements.detailsModal);
      showToast("Details saved for faster checkout " + String.fromCodePoint(0x2705));
    }

    function placeOrder() {
      if (!state.cart.length) {
        showToast("Your cart is empty.");
        return;
      }

      const invalidItems = state.cart.filter((item) => item.quantity < MIN_ORDER_QUANTITY);
      if (invalidItems.length) {
        renderCart();
        openModal(elements.cartModal);
        showToast(`Each product must have at least ${MIN_ORDER_QUANTITY} pieces.`);
        return;
      }

      const messageLines = [
        "Hello EssKay Sportswear,",
        "",
        "I would like to place a bulk order.",
        "",
        "Customer Details:",
        `Name: ${state.savedDetails.name || "Not provided"}`,
        `Address: ${state.savedDetails.address || "Not provided"}`,
        "",
        "Order Summary:"
      ];

      state.cart.forEach((item, index) => {
        const product = getProductById(item.id);
        messageLines.push(
          `${index + 1}. ${product.name} x ${item.quantity} = ${formatCurrency(getLineTotal(item))}`
        );
      });

      messageLines.push("");
      messageLines.push(`Final Total: ${formatCurrency(getCartTotal())}`);
      messageLines.push("");
      messageLines.push("Please confirm availability, printing options, and delivery timeline.");

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageLines.join("\n"))}`;
      window.open(url, "_blank", "noopener,noreferrer");
      showToast("Redirecting to WhatsApp...");
    }

    function openDetailsModal() {
      elements.customerName.value = state.savedDetails.name || "";
      elements.customerAddress.value = state.savedDetails.address || "";
      openModal(elements.detailsModal);
    }

    function openModal(modal) {
      if (!modal) {
        return;
      }

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      closeMenu();
    }

    function closeModal(modal) {
      if (!modal || !modal.classList.contains("is-open")) {
        return;
      }

      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");

      if (!document.querySelector(".modal-backdrop.is-open")) {
        document.body.classList.remove("modal-open");
      }
    }

    function showToast(message) {
      window.clearTimeout(state.toastTimer);
      elements.toast.textContent = message;
      elements.toast.classList.add("is-visible");

      state.toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("is-visible");
      }, 2600);
    }

    function hydrateSavedDetailsUI() {
      updateSavedDetailsPreview();
      updateSavedButtonState();
    }

    function updateSavedDetailsPreview() {
      const { name, address } = state.savedDetails;
      elements.savedDetailsPreview.innerHTML = name && address
        ? `<strong>${escapeHtml(name)}</strong>${escapeHtml(address).replace(/\n/g, "<br>")}`
        : "No saved details yet. Add your name and address to speed up repeat orders.";
    }

    function updateSavedButtonState() {
      const hasSavedDetails = Boolean(state.savedDetails.name && state.savedDetails.address);
      elements.saveDetailsBtn.classList.toggle("is-saved", hasSavedDetails);
      elements.saveDetailsBtn.innerHTML = hasSavedDetails ? "&#128100; Save Details &bull; Saved" : "&#128100; Save Details";
    }

    function toggleMenu() {
      const isOpen = elements.navLinks.classList.toggle("is-open");
      elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
    }

    function closeMenu() {
      elements.navLinks.classList.remove("is-open");
      elements.menuToggle.setAttribute("aria-expanded", "false");
    }

    function toggleFooter() {
      const isOpen = elements.footerDrawer.classList.toggle("is-open");
      elements.footerToggle.setAttribute("aria-expanded", String(isOpen));
    }

    function setupObservers() {
      const revealNodes = document.querySelectorAll(".reveal:not(.is-visible)");

      if (!("IntersectionObserver" in window)) {
        revealNodes.forEach((node) => node.classList.add("is-visible"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries, activeObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.18 }
      );

      revealNodes.forEach((node) => observer.observe(node));
    }
    function loadCart() {
      try {
        const storedValue = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
        return Array.isArray(storedValue)
          ? storedValue.filter((item) => getProductById(item.id) && Number(item.quantity) > 0)
          : [];
      } catch (error) {
        return [];
      }
    }

    function persistCart() {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
    }

    function loadSavedDetails() {
      try {
        const storedValue = JSON.parse(localStorage.getItem(STORAGE_KEYS.details) || "{}");
        return {
          name: typeof storedValue.name === "string" ? storedValue.name : "",
          address: typeof storedValue.address === "string" ? storedValue.address : ""
        };
      } catch (error) {
        return { name: "", address: "" };
      }
    }

    function getProductById(id) {
      return products.find((product) => product.id === id);
    }

    function getLineTotal(item) {
      const product = getProductById(item.id);
      return product ? product.price * item.quantity : 0;
    }

    function getCartTotal() {
      return state.cart.reduce((sum, item) => sum + getLineTotal(item), 0);
    }

    function formatCurrency(value) {
      return `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => {
        const replacements = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return replacements[character];
      });
    }

    function getProductDescription(name) {
      const descriptionMap = {
        "Oversized Plain T-Shirt": "Relaxed, premium silhouettes for merch drops, streetwear capsules, and elevated team apparel.",
        "PC Matti T-Shirt": "Smooth fabric with an everyday premium feel, ideal for branded uniforms and promotional production.",
        "FIFA T-Shirt": "Sport-led styling built for clubs, fanwear, tournaments, and energetic event collections.",
        "Coca Cola T-Shirt": "Affordable printed tee format for campaign wear, giveaways, and large-volume promotions.",
        "Black Full Sleeve T-Shirt": "Clean full-sleeve profile with a bold base tone for premium branding and cooler-weather runs.",
        "Sarina T-Shirt": "Lightweight value option suited to events, activations, and budget-friendly custom orders.",
        "Sublimation T-Shirt": "Made for vivid all-over prints when your design needs maximum impact and color clarity.",
        "Dry Fit T-Shirt": "Performance-minded fabric for training wear, corporate sports days, and active event kits.",
        "Football Dress": "Match-day ready styling for team sets, tournaments, academies, and custom football identities.",
        "Polo T-Shirt": "Smart-casual branded polo designed for uniforms, hospitality, staffwear, and retail-ready finishing.",
        "Round Neck": "Versatile essential for simple branding, quick promotions, and clean everyday custom production.",
        "Hoodie": "Heavy, premium layering piece for winter drops, corporate gifting, and high-perceived-value orders.",
        "Hoodie Set": "Coordinated hoodie set for premium team kits, brand campaigns, and packaged seasonal collections.",
        "Fleez Set": "Warm fleece set tailored for comfort-led uniforms, staffwear, and cooler-climate activation wear.",
        "Holi T-Shirt": "Volume-friendly event tee designed for colorful campaigns, festivals, and celebratory group orders.",
        "Security Jacket": "Practical outer layer for operational staffwear, event management teams, and utility-focused branding.",
        "Army Sandow": "Athletic sleeveless format for sports training, gym events, and activewear-inspired batches.",
        "Cap (Printing)": "Printed cap option to complete your branded set with low-cost, high-visibility headwear.",
        "Black Flame Lower": "Statement lower for tracksuit-style orders, teamwear, and premium monochrome collections."
      };

      return descriptionMap[name] || "Premium custom clothing built for bulk orders, brand-led design, and fast fulfilment.";
    }
  
