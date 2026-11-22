"use strict";

async function renderProfile(main) {
  const h = app.html;
  const user = await service.getMyProfile();
  main.innerHTML = `
    <div class="screen-heading"><h1>Hồ sơ và cài đặt</h1><p>Thông tin liên hệ của tài khoản demo.</p></div>
    <section class="panel profile-panel">
      <div class="profile-identity"><span class="account-avatar" aria-hidden="true">${h(app.initials(user.displayName))}</span>
        <div><h2>${h(user.displayName)}</h2><p class="muted small">${h(user.username)} · ${user.role === "admin" ? "Quản trị" : "Phụ huynh"}</p></div></div>
      <form id="profile-form" class="profile-form">
        <label class="dialog-field"><span>Tên hiển thị</span><input class="field" name="displayName" required minlength="2" maxlength="60" value="${h(user.displayName)}"></label>
        <label class="dialog-field"><span>Email liên hệ</span><input class="field" name="email" type="email" required value="${h(user.email)}"></label>
        <label class="dialog-field"><span>Số điện thoại</span><input class="field" name="phone" type="tel" inputmode="numeric" required pattern="0[0-9]{9}" value="${h(user.phone)}"></label>
        <p id="profile-error" class="error" role="alert"></p>
        <button class="button" type="submit">Lưu hồ sơ</button>
      </form>
    </section>`;
  const form = main.querySelector("#profile-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    main.querySelector("#profile-error").textContent = "";
    try {
      await service.updateMyProfile(Object.fromEntries(new FormData(form)));
      await app.render(false);
      app.flash("Đã lưu thông tin hồ sơ.");
    } catch (failure) {
      main.querySelector("#profile-error").textContent = failure.message;
    }
  });
}
