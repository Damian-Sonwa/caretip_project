import test from "node:test";
import assert from "node:assert/strict";

const MOBILE_MENU_DISMISS_GUARD_MS = 400;
const MOBILE_MENU_TOGGLE_DEBOUNCE_MS = 250;

function canDismissMobileMenuOverlay(openedAt, now = performance.now()) {
  return now - openedAt >= MOBILE_MENU_DISMISS_GUARD_MS;
}

function canAcceptMobileMenuToggle(lastToggleAt, now = performance.now()) {
  return now - lastToggleAt >= MOBILE_MENU_TOGGLE_DEBOUNCE_MS;
}

test("guard window is 400ms", () => {
  assert.equal(MOBILE_MENU_DISMISS_GUARD_MS, 400);
});

test("toggle debounce window is 250ms", () => {
  assert.equal(MOBILE_MENU_TOGGLE_DEBOUNCE_MS, 250);
});

test("backdrop/toggle blocked inside guard window", () => {
  const openedAt = performance.now();
  assert.equal(canDismissMobileMenuOverlay(openedAt), false);
  assert.equal(canDismissMobileMenuOverlay(openedAt - 200), false);
});

test("backdrop/toggle allowed after guard window", () => {
  const openedAt = performance.now() - MOBILE_MENU_DISMISS_GUARD_MS;
  assert.equal(canDismissMobileMenuOverlay(openedAt), true);
});

test("rapid toggles blocked inside debounce window", () => {
  const lastToggleAt = performance.now();
  assert.equal(canAcceptMobileMenuToggle(lastToggleAt), false);
  assert.equal(canAcceptMobileMenuToggle(lastToggleAt - 100), false);
});

test("toggle allowed after debounce window", () => {
  const lastToggleAt = performance.now() - MOBILE_MENU_TOGGLE_DEBOUNCE_MS;
  assert.equal(canAcceptMobileMenuToggle(lastToggleAt), true);
});
