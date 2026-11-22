"use strict";

async function renderLogin() {
  const template = document.querySelector("#login-template");
  app.root.replaceChildren(template.content.cloneNode(true));
  const form = app.root.querySelector("#login-form");
  const account = app.root.querySelector("#demo-account");
  const error = app.root.querySelector("#login-error");
  const button = form.querySelector("button");
  const username = form.elements.username;
  for (const entry of await service.listDemoAccounts()) account.add(new Option(`${entry.name} · ${entry.username}`, entry.username));
  account.addEventListener("change", () => {
    if (account.value) {
      username.value = account.value;
      form.elements.password.focus();
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    button.disabled = true;
    try {
      const user = await service.login({ username: username.value, password: form.elements.password.value });
      location.hash = user.role === "admin" ? "/quan-tri" : "/phu-huynh";
    } catch (failure) {
      error.textContent = failure.message;
    } finally {
      button.disabled = false;
    }
  });
}
