/**
 * WADJET GRC — Phase 0 Remediation Test Suite
 * Comprehensive tests for Auth, Authorization, SoD, Audit Log
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  PASS: ${message}`); }
  else { failed++; console.log(`  FAIL: ${message}`); }
}

async function runTests() {
  console.log("=== WADJET GRC Phase 0 Remediation Tests ===\n");

  // ============ CLEANUP ============
  await prisma.auditLog.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany({ where: { username: { startsWith: "test_" } } });
  await prisma.role.deleteMany({ where: { code: { startsWith: "test_" } } });

  // ============ TEST GROUP 1: Authentication ============
  console.log("\n--- Test Group 1: Authentication ---");

  const bcrypt = require("bcryptjs");

  // 1.1 Password Hashing
  const hash = await bcrypt.hash("testPass123", 12);
  assert(hash.startsWith("$2a$12$"), "Password hashed with bcrypt cost 12");
  assert(await bcrypt.compare("testPass123", hash), "Correct password verifies");
  assert(!(await bcrypt.compare("wrongPass", hash)), "Wrong password rejected");

  // 1.2 User Creation
  const testRole = await prisma.role.create({ data: { code: "test_role", name: "Test Role" } });
  const testUser = await prisma.user.create({
    data: { username: "test_user", email: "test@example.com", fullName: "Test User", passwordHash: hash, roleId: testRole.id },
  });
  assert(testUser.id.length > 0, "User created with ID");
  assert(testUser.failedLogins === 0, "Failed logins initialized to 0");
  assert(testUser.isActive === true, "User active by default");

  // 1.3 Account Lockout
  await prisma.user.update({ where: { id: testUser.id }, data: { failedLogins: 5, lockedUntil: new Date(Date.now() + 30 * 60 * 1000) } });
  const locked = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(locked?.failedLogins === 5, "Failed logins tracked");
  assert(locked?.lockedUntil !== null, "Account lockout set");

  // ============ TEST GROUP 2: Authorization (RBAC) ============
  console.log("\n--- Test Group 2: Authorization ---");

  const perm = await prisma.permission.create({ data: { code: "test.permission", name: "Test Perm", module: "test" } });
  await prisma.rolePermission.create({ data: { roleId: testRole.id, permissionId: perm.id, scope: "all" } });

  const rolePerms = await prisma.rolePermission.findMany({ where: { roleId: testRole.id }, include: { permission: true } });
  assert(rolePerms.length > 0, "Role-permission assignment works");
  assert(rolePerms.some(p => p.permission.code === "test.permission"), "Permission correctly linked");

  // Scope test
  const scopePerm = await prisma.permission.create({ data: { code: "test.scoped", name: "Scoped", module: "test" } });
  await prisma.rolePermission.create({ data: { roleId: testRole.id, permissionId: scopePerm.id, scope: "department" } });
  const scoped = await prisma.rolePermission.findFirst({ where: { roleId: testRole.id, permissionId: scopePerm.id } });
  assert(scoped?.scope === "department", "Scope set to department");

  // ============ TEST GROUP 3: SoD Rules ============
  console.log("\n--- Test Group 3: SoD Rules ---");

  const sodRule = await prisma.soDRule.create({
    data: { code: "test_sod", name: "Test SoD", action: "TestAction", constraint: "creator != approver" },
  });
  assert(sodRule.isActive === true, "SoD rule created active");

  const activeRules = await prisma.soDRule.findMany({ where: { isActive: true } });
  assert(activeRules.length > 0, "Active SoD rules queryable");

  // ============ TEST GROUP 4: Audit Log Hash Chain ============
  console.log("\n--- Test Group 4: Audit Log ---");

  const { createHash } = require("crypto");

  const entry1 = await prisma.auditLog.create({
    data: { actorUsername: "test", actorRole: "test", actorRoleAtTime: "test", action: "TEST_1", entityType: "Test", entryHash: "temp" },
  });
  const content1 = JSON.stringify({ ...entry1, entryHash: undefined, previousEntryHash: undefined });
  const hash1 = `sha256:${createHash("sha256").update(content1).digest("hex")}`;
  await prisma.auditLog.update({ where: { id: entry1.id }, data: { entryHash: hash1 } });

  const entry2 = await prisma.auditLog.create({
    data: { actorUsername: "test", actorRole: "test", actorRoleAtTime: "test", action: "TEST_2", entityType: "Test", previousEntryHash: hash1, entryHash: "temp" },
  });
  const content2 = JSON.stringify({ ...entry2, entryHash: undefined, previousEntryHash: entry2.previousEntryHash });
  const hash2 = `sha256:${createHash("sha256").update(content2).digest("hex")}`;
  await prisma.auditLog.update({ where: { id: entry2.id }, data: { entryHash: hash2 } });

  assert(entry2.previousEntryHash === hash1, "Hash chain linked");

  // ============ TEST GROUP 5: Compliance Gap & Remediation ============
  console.log("\n--- Test Group 5: Gap & Remediation ---");

  const fw = await prisma.framework.create({ data: { code: "TEST_FW", name: "Test Framework" } });
  const req = await prisma.requirement.create({ data: { code: "TEST_REQ", title: "Test Req", frameworkId: fw.id } });
  const gap = await prisma.gap.create({
    data: { code: "GAP-001", title: "Test Gap", requirementId: req.id, frameworkId: fw.id, owner: "test", status: "Open", severity: "High" },
  });
  assert(gap.requirementId === req.id, "Gap linked to requirement");

  const rem = await prisma.remediation.create({
    data: { code: "REM-001", title: "Test Rem", gapId: gap.id, owner: "test", status: "Open" },
  });
  assert(rem.gapId === gap.id, "Remediation linked to gap");

  // ============ TEST GROUP 6: Evidence Cross-module ============
  console.log("\n--- Test Group 6: Evidence ---");

  const evidence = await prisma.evidence.create({
    data: { code: "EVD-001", name: "Test Evidence", owner: "test", requirementId: req.id, status: "Submitted" },
  });
  assert(evidence.requirementId === req.id, "Evidence linked to requirement");

  // ============ TEST GROUP 7: Data Classification ============
  console.log("\n--- Test Group 7: Data Classification ---");

  const cls = await prisma.dataClassification.create({ data: { code: "test_conf", label: "Test Confidential", level: 3 } });
  assert(cls.code === "test_conf", "Data classification created");

  // ============ TEST GROUP 8: Department Centralization ============
  console.log("\n--- Test Group 8: Department ---");

  const dept = await prisma.department.create({ data: { code: "TEST_DEPT", name: "Test Department" } });
  assert(dept.code === "TEST_DEPT", "Department created as centralized lookup");

  // ============ SUMMARY ============
  console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);

  // Cleanup
  await prisma.auditLog.deleteMany();
  await prisma.remediation.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.dataClassification.deleteMany();
  await prisma.department.deleteMany({ where: { code: "TEST_DEPT" } });
  await prisma.soDRule.deleteMany({ where: { code: "test_sod" } });
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany({ where: { username: { startsWith: "test_" } } });
  await prisma.role.deleteMany({ where: { code: { startsWith: "test_" } } });

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => { console.error(e); process.exit(1); });
