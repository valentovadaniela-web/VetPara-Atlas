/******************************************************************************
 * VetPara Atlas
 * PrimaryImage – izolovaný komponent na zobrazenie hlavnej fotografie
 *
 * Použitie:
 *   import PrimaryImage from "../components/PrimaryImage.js";
 *
 *   // V Atlase (AtlasPage.showDetail):
 *   const imageHtml = PrimaryImage.render(record);
 *   // ... vložiť do .img-placeholder-box
 *
 * Komponent je bez vedľajších efektov – vracia HTML string.
 * Nepoužíva DOM manupulácie pri volaní render().
 ******************************************************************************/

import DatabaseService from "../services/DatabaseService.js";

const IMAGES_FILE = "images.json";

// Cache pre načítané fotografie – zdieľané naprieč celou appkou
let imagesCache = null;
let loadPromise = null;

const PrimaryImage = {
  /**
   * Načíta fotografie z images.json (cacheované)
   * @returns {Promise<Array>} pole fotografií
   */
  async loadImages() {
    if (imagesCache !== null) {
      return imagesCache;
    }

    if (loadPromise) {
      return loadPromise;
    }

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

  /**
   * Nájde hlavnú fotku pre daný diagnostický objekt.
   * @param {Object} record – diagnostický objekt z parasites.json
   * @param {Array} images – pole fotografií (nepovinné, ak nie je, načíta sa)
   * @returns {Object|null} fotografia alebo null
   */
  async findPrimaryImage(record, images = null) {
    if (!record || !record.id) return null;

    const allImages = images || await this.loadImages();
    if (!allImages || allImages.length === 0) return null;

    // Hľadáme fotku s rovnakým objectId, najskôr isPrimary: true, inak prvú
    const candidate = allImages
      .filter((img) => img.objectId === record.id)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

    return candidate.length > 0 ? candidate[0] : null;
  },

  /**
   * Vráti HTML fragment pre zobrazenie hlavnej fotky (alebo placeholderu).
   * @param {Object} record – diagnostický objekt
   * @param {Object} options – voliteľné nastavenia:
   *   - showLabel {boolean} – zobraziť nápis "Hlavná fotografia" (default: true)
   *   - containerClass {string} – dodatočná CSS trieda pre obal
   *   - size {string} – 'small', 'medium', 'large' (default: 'medium')
   * @returns {string} HTML string
   *
   * POZNÁMKA: Táto funkcia je SYCHRÓNNA – vracia HTML, ktoré sa neskôr
   * môže doplniť o reálnu fotku pomocou PrimaryImage.populate().
   * Pre zobrazenie v Atalase (ktorý renderuje synchronne) vrátime placeholder
   * a potom ho asynchrónne doplníme.
   */
  render(record, options = {}) {
    const { showLabel = true, containerClass = "", size = "medium" } = options;

    if (!record || !record.id) {
      return this.renderPlaceholder("Chýba identifikátor objektu", containerClass);
    }

    // Vrátime placeholder s atribútmi, ktoré umožnia neskoršie doplnenie
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

  /**
   * Vráti čistý placeholder (fallback, keď nie je žiadny objekt)
   */
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

  /**
   * ASYNCHRÓNNY populator – nájde v DOM všetky .primary-image-container
   * a doplní ich reálnymi fotkami (alebo placeholderom).
   *
   * Táto funkcia sa volá po načítaní fotografií, napr. v AtlasPage.showDetail()
   * po vykreslení detailu.
   *
   * @param {string} containerSelector – voliteľný selektor na obmedzenie rozsahu
   * @returns {Promise<void>}
   */
  async populate(containerSelector = null) {
    const containers = containerSelector
      ? document.querySelectorAll(containerSelector + " .primary-image-container[data-primary-image]")
      : document.querySelectorAll(".primary-image-container[data-primary-image]");

    if (containers.length === 0) return;

    const images = await this.loadImages();
    if (images.length === 0) {
      // Žiadne fotografie – zmeníme status
      containers.forEach((container) => {
        const status = container.querySelector(".primary-image-status");
        if (status) {
          status.textContent = "Žiadne fotografie";
        }
      });
      return;
    }

    // Pre každý container nájdeme objekt a fotku
    containers.forEach((container) => {
      const objectId = container.dataset.objectId;
      if (!objectId) return;

      // Nájsť fotku pre tento objectId
      const candidates = images
        .filter((img) => img.objectId === objectId)
        .sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });

      const image = candidates.length > 0 ? candidates[0] : null;

      // Nahradiť placeholder
      const placeholder = container.querySelector(".primary-image-placeholder");
      if (!placeholder) return;

      if (image) {
        // Máme fotku – zobraziť ju
        // POZNÁMKA: V reálnej implementácii by sa tu vložil <img> tag.
        // Momentálne nemáme reálne súbory, takže ukážeme info o fotke.
        container.innerHTML = `
          <div class="primary-image-loaded">
            <div class="primary-image-fake" style="background: var(--color-surface-alt); display:flex; align-items:center; justify-content:center; width:100%; height:100%; min-height:120px; border-radius:var(--radius-md);">
              <div style="text-align:center; color:var(--color-text-muted);">
                <div style="font-size:3rem; opacity:0.4;">🖼️</div>
                <div style="font-size:var(--fs-sm);">${this.escapeHtml(image.filename || "Fotka")}</div>
                ${image.author ? `<div style="font-size:var(--fs-xs);">© ${this.escapeHtml(image.author)}</div>` : ""}
                ${image.isPrimary ? `<div style="font-size:var(--fs-xs); color:var(--color-secondary); font-weight:600;">★ Hlavná</div>` : ""}
              </div>
            </div>
          </div>
        `;
      } else {
        // Žiadna fotka pre tento objekt
        container.innerHTML = `
          <div class="primary-image-placeholder">
            <span class="primary-image-icon">🔬</span>
            <span class="primary-image-label">Žiadna fotografia</span>
          </div>
        `;
      }
    });
  },

  /**
   * Vráti čistý HTML pre fotku (bez DOM manipulácie) – užitočné pre SSR/statické renderovanie.
   * @param {Object} record – diagnostický objekt
   * @param {Array} images – pole fotografií (už načítaných)
   * @returns {string} HTML string
   */
  renderStatic(record, images) {
    if (!record || !record.id) {
      return this.renderPlaceholder("Chýba identifikátor objektu");
    }

    if (!images || images.length === 0) {
      return this.renderPlaceholder("Žiadne fotografie");
    }

    const candidates = images
      .filter((img) => img.objectId === record.id)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

    const image = candidates.length > 0 ? candidates[0] : null;

    if (!image) {
      return this.renderPlaceholder("Žiadna fotografia pre tento objekt");
    }

    // V reálnej implementácii by sa tu vložil <img src="..."> tag
    return `
      <div class="primary-image-static">
        <div class="primary-image-fake" style="background: var(--color-surface-alt); display:flex; align-items:center; justify-content:center; width:100%; height:100%; min-height:120px; border-radius:var(--radius-md);">
          <div style="text-align:center; color:var(--color-text-muted);">
            <div style="font-size:3rem; opacity:0.4;">🖼️</div>
            <div style="font-size:var(--fs-sm);">${this.escapeHtml(image.filename || "Fotka")}</div>
            ${image.author ? `<div style="font-size:var(--fs-xs);">© ${this.escapeHtml(image.author)}</div>` : ""}
            ${image.isPrimary ? `<div style="font-size:var(--fs-xs); color:var(--color-secondary); font-weight:600;">★ Hlavná</div>` : ""}
          </div>
        </div>
      </div>
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
};

export default PrimaryImage;