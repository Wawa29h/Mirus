function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPostageStamp(title, location, variant = "classic") {
  const safeTitle = escapeHtml(title);
  const safeLocation = escapeHtml(location);
  const variantClass = variant === "portrait" ? "postage-stamp--portrait" : "postage-stamp--classic";

  return `
    <div class="postage-stamp ${variantClass}" aria-hidden="true">
      <div class="postage-stamp__face">
        <span class="postage-stamp__country">El Salvador</span>
        <strong class="postage-stamp__title">${safeTitle}</strong>
        <span class="postage-stamp__location">${safeLocation}</span>
        <span class="postage-stamp__value">★</span>
      </div>
    </div>
  `;
}

function mountPlaceStamps() {
  document.querySelectorAll(".place-stamp").forEach((node) => {
    const variant = node.dataset.postmark || "classic";
    const title = node.dataset.title || "Nombre lugar";
    const location = node.dataset.location || "El Salvador";

    node.innerHTML = renderPostageStamp(title, location, variant);
  });
}

mountPlaceStamps();

window.TwinmapInkPostmarks = {
  refresh: mountPlaceStamps,
};
