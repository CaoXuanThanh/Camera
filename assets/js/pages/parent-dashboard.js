"use strict";

async function renderParent(main) {
  const h = app.html;
  main.classList.add("concept-c");
  main.innerHTML = `
    <div class="screen-heading parent-heading">
      <h1>Camera trường học</h1>
      <p>Danh sách camera cập nhật theo lớp của con.</p>
    </div>
    <div class="parent-gallery">
      <aside class="parent-student-panel" aria-labelledby="linked-students">
        <h2 id="linked-students">Học sinh liên kết</h2>
        <ul class="parent-students" hidden></ul>
        <p id="no-linked-students" class="small muted" hidden>Chưa có học sinh liên kết với tài khoản này.</p>
      </aside>
      <section class="parent-camera-panel" aria-labelledby="school-cameras">
        <div class="section-bar camera-section-bar">
          <div>
            <h2 id="school-cameras">Camera được cấp quyền</h2>
            <p class="small muted" id="camera-count">Đang tải danh sách camera…</p>
            <p class="small muted" id="parent-access-update" role="status"></p>
          </div>
          <label class="camera-search">
            <span class="sr-only">Tìm camera theo tên, lớp hoặc vị trí</span>
            <input class="field" type="search" id="camera-search" placeholder="Tìm theo tên, lớp hoặc vị trí">
          </label>
        </div>
        <span id="camera-search-status" class="sr-only" role="status"></span>
        <div class="camera-grid" hidden></div>
        <p id="no-camera-results" class="panel empty-panel muted" hidden>Không có camera khớp từ khóa.</p>
        <div id="parent-empty" class="panel empty-panel" hidden>
          <h3>Chưa có camera được cấp quyền</h3><p class="muted"></p>
        </div>
        <p id="parent-dashboard-error" class="panel empty-panel error" role="alert" hidden></p>
      </section>
    </div>`;

  const search = main.querySelector("#camera-search");
  const grid = main.querySelector(".camera-grid");
  const noResults = main.querySelector("#no-camera-results");
  const count = main.querySelector("#camera-count");
  const searchStatus = main.querySelector("#camera-search-status");
  const accessUpdate = main.querySelector("#parent-access-update");
  const empty = main.querySelector("#parent-empty");
  const dashboardError = main.querySelector("#parent-dashboard-error");
  const studentList = main.querySelector(".parent-students");
  const noStudents = main.querySelector("#no-linked-students");
  let currentCameras = null;
  let lastCameraMarkup = "";
  let lastStudentMarkup = "";
  let receivedUpdate = false;
  let active = true;

  function normalizeText(value) {
    return String(value ?? "").toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").trim();
  }

  function applySearch(announce = false) {
    const query = normalizeText(search.value);
    const cards = [...grid.querySelectorAll(".feed-card")];
    cards.forEach((card) => {
      const fields = [...card.querySelector(".feed-details").children];
      card.hidden = !fields.some((field) => normalizeText(field.textContent).includes(query));
    });
    grid.querySelectorAll(".camera-group").forEach((group) => {
      group.hidden = !group.querySelector(".feed-card:not([hidden])");
    });
    const visible = cards.filter((card) => !card.hidden).length;
    const message = query ? `${visible} kết quả / ${cards.length} camera` : `${cards.length} camera`;
    if (count.textContent !== message) count.textContent = message;
    if (announce && searchStatus.textContent !== message) searchStatus.textContent = message;
    noResults.hidden = !cards.length || visible > 0;
  }

  function renderCard(camera, available) {
    const status = camera.enabled ? app.status(available) : "Đã tắt";
    const action = available ? "Xem camera" : "Xem trạng thái";
    const hasImage = /^[\w-]+\.(?:jpe?g|png|webp)$/i.test(camera.image ?? "");
    return `<article class="feed-card${available ? "" : " feed-card-unavailable"}">
        <div class="feed-preview">
          <span class="camera-icon" aria-hidden="true"></span>
          ${hasImage ? `<img src="assets/images/${h(camera.image)}" alt="" loading="lazy">
          <span class="feed-preview-label">Ảnh minh họa</span>` : ""}
        </div>
        <div class="feed-details">
          <h4>${h(camera.name)}</h4>
          <p class="small muted">${h(camera.location)}</p>
          ${camera.className ? `<p class="feed-access small">Quyền từ lớp ${h(camera.className)}</p>` : ""}
        </div>
        <div class="feed-actions">
          <span class="badge badge-status badge-${available ? "online" : "offline"}">${status}</span>
          <a class="button button-secondary" href="#/camera/${encodeURIComponent(camera.id)}" aria-label="${action} · ${h(camera.name)}">
            ${action}
          </a>
        </div>
      </article>`;
  }

  function renderGroups(cameras) {
    const classCards = [];
    const sharedCards = [];
    for (const camera of cameras) {
      const available = camera.enabled && camera.connectionStatus === "online";
      (camera.classIds.length > 1 ? sharedCards : classCards).push(renderCard(camera, available));
    }
    return [
      { title: "Theo lớp", cards: classCards },
      { title: "Dùng chung", cards: sharedCards }
    ].filter(({ cards }) => cards.length).map(({ title, cards }, index) => `
      <section class="camera-group" aria-labelledby="camera-group-${index}">
        <h3 class="camera-group-title" id="camera-group-${index}">${title}</h3>
        <div class="camera-group-cards">${cards.join("")}</div>
      </section>`).join("");
  }

  function showDashboard({ parent, children, cameras }) {
    const focusedLink = grid.contains(document.activeElement)
      ? document.activeElement.closest("a")
      : null;
    const cameraMarkup = renderGroups(cameras);
    const changed = cameraMarkup !== lastCameraMarkup;
    if (changed) {
      grid.innerHTML = cameraMarkup;
      lastCameraMarkup = cameraMarkup;
    }
    grid.hidden = !cameras.length;
    empty.hidden = Boolean(cameras.length);
    dashboardError.hidden = true;
    if (!cameras.length) {
      let reason = "Tài khoản hiện chưa liên kết với học sinh đang học.";
      if (!parent.accessEnabled) reason = "Nhà trường đang tạm khóa quyền xem của tài khoản này.";
      else if (children.some((child) => child.status === "active")) reason = "Các lớp hiện tại chưa được nhà trường gán camera.";
      empty.querySelector("p").textContent = reason;
    }
    applySearch();
    if (changed && focusedLink) {
      const href = focusedLink.getAttribute("href");
      const retained = [...grid.querySelectorAll(".feed-card:not([hidden]) a")]
        .find((link) => link.getAttribute("href") === href);
      (retained || search).focus({ preventScroll: true });
    }

    const studentMarkup = children.map((child) => `<li class="parent-student">
      <strong>${h(child.fullName)}</strong>
      <p>${child.status === "active" ? "Lớp " + h(child.className || child.classId) : "Đã nghỉ học"}</p>
    </li>`).join("");
    if (studentMarkup !== lastStudentMarkup) {
      studentList.innerHTML = studentMarkup;
      lastStudentMarkup = studentMarkup;
    }
    studentList.hidden = !children.length;
    noStudents.hidden = Boolean(children.length);

    const nextCameras = new Map(cameras.map((camera) => [camera.id, camera.name]));
    if (currentCameras) {
      const granted = cameras.filter((camera) => !currentCameras.has(camera.id)).map((camera) => camera.name);
      const revoked = [...currentCameras].filter(([id]) => !nextCameras.has(id)).map(([, name]) => name);
      const changes = [];
      if (granted.length) changes.push(`Đã cấp quyền xem ${granted.join(", ")}`);
      if (revoked.length) changes.push(`Đã thu hồi quyền xem ${revoked.join(", ")}`);
      if (changes.length) {
        const message = changes.join(" · ");
        if (accessUpdate.textContent !== message) accessUpdate.textContent = message;
      }
    }
    currentCameras = nextCameras;
  }

  function showError(error) {
    const restoreFocus = grid.contains(document.activeElement);
    grid.replaceChildren();
    studentList.replaceChildren();
    lastCameraMarkup = "";
    lastStudentMarkup = "";
    currentCameras = null;
    for (const element of [grid, noResults, empty, studentList, noStudents]) element.hidden = true;
    for (const element of [count, accessUpdate, searchStatus]) element.textContent = "";
    dashboardError.textContent = error.message || "Không thể tải danh sách camera.";
    dashboardError.hidden = false;
    if (restoreFocus) search.focus({ preventScroll: true });
  }

  search.addEventListener("input", () => {
    if (!dashboardError.hidden || !currentCameras) return;
    applySearch(true);
  });

  const unsubscribe = service.watchParentDashboard((next, error) => {
    if (!active || !main.isConnected) return;
    receivedUpdate = true;
    if (error) showError(error);
    else showDashboard(next);
  });
  app.stopParentDashboard = () => {
    active = false;
    unsubscribe();
  };

  try {
    const dashboard = await service.getParentDashboard();
    if (active && main.isConnected && !receivedUpdate) showDashboard(dashboard);
  } catch (error) {
    if (active && main.isConnected && !receivedUpdate) showError(error);
  }
}
