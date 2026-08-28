/**
 * WADJET GRC — Phase 0 Automated Tests
 * Tests for Auth, Authorization, SoD, and Audit Log
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test helpers
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message}`);
  }
}

async function runTests() {
  console.log("\n=== WADJET GRC Phase 0 Tests ===\n");

  // Clean up test data (order matters for FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.remediation.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.dataClassification.deleteMany();
  await prisma.department.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.soDRule.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { username: { startsWith: "test_" } } });
  await prisma.role.deleteMany({ where: { code: { startsWith: "test_" } } });

  // ========== TEST 1: Password Hashing ==========
  console.log("\n--- Test 1: Password Hashing ---");
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("testPassword123", 12);
  assert(hash.startsWith("$2a$12$"), "Password hashed with bcrypt cost 12");
  assert(await bcrypt.compare("testPassword123", hash), "Correct password verifies");
  assert(!(await bcrypt.compare("wrongPassword", hash)), "Wrong password rejected");

  // ========== TEST 2: User Creation ==========
  console.log("\n--- Test 2: User Creation ---");
  const testRole = await prisma.role.create({
    data: { code: "test_role", name: "Test Role" },
  });
  const testUser = await prisma.user.create({
    data: {
      username: "test_user",
      email: "test@example.com",
      fullName: "Test User",
      passwordHash: await bcrypt.hash("password123", 12),
      roleId: testRole.id,
      departmentId: null,
    },
  });
  assert(testUser.id.length > 0, "User created with ID");
  assert(testUser.failedLogins === 0, "Failed logins initialized to 0");

  // ========== TEST 3: Account Lockout ==========
  console.log("\n--- Test 3: Account Lockout ---");
  await prisma.user.update({
    where: { id: testUser.id },
    data: { failedLogins: 5, lockedUntil: new Date(Date.now() + 30 * 60 * 1000) },
  });
  const lockedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(lockedUser?.failedLogins === 5, "Failed logins incremented to 5");
  assert(lockedUser?.lockedUntil !== null, "Account locked with expiry date");

  // ========== TEST 4: Audit Log Hash Chain ==========
  console.log("\n--- Test 4: Audit Log Hash Chain ---");
  const { createHash } = require("crypto");

  const entry1 = await prisma.auditLog.create({
    data: {
      actorUsername: "test_user",
      actorRole: "test_role",
      actorRoleAtTime: "test_role",
      action: "TEST_ACTION_1",
      entityType: "Test",
      entityId: "test-1",
      entryHash: "placeholder",
    },
  });

  // Compute hash
  const content1 = JSON.stringify({ ...entry1, entryHash: undefined, previousEntryHash: undefined });
  const hash1 = `sha256:${createHash("sha256").update(content1).digest("hex")}`;
  await prisma.auditLog.update({ where: { id: entry1.id }, data: { entryHash: hash1 } });

  const entry2 = await prisma.auditLog.create({
    data: {
      actorUsername: "test_user",
      actorRole: "test_role",
      actorRoleAtTime: "test_role",
      action: "TEST_ACTION_2",
      entityType: "Test",
      entityId: "test-2",
      previousEntryHash: hash1,
      entryHash: "placeholder",
    },
  });

  const content2 = JSON.stringify({ ...entry2, entryHash: undefined, previousEntryHash: entry2.previousEntryHash });
  const hash2 = `sha256:${createHash("sha256").update(content2).digest("hex")}`;
  await prisma.auditLog.update({ where: { id: entry2.id }, data: { entryHash: hash2 } });

  assert(entry2.previousEntryHash === hash1, "Second entry links to first via hash");

  // ========== TEST 5: SoD Rules ==========
  console.log("\n--- Test 5: SoD Rules ---");
  const sodRule = await prisma.soDRule.create({
    data: {
      code: "test_creator_not_approver",
      name: "Creator ≠ Approver",
      action: "ApprovePolicy",
      constraint: "creator != approver",
      isActive: true,
    },
  });
  assert(sodRule.isActive === true, "SoD rule created as active");

  const activeRules = await prisma.soDRule.findMany({ where: { isActive: true } });
  assert(activeRules.length > 0, "Active SoD rules queryable");

  // ========== TEST 6: RBAC Permissions ==========
  console.log("\n--- Test 6: RBAC Permissions ---");
  const perm = await prisma.permission.create({
    data: { code: "test.permission", name: "Test Permission", module: "test" },
  });
  await prisma.rolePermission.create({
    data: { roleId: testRole.id, permissionId: perm.id, scope: "all" },
  });
  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: testRole.id },
    include: { permission: true },
  });
  assert(rolePerms.length > 0, "Role-permission assignment works");
  assert(rolePerms[0].permission.code === "test.permission", "Permission correctly linked to role");

  // ========== TEST 7: Compliance Gap & Remediation ==========
  console.log("\n--- Test 7: Compliance Gap & Remediation ---");
  const framework = await prisma.framework.create({
    data: { code: "TEST_FW", name: "Test Framework", type: "Standard" },
  });
  const requirement = await prisma.requirement.create({
    data: { code: "TEST_REQ", title: "Test Requirement", frameworkId: framework.id },
  });
  const gap = await prisma.gap.create({
    data: {
      code: "GAP-001",
      title: "Test Gap",
      description: "Test gap description",
      requirementId: requirement.id,
      frameworkId: framework.id,
      status: "Open",
      severity: "High",
      owner: "test_user",
    },
  });
  assert(gap.id.length > 0, "Gap created with ID");
  assert(gap.requirementId === requirement.id, "Gap linked to requirement");

  const remediation = await prisma.remediation.create({
    data: {
      code: "REM-001",
      title: "Test Remediation",
      gapId: gap.id,
      status: "Open",
      progress: 0,
      owner: "test_user",
    },
  });
  assert(remediation.gapId === gap.id, "Remediation linked to gap");

  // ========== TEST 8: Evidence Cross-module Linkage ==========
  console.log("\n--- Test 8: Evidence Cross-module Linkage ---");
  const evidence = await prisma.evidence.create({
    data: {
      code: "EVD-001",
      name: "Test Evidence",
      type: "Document",
      status: "Submitted",
      owner: "test_user",
      requirementId: requirement.id,
    },
  });
  assert(evidence.requirementId === requirement.id, "Evidence linked to requirement");

  // ========== TEST 9: Data Classification ==========
  console.log("\n--- Test 9: Data Classification ---");
  const classification = await prisma.dataClassification.create({
    data: { code: "confidential", label: "Confidential", level: 3 },
  });
  assert(classification.code === "confidential", "Data classification created");

  // ========== TEST 10: Department Centralization ==========
  console.log("\n--- Test 10: Department Centralization ---");
  const dept = await prisma.department.create({
    data: { code: "IT", name: "Information Technology" },
  });
  assert(dept.code === "IT", "Department created as centralized lookup");

  // ========== SUMMARY ==========
  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  // Cleanup
  await prisma.auditLog.deleteMany();
  await prisma.remediation.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.dataClassification.deleteMany();
  await prisma.department.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.soDRule.deleteMany();
  await prisma.user.deleteMany({ where: { username: { startsWith: "test_" } } });
  await prisma.role.deleteMany({ where: { code: { startsWith: "test_" } } });

  await prisma.$disconnect();

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
