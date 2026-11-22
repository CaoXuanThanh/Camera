"use strict";

async function renderAdmin(main, page, query) {
  if (page === "dong-bo") return renderSchoolSync(main);
  const data = await service.getAdminOverview();
  if (page === "tra-cuu") return renderAccessLookup(main, data, query);
  if (page === "lop-hoc") renderAdminStudents(main, data);
  else if (page === "camera") renderAdminCameras(main, data);
  else if (page === "tai-khoan") renderAdminAccounts(main, data);
  else if (page === "lich-su") renderAdminActivity(main, data);
  else renderAdminOverview(main, data);
}

function adminSearch(value) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").trim();
}

function metric(label, value, detail) {
  return `<div class="panel metric"><p>${app.html(label)}</p><strong>${value}</strong><p class="small muted">${app.html(detail)}</p></div>`;
}

function renderAdminOverview(main, data) {
  const active = data.students.filter((student) => student.active).length;
  const online = data.cameras.filter((camera) => camera.online).length;
  main.innerHTML = `
    <div class="screen-heading"><h1>Tổng quan quản trị</h1><p>Theo dõi thiết bị và quyền truy cập theo lớp.</p></div>
    <div class="metric-grid">
      ${metric("Lớp học", data.classes.length, "Danh sách lớp mẫu")}
      ${metric("Học sinh đang học", active, `${data.students.length} hồ sơ học sinh`)}
      ${metric("Tài khoản phụ huynh", data.parents.length, "Quyền tự động theo lớp")}
      ${metric("Camera hoạt động", online, `${data.cameras.length - online} camera ngoại tuyến`)}
    </div>
    <section class="panel overview-workflow">
      <div>
        <h2>Quyền xem theo lớp</h2>
        <p class="muted">Gán camera cho lớp. Khi cập nhật lớp hoặc trạng thái học, hệ thống tính lại quyền của phụ huynh.</p>
      </div>
      <div class="role-actions">
        <a class="button" href="#/quan-tri/dong-bo">Đối soát quyền</a>
        <a class="button button-secondary" href="${app.html(lookupHref(data.parents[0]?.id, data.cameras[0]?.id))}">Tra cứu quyền</a>
        <a class="button button-secondary" href="#/quan-tri/lop-hoc">Cập nhật lớp học</a>
        <a class="button button-secondary" href="#/quan-tri/camera">Quản lý camera</a>
      </div>
    </section>
    <section class="screen-section">
      <div class="section-bar"><h2>Thay đổi gần đây</h2><a href="#/quan-tri/lich-su">Xem nhật ký</a></div>
      ${activityList(data.activity.slice(0, 2))}
    </section>`;
}

async function renderSchoolSync(main) {
  main.innerHTML = `
    <div class="screen-heading">
      <h1>Đối soát quyền</h1>
      <p>Xem thay đổi hồ sơ và quyền xem camera trước khi đồng bộ.</p>
    </div>
    <section class="panel sync-source" aria-labelledby="sync-source-heading">
      <div>
        <div class="sync-source-title"><h2 id="sync-source-heading">Hệ thống hồ sơ học sinh</h2><span class="badge">Nguồn mẫu</span></div>
        <p class="small muted" id="sync-status" role="status" data-state="loading" tabindex="-1">Đang đối chiếu dữ liệu…</p>
      </div>
      <button id="sync-review" class="button button-secondary" type="button" disabled>Đối soát lại</button>
    </section>
    <div id="sync-details" hidden>
      <section id="sync-summary" class="sync-summary" aria-label="Tổng hợp tác động"></section>
      <div class="sync-review-panels">
        <section class="panel records-panel" aria-labelledby="sync-records-heading">
          <h2 id="sync-records-heading">Hồ sơ thay đổi</h2>
          <div id="sync-changes" class="sync-panel-body"></div>
        </section>
        <section class="panel records-panel" aria-labelledby="sync-parents-heading">
          <h2 id="sync-parents-heading">Quyền xem của phụ huynh</h2>
          <div id="sync-impact" class="sync-panel-body"></div>
        </section>
      </div>
    </div>
    <div class="sync-actions">
      <button id="sync-apply" class="button" type="button" disabled>Áp dụng cập nhật</button>
      <a class="button button-secondary" href="#/quan-tri/lich-su">Xem nhật ký</a>
    </div>`;

  const status = main.querySelector("#sync-status");
  const reviewButton = main.querySelector("#sync-review");
  const applyButton = main.querySelector("#sync-apply");
  const details = main.querySelector("#sync-details");
  const summary = main.querySelector("#sync-summary");
  const changes = main.querySelector("#sync-changes");
  const impact = main.querySelector("#sync-impact");
  let review = null;

  function setStatus(state, message) {
    status.dataset.state = state;
    status.textContent = message;
  }

  function showResult(result, lookupLinks = false) {
    const counts = result.impact.reduce((total, entry) => ({
      grants: total.grants + entry.granted.length,
      revokes: total.revokes + entry.revoked.length
    }), { grants: 0, revokes: 0 });
    summary.innerHTML = `
      ${metric("Hồ sơ", result.changes.length, "Thay đổi lớp hoặc tình trạng học")}
      ${metric("Lượt cấp quyền", counts.grants, "Theo cặp phụ huynh và camera")}
      ${metric("Lượt thu hồi", counts.revokes, "Theo cặp phụ huynh và camera")}`;
    changes.innerHTML = renderSchoolSyncChanges(result.changes);
    impact.innerHTML = renderImpact(result.impact, lookupLinks);
    details.hidden = false;
  }

  async function reviewChanges() {
    review = null;
    reviewButton.disabled = true;
    applyButton.disabled = true;
    details.hidden = true;
    setStatus("loading", "Đang đối chiếu dữ liệu…");
    try {
      review = await service.previewSchoolSync();
      if (!main.isConnected) return;
      showResult(review);
      applyButton.disabled = !review.changes.length;
      if (review.changes.length) setStatus("ready", "Đã đối chiếu. Kiểm tra tác động trước khi áp dụng.");
      else setStatus("empty", "Dữ liệu hiện tại đã khớp với nguồn mẫu.");
    } catch (error) {
      setStatus("error", error.message || "Không thể đối soát dữ liệu.");
    } finally {
      reviewButton.disabled = false;
    }
  }

  reviewButton.addEventListener("click", reviewChanges);
  applyButton.addEventListener("click", async () => {
    if (applyButton.disabled || !review?.changes.length) return;
    applyButton.disabled = true;
    reviewButton.disabled = true;
    setStatus("applying", "Đang áp dụng cập nhật…");
    try {
      const applied = await service.applySchoolSync(review.revision);
      if (!main.isConnected) return;
      review = null;
      showResult(applied, true);
      setStatus("applied", `Đã áp dụng ${applied.changes.length} thay đổi hồ sơ và cập nhật quyền xem.`);
    } catch (error) {
      review = null;
      if (error.code === "STALE_DATA") {
        setStatus("stale", "Dữ liệu đã đổi sau khi xem trước. Chọn Đối soát lại để kiểm tra bản cập nhật mới.");
      } else {
        setStatus("error", error.message || "Không thể áp dụng cập nhật. Hãy đối soát lại.");
      }
    } finally {
      reviewButton.disabled = false;
      if (main.isConnected) status.focus();
    }
  });
  await reviewChanges();
}

function renderSchoolSyncChanges(changes) {
  if (!changes.length) return '<p class="small muted">Không có hồ sơ cần cập nhật.</p>';
  const h = app.html;
  const describe = ({ classId, status }) => (
    `${status === "active" ? "Đang học" : "Đã nghỉ học"} · ${classId ? "Lớp " + classId : "Chưa xếp lớp"}`
  );
  return `<ul class="sync-changes">${changes.map((change) => `
    <li>
      <strong>${h(change.name)}</strong>
      <span class="small muted">${h(change.studentId)}</span>
      <dl class="sync-change-detail">
        <div><dt>Trước</dt><dd>${h(describe(change.before))}</dd></div>
        <div><dt>Sau</dt><dd>${h(describe(change.after))}</dd></div>
      </dl>
    </li>`).join("")}</ul>`;
}

function lookupHref(parentId, cameraId) {
  const query = new URLSearchParams();
  if (parentId) query.set("parentId", parentId);
  if (cameraId) query.set("cameraId", cameraId);
  const search = query.toString();
  return search ? `#/quan-tri/tra-cuu?${search}` : "#/quan-tri/tra-cuu";
}

async function renderAccessLookup(main, data, query) {
  const h = app.html;
  const options = (items) => items.map(({ id, name }) => `<option value="${h(id)}">${h(name)} · ${h(id)}</option>`).join("");
  main.innerHTML = `
    <div class="screen-heading">
      <h1>Tra cứu quyền</h1>
      <p>Kiểm tra căn cứ cấp quyền và khả năng phát video cho một phụ huynh.</p>
    </div>
    <section class="panel lookup-panel" aria-labelledby="lookup-form-heading">
      <h2 id="lookup-form-heading">Chọn phụ huynh và camera</h2>
      <form id="lookup-form" class="lookup-form">
        <label for="lookup-parent"><span>Phụ huynh</span>
          <select id="lookup-parent" class="field field-select" name="parentId" required>
            <option value="">Chọn phụ huynh</option>${options(data.parents)}
          </select>
        </label>
        <label for="lookup-camera"><span>Camera</span>
          <select id="lookup-camera" class="field field-select" name="cameraId" required>
            <option value="">Chọn camera</option>${options(data.cameras)}
          </select>
        </label>
        <button id="lookup-submit" class="button" type="submit" disabled>Tra cứu</button>
      </form>
      <p id="lookup-status" class="small muted" role="status" data-state="idle">Chọn một phụ huynh và một camera để bắt đầu.</p>
    </section>
    <section id="lookup-result" class="panel lookup-panel lookup-result" aria-labelledby="lookup-result-heading" hidden></section>`;

  const form = main.querySelector("#lookup-form");
  const parent = main.querySelector("#lookup-parent");
  const camera = main.querySelector("#lookup-camera");
  const submit = main.querySelector("#lookup-submit");
  const status = main.querySelector("#lookup-status");
  const result = main.querySelector("#lookup-result");
  const selectedParent = query.get("parentId");
  const selectedCamera = query.get("cameraId");

  function setStatus(state, message) {
    status.dataset.state = state;
    status.textContent = message;
  }

  async function inspectSelection() {
    result.hidden = true;
    parent.disabled = true;
    camera.disabled = true;
    submit.disabled = true;
    setStatus("loading", "Đang kiểm tra quyền xem…");
    try {
      const report = await service.inspectCameraAccess(parent.value, camera.value);
      if (!main.isConnected) return;
      result.innerHTML = renderAccessReport(report);
      result.hidden = false;
      setStatus("ready", "Đã tra cứu theo dữ liệu hiện tại.");
    } catch (error) {
      setStatus("error", error.message || "Tra cứu gặp lỗi. Hãy thử lại.");
    } finally {
      parent.disabled = false;
      camera.disabled = false;
      submit.disabled = false;
    }
  }

  form.addEventListener("change", () => {
    result.hidden = true;
    submit.disabled = !parent.value || !camera.value;
    setStatus("idle", submit.disabled ? "Chọn một phụ huynh và một camera để bắt đầu." : "Chọn Tra cứu để xem kết quả.");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const target = lookupHref(parent.value, camera.value);
    if (location.hash !== target) history.replaceState(history.state, "", target);
    inspectSelection();
  });

  parent.value = selectedParent || "";
  camera.value = selectedCamera || "";
  submit.disabled = !parent.value || !camera.value;
  if ((query.has("parentId") && !parent.value) || (query.has("cameraId") && !camera.value)) {
    setStatus("error", "Liên kết chứa mã phụ huynh hoặc camera không hợp lệ. Chọn lại để tra cứu.");
  } else if (!submit.disabled) {
    await inspectSelection();
  }
}

function renderAccessReport({ parent, camera, decision, studentEvidence, canPlay }) {
  const h = app.html;
  const reasons = {
    GRANTED: "Ít nhất một học sinh đang học tại lớp được gán camera.",
    ACCOUNT_LOCKED: "Quyền xem của tài khoản đang bị khóa.",
    NO_LINKED_STUDENTS: "Tài khoản chưa liên kết với học sinh.",
    NO_ACTIVE_STUDENTS: "Tài khoản hiện không có học sinh đang học.",
    CAMERA_UNASSIGNED: "Camera chưa được gán cho lớp nào.",
    NO_MATCHING_CLASS: "Các lớp đang học nằm ngoài phạm vi camera này."
  };
  const granted = decision === "GRANTED";
  const deviceStatus = camera.enabled ? app.status(camera.connectionStatus === "online") : "Đã tắt";
  const linkedClasses = camera.classes.map(({ name }) => h(name)).join(", ");
  const playbackNote = camera.enabled && camera.connectionStatus === "online" && !canPlay
    ? (granted ? "Nguồn video diễn tập hiện chưa sẵn sàng." : "Phiên phát cần quyền xem của tài khoản đã chọn.")
    : "";
  return `
    <div class="lookup-result-heading">
      <h2 id="lookup-result-heading">Kết quả tra cứu</h2>
      <p class="small muted">${h(parent.displayName)} · ${h(camera.name)}</p>
    </div>
    <div class="lookup-decisions">
      <div class="lookup-decision" id="lookup-decision" data-decision="${h(decision)}">
        <h3>Quyền xem</h3>
        <span class="badge badge-${granted ? "online" : "offline"}">${granted ? "Được cấp quyền" : "Từ chối"}</span>
        <p class="small">${h(reasons[decision])}</p>
      </div>
      <div class="lookup-decision" id="lookup-playback" data-can-play="${canPlay}">
        <h3>Khả năng phát video</h3>
        <span class="badge badge-${canPlay ? "online" : "offline"}">${canPlay ? "Có thể phát" : "Chưa thể phát"}</span>
        <p class="small">Thiết bị · ${h(deviceStatus)}</p>
        ${playbackNote ? `<p class="small muted">${h(playbackNote)}</p>` : ""}
      </div>
    </div>
    <p class="small lookup-camera-classes"><strong>Lớp được gán camera</strong> · ${linkedClasses || "Chưa gán lớp"}</p>
    <div class="lookup-students">
      <h3>Học sinh liên kết</h3>
      <div id="lookup-evidence">${studentEvidence.length ? `
        <ul class="lookup-evidence-list">${studentEvidence.map((student) => `
          <li data-student-id="${h(student.id)}" data-counts="${student.counts}">
            <div>
              <strong>${h(student.name)}</strong>
              <p class="small muted">${h(student.id)} · ${h(student.className || student.classId || "Chưa xếp lớp")} · ${student.status === "active" ? "Đang học" : "Đã nghỉ học"}</p>
            </div>
            ${student.counts ? '<span class="badge badge-online">Căn cứ cấp quyền</span>' : ""}
          </li>`).join("")}</ul>` : '<p class="small muted">Tài khoản chưa liên kết với học sinh.</p>'}</div>
    </div>`;
}

function renderAdminStudents(main, data) {
  const h = app.html;
  main.innerHTML = `
    <div class="screen-heading"><h1>Học sinh & lớp</h1><p>Cập nhật lớp hiện tại và trạng thái học để tính lại quyền xem.</p></div>
    <div class="class-grid">${data.classes.map((item) => {
      const enrolled = data.students.filter((student) => student.active && student.classId === item.id).length;
      const assigned = data.cameras.filter((camera) => camera.classIds.includes(item.id)).length;
      return `<button class="panel class-tile" type="button" data-class="${h(item.id)}" aria-pressed="false">
        <strong>Lớp ${h(item.name)}</strong><span class="small muted">${h(item.location)}</span><span class="small">${enrolled} học sinh · ${assigned} camera</span>
      </button>`;
    }).join("")}</div>
    <section class="panel records-panel screen-section" aria-labelledby="student-heading">
      <div class="section-bar"><h2 id="student-heading">Hồ sơ học sinh</h2><span class="badge" id="record-count" role="status"></span></div>
      <div class="record-tools">
        <label><span>Tìm hồ sơ</span><input class="field" type="search" id="record-search" placeholder="Tên, mã, lớp hoặc phụ huynh"></label>
        <label><span>Lớp</span><select class="field field-select" id="record-filter"><option value="">Tất cả lớp</option>${classOptions(data.classes)}</select></label>
      </div>
      <div id="record-list"></div>
    </section>`;

  const search = main.querySelector("#record-search");
  const filter = main.querySelector("#record-filter");
  const tiles = [...main.querySelectorAll(".class-tile")];
  const list = main.querySelector("#record-list");
  function update() {
    const query = adminSearch(search.value);
    const students = data.students.map((student) => ({
      ...student,
      parents: data.parents.filter((parent) => parent.studentIds.includes(student.id))
    })).filter((student) =>
      (!filter.value || student.classId === filter.value) &&
      adminSearch([student.name, student.id, student.classId, ...student.parents.map((parent) => parent.name)].join(" ")).includes(query)
    );
    tiles.forEach((tile) => tile.setAttribute("aria-pressed", String(tile.dataset.class === filter.value)));
    main.querySelector("#record-count").textContent = `${students.length} học sinh`;
    list.innerHTML = students.length ? `
      <table class="record-table">
        <thead><tr><th scope="col">Học sinh</th><th scope="col">Lớp</th><th scope="col">Phụ huynh</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
        <tbody>${students.map((student) => `
          <tr>
            <th scope="row"><strong>${h(student.name)}</strong><span class="small muted record-meta">${h(student.id)}</span></th>
            <td data-label="Lớp">${h(student.classId || "Chưa xếp lớp")}</td>
            <td data-label="Phụ huynh">${h(student.parents.map((parent) => parent.name).join(", ") || "Chưa liên kết")}</td>
            <td data-label="Trạng thái"><span class="badge badge-${student.active ? "online" : "offline"}">${student.active ? "Đang học" : "Đã nghỉ học"}</span></td>
            <td><button class="button button-secondary record-action" data-edit-student="${h(student.id)}" aria-label="Cập nhật ${h(student.name)}">Cập nhật</button></td>
          </tr>`).join("")}</tbody>
      </table>` : '<p class="empty-panel muted">Không tìm thấy hồ sơ phù hợp.</p>';
  }
  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-student]");
    if (button) editStudent(data, button.dataset.editStudent, { search: search.value, filter: filter.value });
  });
  tiles.forEach((tile) => tile.addEventListener("click", () => {
    filter.value = filter.value === tile.dataset.class ? "" : tile.dataset.class;
    update();
  }));
  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  update();
}

function classOptions(classes, selected = "") {
  return classes.map((item) => `<option value="${app.html(item.id)}" ${item.id === selected ? "selected" : ""}>Lớp ${app.html(item.name)}</option>`).join("");
}

function editStudent(data, studentId, filters) {
  const student = data.students.find((item) => item.id === studentId);
  const dialog = app.showDialog(`Cập nhật ${student.name}`, `
    <form id="record-edit">
      <div class="dialog-fields">
        <label><span>Lớp hiện tại</span><select class="field field-select" name="classId"><option value="" ${student.classId ? "" : "selected"}>Chưa xếp lớp</option>${classOptions(data.classes, student.classId)}</select></label>
        <label><span>Trạng thái học</span><select class="field field-select" name="active">
          <option value="active" ${student.active ? "selected" : ""}>Đang học</option>
          <option value="inactive" ${student.active ? "" : "selected"}>Đã nghỉ học</option>
        </select></label>
      </div>
      ${adminSaveControls()}
    </form>`);
  connectAdminEditor(dialog, (values, preview) =>
    service.setStudentEnrollment(studentId, { classId: values.get("classId") || null, status: values.get("active") }, preview),
    "Đã cập nhật hồ sơ và tính lại quyền.", filters, `[data-edit-student="${studentId}"]`);
}

function renderAdminCameras(main, data) {
  const h = app.html;
  main.innerHTML = `
    <div class="screen-heading"><h1>Danh mục camera</h1><p>Gán camera cho một hoặc nhiều lớp và theo dõi trạng thái thiết bị.</p></div>
    <section class="panel records-panel">
      <div class="section-bar"><h2>Thiết bị</h2><span id="record-count" class="badge" role="status"></span></div>
      <div class="record-tools">
        <label><span>Tìm camera</span><input class="field" type="search" id="record-search" placeholder="Tên, mã hoặc vị trí"></label>
        <label><span>Trạng thái</span><select class="field field-select" id="record-filter">
          <option value="">Tất cả trạng thái</option><option value="online">Hoạt động</option><option value="offline">Ngoại tuyến</option>
        </select></label>
      </div>
      <div id="record-list"></div>
    </section>`;
  // Khối "Nguồn để thử tích hợp" (links WVCams / NPS / Apple HLS) đã được loại bỏ khỏi giao diện theo yêu cầu dọn dẹp UI.
  // Nếu cần khôi phục cho buổi demo tích hợp, thêm lại section.source-panel vào innerHTML ở trên,
  // ngay sau section.records-panel (tham khảo backup tại ANTI_HANDOFF.md).
  const search = main.querySelector("#record-search");
  const filter = main.querySelector("#record-filter");
  const list = main.querySelector("#record-list");
  function update() {
    const query = adminSearch(search.value);
    const cameras = data.cameras.filter((camera) =>
      (!filter.value || camera.online === (filter.value === "online")) &&
      adminSearch([camera.name, camera.id, camera.location, ...camera.classIds].join(" ")).includes(query)
    );
    main.querySelector("#record-count").textContent = `${cameras.length} camera`;
    list.innerHTML = cameras.length ? `<div class="device-list">${cameras.map((camera) => `
      <article class="device-row">
        <img src="assets/images/${h(camera.image)}" alt="" width="724" height="724">
        <div><h3>${h(camera.name)}</h3><p class="small muted">${h(camera.location)}</p></div>
        <div class="device-classes">${camera.classIds.length
          ? camera.classIds.map((id) => `<span class="badge">Lớp ${h(id)}</span>`).join("")
          : '<span class="small muted">Chưa gán lớp</span>'}</div>
        <span class="badge badge-status badge-${camera.online ? "online" : "offline"}">${app.status(camera.online)}</span>
        <button class="button button-secondary record-action" data-edit-camera="${h(camera.id)}" aria-label="Cấu hình ${h(camera.name)}">Cấu hình</button>
      </article>`).join("")}</div>` : '<p class="empty-panel muted">Không tìm thấy camera phù hợp.</p>';
  }
  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-camera]");
    if (button) editCamera(data, button.dataset.editCamera, { search: search.value, filter: filter.value });
  });
  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  update();
}

function editCamera(data, cameraId, filters) {
  const h = app.html;
  const camera = data.cameras.find((item) => item.id === cameraId);
  const dialog = app.showDialog(camera.name, `
    <form id="record-edit">
      <fieldset class="camera-class-options"><legend>Lớp được cấp camera</legend>
        ${data.classes.map((item) => `<label>
          <input type="checkbox" name="classes" value="${h(item.id)}" ${camera.classIds.includes(item.id) ? "checked" : ""}>
          Lớp ${h(item.name)}
        </label>`).join("")}
      </fieldset>
      <label class="dialog-field"><span>Trạng thái camera demo</span><select class="field field-select" name="online">
        <option value="online" ${camera.online ? "selected" : ""}>Hoạt động</option>
        <option value="offline" ${camera.online ? "" : "selected"}>Ngoại tuyến</option>
      </select></label>
      ${adminSaveControls()}
    </form>`);
  connectAdminEditor(dialog, (values, preview) =>
    service.configureCamera(cameraId, values.getAll("classes"), values.get("online") === "online", preview),
    "Đã lưu cấu hình camera.", filters, `[data-edit-camera="${cameraId}"]`);
}

function renderAdminAccounts(main, data) {
  const h = app.html;
  main.innerHTML = `
    <div class="screen-heading heading-actions">
      <div><h1>Tài khoản demo</h1><p>Quản lý hồ sơ phụ huynh mẫu và liên kết học sinh.</p></div>
      <button class="button" type="button" id="add-account">Tạo tài khoản</button>
    </div>
    <section class="panel records-panel">
      <div class="section-bar"><h2>Phụ huynh</h2><span class="badge">${data.parents.length} tài khoản</span></div>
      <div class="accounts-list">${data.parents.map((parent) => {
        const view = data.parentSummaries.find((item) => item.parent.id === parent.id);
        return `<article class="account-row">
          <div class="account-identity">
            <span class="account-avatar" aria-hidden="true">${h(app.initials(parent.name))}</span>
            <div><h3>${h(parent.name)}</h3><p class="small muted">${h(parent.username || parent.email)}</p></div>
          </div>
          <div class="account-connections"><p class="small">${view.students.map((student) => h(student.name)).join(", ") || "Chưa liên kết học sinh"}</p><p class="muted small">${view.cameras.length} camera được cấp</p></div>
          <div class="account-actions">
            <a class="button button-secondary record-action" href="${h(lookupHref(parent.id, view.cameras[0]?.id || data.cameras[0]?.id))}" aria-label="Tra cứu quyền của ${h(parent.name)}">Tra cứu quyền</a>
            <button class="button button-secondary record-action" data-lock-account="${h(parent.id)}">${parent.accessEnabled === false ? "Mở quyền" : "Khóa quyền"}</button>
            <button class="button button-secondary record-action" data-edit-account="${h(parent.id)}">Sửa</button>
          </div>
        </article>`;
      }).join("")}</div>
    </section>`;
  main.querySelector("#add-account").addEventListener("click", () => editParentAccount(data));
  main.querySelector(".accounts-list").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-account]");
    const lock = event.target.closest("[data-lock-account]");
    if (edit) editParentAccount(data, data.parents.find((parent) => parent.id === edit.dataset.editAccount));
    if (lock) confirmParentAccess(data.parents.find((parent) => parent.id === lock.dataset.lockAccount));
  });
}

function confirmParentAccess(parent) {
  const enable = parent.accessEnabled === false;
  const dialog = app.showDialog(enable ? "Mở quyền xem" : "Khóa quyền xem", `
    <p>${app.html(parent.name)} · ${enable ? "Quyền sẽ tính lại từ các lớp đang học." : "Tài khoản này sẽ mất quyền xem camera. Các phụ huynh khác vẫn giữ quyền theo lớp."}</p>
    <div class="dialog-footer"><button type="button" id="confirm-account-access" class="button">Xác nhận</button></div>`);
  dialog.querySelector("#confirm-account-access").addEventListener("click", async () => {
    try {
      await service.setParentAccess(parent.id, enable);
      dialog.close();
      await app.render(false);
      app.flash(enable ? "Đã mở quyền xem." : "Đã khóa quyền xem.");
    } catch (failure) { app.flash(failure.message); }
  });
}

function editParentAccount(data, parent) {
  const h = app.html;
  const dialog = app.showDialog(parent ? "Chỉnh sửa tài khoản mẫu" : "Tạo tài khoản mẫu", `
    <form id="account-edit">
      <div class="account-fields">
        <label class="dialog-field"><span>Họ và tên</span><input class="field" name="name" required maxlength="80" value="${h(parent?.name)}"></label>
        <label class="dialog-field"><span>Email mẫu</span><input class="field" name="email" type="email" required maxlength="120" placeholder="phuhuynh@example.test" value="${h(parent?.email)}"></label>
      </div>
      <fieldset class="camera-class-options account-students">
        <legend>Học sinh liên kết</legend>
        ${data.students.map((student) => `<label>
          <input type="checkbox" name="students" value="${h(student.id)}" ${parent?.studentIds.includes(student.id) ? "checked" : ""}>
          ${h(student.name)} · ${h(student.classId)}
        </label>`).join("")}
      </fieldset>
      <p class="error" id="account-error" role="alert"></p>
      <div class="dialog-footer"><button class="button" type="submit">Lưu tài khoản</button></div>
    </form>`);
  const form = dialog.querySelector("#account-edit");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    try {
      const result = await service.saveParentAccount({
        id: parent?.id, name: values.get("name"), email: values.get("email"), studentIds: values.getAll("students")
      });
      dialog.close();
      await app.render(false);
      app.root.querySelector(`[data-edit-account="${result.id}"]`)?.focus();
      app.flash(result.persisted ? "Đã lưu tài khoản trên trình duyệt này." : "Tài khoản đã lưu tạm trong phiên đang mở.");
    } catch (failure) {
      dialog.querySelector("#account-error").textContent = failure.message;
    }
  });
}

function adminSaveControls() {
  return `<div class="impact-preview"><h3>Ảnh hưởng đến quyền xem</h3><div id="permission-impact" aria-live="polite"></div></div>
    <div class="dialog-footer"><button class="button" id="save-record" type="submit">Lưu thay đổi</button></div>`;
}

function connectAdminEditor(dialog, change, message, filters, actionSelector) {
  const form = dialog.querySelector("#record-edit");
  const save = form.querySelector("#save-record");
  const original = new URLSearchParams(new FormData(form)).toString();
  async function preview() {
    const values = new FormData(form);
    save.disabled = new URLSearchParams(values).toString() === original;
    const target = form.querySelector("#permission-impact");
    try { target.innerHTML = renderImpact(await change(values, true)); }
    catch (failure) { target.textContent = failure.message; }
  }
  preview();
  form.addEventListener("change", preview);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (save.disabled) return;
    try {
      if (await change(new FormData(form), false) === null) return;
    } catch (failure) {
      form.querySelector("#permission-impact").textContent = failure.message;
      return;
    }
    dialog.close();
    await app.render(false);
    const search = app.root.querySelector("#record-search");
    const filter = app.root.querySelector("#record-filter");
    search.value = filters.search;
    filter.value = filters.filter;
    filter.dispatchEvent(new Event("change"));
    (app.root.querySelector(actionSelector) || search).focus();
    app.flash(message);
  });
}

function renderImpact(impact, lookupLinks = false) {
  const h = app.html;
  if (!impact?.length) return '<p class="small muted">Quyền xem của phụ huynh giữ nguyên.</p>';
  function camerasFor(parent, cameras) {
    return cameras.map((camera) => lookupLinks
      ? `<a class="impact-lookup" href="${h(lookupHref(parent.id, camera.id))}" aria-label="Tra cứu quyền hiện tại của ${h(parent.name)} với ${h(camera.name)}">${h(camera.name)}</a>`
      : h(camera.name)).join(", ");
  }
  return `<ul class="impact-list">${impact.map(({ parent, granted, revoked }) => `
    <li><strong>${h(parent.name)}</strong>
      ${granted.length ? `<span class="access-granted">Cấp quyền · ${camerasFor(parent, granted)}</span>` : ""}
      ${revoked.length ? `<span class="access-revoked">Thu hồi · ${camerasFor(parent, revoked)}</span>` : ""}
    </li>`).join("")}</ul>`;
}

function activityList(items) {
  const h = app.html;
  const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" });
  return items.length ? `<div class="activity-list">${items.map((entry) => `
    <article class="panel activity-card">
      <div class="section-bar"><h3>${h(entry.subject)}</h3><span class="badge">${h(entry.type)}</span></div>
      <p><span class="muted">Từ</span> ${h(entry.before)} <span class="muted">sang</span> ${h(entry.after)}</p>
      ${entry.changes?.length ? renderSchoolSyncChanges(entry.changes) : ""}
      ${renderImpact(entry.impact, true)}
      <p class="activity-meta small muted">${h(entry.actor)} · <time datetime="${h(entry.at)}">${date.format(new Date(entry.at))}</time></p>
    </article>`).join("")}</div>`
    : '<div class="panel empty-panel"><h3>Chưa có thay đổi</h3><p class="muted">Các lượt đồng bộ hồ sơ, cập nhật lớp và cấu hình camera sẽ xuất hiện ở đây.</p></div>';
}

function renderAdminActivity(main, data) {
  main.innerHTML = `
    <div class="screen-heading"><h1>Nhật ký thay đổi</h1><p>Theo dõi các cập nhật và tài khoản phụ huynh bị ảnh hưởng trong phiên demo.</p></div>
    ${activityList(data.activity)}`;
}
