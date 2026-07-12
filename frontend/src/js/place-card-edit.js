(function () {
  const PLACE_EDIT_CATEGORIES = [
    { id: "restaurante", label: "Restaurante" },
    { id: "arqueologico", label: "Arqueológico" },
    { id: "playa", label: "Playa" },
    { id: "naturaleza", label: "Naturaleza" },
    { id: "ciudad", label: "Ciudad" },
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function categoryOptionsHtml(selectedId) {
    return PLACE_EDIT_CATEGORIES.map(
      (cat) =>
        `<option value="${escapeHtml(cat.id)}"${cat.id === selectedId ? " selected" : ""}>${escapeHtml(cat.label)}</option>`,
    ).join("");
  }

  function buildPlaceEditFormHtml(place, options = {}) {
    const { showVisitedAt = false, showNotes = false } = options;
    const category = place.category || "ciudad";

    const visitedField = showVisitedAt
      ? `<label class="place-card-edit__field">
          <span>Fecha de visita</span>
          <input type="text" name="visitedAt" value="${escapeHtml(place.visitedAt || "")}" placeholder="ej. 12 jul 2026">
        </label>`
      : "";

    const notesField = showNotes
      ? `<label class="place-card-edit__field">
          <span>Notas</span>
          <textarea name="notes" rows="2" placeholder="Comentario opcional">${escapeHtml(place.notes || "")}</textarea>
        </label>`
      : "";

    return `
      <form class="place-card-edit" data-place-edit-form="${escapeHtml(place.id)}" data-id="${escapeHtml(place.id)}">
        <label class="place-card-edit__field">
          <span>Nombre</span>
          <input type="text" name="name" required value="${escapeHtml(place.name)}">
        </label>
        <label class="place-card-edit__field">
          <span>Ubicación</span>
          <input type="text" name="location" required value="${escapeHtml(place.location || "")}">
        </label>
        <label class="place-card-edit__field">
          <span>Categoría</span>
          <select name="category">${categoryOptionsHtml(category)}</select>
        </label>
        ${visitedField}
        ${notesField}
        <div class="place-card-actions place-card-actions--edit">
          <button type="submit" class="primary-action place-card-actions__save">Guardar</button>
          <button type="button" class="outline-button place-card-actions__cancel" data-cancel-edit="${escapeHtml(place.id)}">Cancelar</button>
        </div>
      </form>
    `;
  }

  function buildPlaceCardActionsHtml(id, options = {}) {
    const removeLabel = options.removeLabel || "Quitar";
    const editLabel = options.editLabel || "Editar";
    return `
      <div class="place-card-actions">
        <button type="button" class="outline-button place-card-actions__edit" data-edit="${escapeHtml(id)}">${escapeHtml(editLabel)}</button>
        <button type="button" class="outline-button place-card-actions__remove" data-remove="${escapeHtml(id)}">${escapeHtml(removeLabel)}</button>
      </div>
    `;
  }

  function readPlaceEditForm(form) {
    if (!form) return null;
    const categoryId = form.category?.value || "ciudad";
    const category = PLACE_EDIT_CATEGORIES.find((item) => item.id === categoryId);
    const data = {
      name: form.name?.value?.trim() || "",
      location: form.location?.value?.trim() || "",
      category: categoryId,
      categoryLabel: category?.label || categoryId,
      department: (form.location?.value?.trim() || "").split(",").pop()?.trim() || "El Salvador",
    };

    if (form.visitedAt) {
      data.visitedAt = form.visitedAt.value.trim();
    }
    if (form.notes) {
      data.notes = form.notes.value.trim();
    }

    return data.name ? data : null;
  }

  window.TwinmapPlaceCardEdit = {
    PLACE_EDIT_CATEGORIES,
    escapeHtml,
    buildPlaceEditFormHtml,
    buildPlaceCardActionsHtml,
    readPlaceEditForm,
  };
})();
