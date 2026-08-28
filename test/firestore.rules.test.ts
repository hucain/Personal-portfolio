/**
 * Firestore Security Rules test suite.
 *
 * Run against the Firebase Emulator. Uses Node's built-in test runner
 * (`node:test`), so no separate test framework is required beyond
 * `@firebase/rules-unit-testing` and the Firebase CLI emulator.
 *
 * Usage:
 *   firebase emulators:exec --only firestore  "node --test --experimental-vm-modules test/firestore.rules.test.mjs"
 * (compile first, or run with tsx/vitest if preferred — see SECURITY.md.)
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "portfolio-8be6c";

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: "firestore.rules" },
  });
});

after(async () => {
  await testEnv.cleanup();
});

const unauthed = () => testEnv.unauthenticatedContext().firestore();
const nonAdmin = () =>
  testEnv.authenticatedContext("non-admin-uid", { email: "someone@else.com" }).firestore();
const adminClaim = () =>
  testEnv.authenticatedContext("admin-uid", { admin: true }).firestore();

const validMessage = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Hello",
  type: "A project",
  message: "I would love to talk about building a site together.",
  createdAt: new Date(),
  replied: false,
  reply: "",
};

async function expectSucceed(p: Promise<unknown>) {
  await p; // rejections from rules are surfaced as errors by the emulator
}

async function expectReject(p: Promise<unknown>) {
  let threw = false;
  try {
    await p;
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "expected operation to be denied by rules");
}

// ---------------------------------------------------------------
// Anonymous
// ---------------------------------------------------------------
test("anonymous CAN read public portfolio collections", async () => {
  const db = unauthed();
  for (const col of ["projects", "stack", "workRoles", "workFocus", "certificates"]) {
    await expectSucceed(db.collection(col).get());
  }
});

test("anonymous CANNOT modify portfolio documents", async () => {
  const db = unauthed();
  await expectReject(
    db.collection("projects").add({ title: "x", detail: "y", status: "live", href: "", order: 0 }),
  );
  await expectReject(db.collection("stack").doc("html5").set({ name: "x" }));
  await expectReject(db.collection("workRoles").doc("r").set({ title: "x" }));
  await expectReject(db.collection("certificates").doc("c").set({ title: "x" }));
});

test("anonymous CANNOT read messages", async () => {
  await expectReject(unauthed().collection("messages").get());
});

test("anonymous CAN create a valid message", async () => {
  await expectSucceed(unauthed().collection("messages").add({ ...validMessage }));
});

test("anonymous CANNOT set replied=true", async () => {
  await expectReject(unauthed().collection("messages").add({ ...validMessage, replied: true }));
});

test("anonymous CANNOT add an admin reply", async () => {
  await expectReject(unauthed().collection("messages").add({ ...validMessage, reply: "admin" }));
});

test("anonymous CANNOT add unknown fields", async () => {
  await expectReject(unauthed().collection("messages").add({ ...validMessage, isAdmin: true }));
});

test("anonymous CANNOT submit invalid field types", async () => {
  const db = unauthed();
  await expectReject(db.collection("messages").add({ ...validMessage, name: 42 }));
  await expectReject(db.collection("messages").add({ ...validMessage, email: 42 }));
  await expectReject(db.collection("messages").add({ ...validMessage, subject: 42 }));
  await expectReject(db.collection("messages").add({ ...validMessage, message: 42 }));
});

test("anonymous CANNOT submit oversized fields", async () => {
  const db = unauthed();
  await expectReject(db.collection("messages").add({ ...validMessage, name: "x".repeat(100) }));
  await expectReject(db.collection("messages").add({ ...validMessage, email: "x".repeat(300) }));
  await expectReject(db.collection("messages").add({ ...validMessage, subject: "x".repeat(250) }));
  await expectReject(db.collection("messages").add({ ...validMessage, message: "x".repeat(6000) }));
});

test("anonymous CANNOT submit invalid/future/old timestamps", async () => {
  const db = unauthed();
  const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  await expectReject(db.collection("messages").add({ ...validMessage, createdAt: future }));
  const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await expectReject(db.collection("messages").add({ ...validMessage, createdAt: past }));
});

test("anonymous CANNOT update or delete an existing message", async () => {
  const db = unauthed();
  await expectReject(db.collection("messages").doc("msg_x").set({ ...validMessage }));
  await expectReject(db.collection("messages").doc("msg_x").delete());
});

// ---------------------------------------------------------------
// Authenticated non-admin
// ---------------------------------------------------------------
test("non-admin CANNOT modify portfolio or read/update/delete messages", async () => {
  const db = nonAdmin();
  await expectReject(db.collection("projects").add({ title: "x", detail: "y", status: "live", href: "", order: 0 }));
  await expectReject(db.collection("messages").get());
  await expectReject(db.collection("messages").doc("msg_x").update({ replied: true }));
  await expectReject(db.collection("messages").doc("msg_x").delete());
});

// ---------------------------------------------------------------
// Admin (custom claim)
// ---------------------------------------------------------------
test("admin CAN manage portfolio data", async () => {
  const db = adminClaim();
  const ref = await db.collection("projects").add({ title: "P", detail: "D", status: "live", href: "", order: 0 });
  await expectSucceed(ref.update({ title: "P2" }));
  await expectSucceed(ref.delete());
});

test("admin CAN read messages", async () => {
  await expectSucceed(adminClaim().collection("messages").get());
});

test("admin CAN update only reply/replied/repliedAt", async () => {
  const db = adminClaim();
  await expectSucceed(
    db.collection("messages").doc("msg_x").update({ reply: "Thanks", replied: true, repliedAt: new Date() }),
  );
});

test("admin CANNOT modify protected contact fields when replying", async () => {
  const db = adminClaim();
  await expectReject(db.collection("messages").doc("msg_x").update({ name: "hacker" }));
  await expectReject(db.collection("messages").doc("msg_x").update({ email: "hacker@x.com" }));
  await expectReject(db.collection("messages").doc("msg_x").update({ message: "changed" }));
});

test("admin CAN delete messages", async () => {
  await expectSucceed(adminClaim().collection("messages").doc("msg_x").delete());
});

// ---------------------------------------------------------------
// Malicious input
// ---------------------------------------------------------------
test("rejects XSS and unknown fields", async () => {
  const db = unauthed();
  await expectReject(
    db.collection("messages").add({ ...validMessage, message: "<script>alert(1)</script>" }),
  );
  await expectReject(db.collection("messages").add({ ...validMessage, uid: "abc123" }));
});
