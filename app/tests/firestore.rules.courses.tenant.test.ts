import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { setDoc, getDoc, doc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "tinysteps-react-v1";
const RULES = readFileSync("firestore.rules", "utf8");

function adminCtx() {
  return testEnv.authenticatedContext("admin-uid", { role: "admin" }).firestore();
}
function parentCtx() {
  return testEnv.authenticatedContext("parent-uid", { role: "parent" }).firestore();
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES },
  });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "tenants/demoTenant/courses/phonicsL1"), {
      title: "Phonics - Foundations",
      category: "phonics",
      level: "L1",
      sortOrder: 10,
      active: true,
    });
    await setDoc(doc(db, "tenants/demoTenant/lessons/l1"), {
      title: "L1",
      minutes: 15,
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("admin can read tenant course", async () => {
  const db = adminCtx();
  await assertSucceeds(getDoc(doc(db, "tenants/demoTenant/courses/phonicsL1")));
});

test("parent can read tenant course", async () => {
  const db = parentCtx();
  await assertSucceeds(getDoc(doc(db, "tenants/demoTenant/courses/phonicsL1")));
});

test("parent cannot write tenant course", async () => {
  const db = parentCtx();
  await assertFails(
    setDoc(doc(db, "tenants/demoTenant/courses/newBad"), {
      title: "Should fail",
      category: "phonics",
      level: "L9",
      sortOrder: 999,
      active: true,
    })
  );
});

test("admin can create valid tenant course", async () => {
  const db = adminCtx();
  await assertSucceeds(
    setDoc(doc(db, "tenants/demoTenant/courses/newOk"), {
      title: "Public Speaking - Level 1",
      category: "public_speaking",
      level: "L1",
      sortOrder: 201,
      active: true,
    })
  );
});

test("admin cannot create invalid tenant course (bad category)", async () => {
  const db = adminCtx();
  await assertFails(
    setDoc(doc(db, "tenants/demoTenant/courses/invalidCat"), {
      title: "Bad Course",
      category: "oops", // invalid per isCourse()
      level: "L0",
      sortOrder: 1,
      active: true,
    })
  );
});

test("admin can read tenant lesson; parent cannot", async () => {
  const dbAdmin = adminCtx();
  await assertSucceeds(getDoc(doc(dbAdmin, "tenants/demoTenant/lessons/l1")));

  const dbParent = parentCtx();
  await assertFails(getDoc(doc(dbParent, "tenants/demoTenant/lessons/l1")));
});
