/******************************************************************************
 * VetPara Atlas
 * PrimaryImage – izolovaný komponent na zobrazenie hlavnej fotografie
 ******************************************************************************/

import DatabaseService from "../services/DatabaseService.js";

const IMAGES_FILE = "images.json";

let imagesCache = null;
let loadPromise = null;

const PrimaryImage = {
  async loadImages() {
    if (imagesCache !== null) return imagesCache;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        imagesCache = await DatabaseService.load(IMAGES_FILE);
      } catch (error) {
        console.warn("PrimaryImage: nepodarilo sa načítať fotografie", error);
        imagesCache = [];
      }
      loadPromise = null;
      return imagesCache;
    })();

    return loadPromise;
  },

  async findPrimaryImage(record, images = null) {
    if (!record || !record.id) return null;

    const allImages = images || await this.loadImages();
    if (!allImages || allImages.length === 0) return null;

    const candidate = allImages
      .filter((img) => img.parasiteId === record.id)
      .sort((a, b) => (a.dateAdded || "").localeCompare(b.dateAdded || ""));

    return candidate.length > 0 ? candidate[0] : null;
  },

  render(record, options = {}) {
    const { showLabel = true, containerClass = "", size = "medium" } = options;

    if (!record || !record.id) {
      return this.renderPlaceholder("Chýba identifikátor objektu", containerClass);
    }

    const sizeClass = {
      small: "primary-image-small",
      medium: "primary-image-medium",
      large: "primary-image-large",
    }[size] || "primary-image-medium";

    return `
      <div
        class="primary-image-container ${sizeClass} ${containerClass}"
        data-object-id="${this.escapeHtml(record.id)}"
        data-primary-image="true"
      >
        <div class="primary-image-placeholder">
          <span class="primary-image-icon">🔬</span>
          <span class="primary-image-label">
            ${showLabel ? "Hlavná fotografia" : "Fotografia"}
          </span>
          <span class="primary-image-status">Načítava sa...</span>
        </div>
      </div>
    `;
  },

  renderPlaceholder(message = "Žiadna fotografia", containerClass = "") {
    return `
      <div class="primary-image-container primary-image-placeholder-only ${containerClass}">
        <div class="primary-image-placeholder">
          <span class="primary-image-icon">🔬</span>
          <span class="primary-image-label">${this.escapeHtml(message)}</span>
        </div>
      </div>
    `;
  },

  async populate(containerSelector = null) {
    const containers = containerSelector
      ? document.querySelectorAll(containerSelector + " .primary-image-container[data-primary-image]")
      : document.querySelectorAll(".primary-image-container[data-primary-image]");

    if (containers.length === 0) return;

    const images = await this.loadImages();
    if (images.length === 0) {
      containers.forEach((container) => {
        const status = container.querySelector(".primary-image-status");
        if (status) status.textContent = "Žiadne fotografie";
      });
      return;
    }

    containers.forEach((container) => {
      const objectId = container.dataset.objectId;
      if (!objectId) return;

      const candidates = images
      .filter((img) => img.parasiteId === objectId)
      .sort((a, b) => (a.dateAdded || "").localeCompare(b.dateAdded || ""));
      const image = candidates.length > 0 ? candidates[0] : null;

      if (image) {
        container.innerHTML = `
          <img 
            src="${this.resolveImageUrl(image.url)}" 
            alt="${this.escapeHtml(objectId)}"
            class="primary-image-img"
          >
        `;
      } else {
        container.innerHTML = `
          <div class="primary-image-placeholder">
            <span class="primary-image-icon">🔬</span>
            <span class="primary-image-label">Žiadna fotografia</span>
          </div>
        `;
      }
    });
  },

  renderStatic(record, images) {
    if (!record || !record.id) {
      return this.renderPlaceholder("Chýba identifikátor objektu");
    }

    if (!images || images.length === 0) {
      return this.renderPlaceholder("Žiadne fotografie");
    }

    const candidates = images
.filter((img) => img.parasiteId === record.id)
     .sort((a, b) => (a.dateAdded || "").localeCompare(b.dateAdded || ""));

    const image = candidates.length > 0 ? candidates[0] : null;

    if (!image) {
      return this.renderPlaceholder("Žiadna fotografia pre tento objekt");
    }

    return `
      <img 
        src="${this.resolveImageUrl(image.url)}" 
        alt="${this.escapeHtml(record.id)}"
        class="primary-image-img"
      >
    `;
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },

 resolveImageUrl(url) {
    if (!url) return "";
    return url.replace(/^\/+/, "");
  }, 
};

export default PrimaryImage;
