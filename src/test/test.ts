/**
 * ArticuLab Server Actions 功能测试脚本
 *
 * 测试方案：B3 - 创建真实测试用户 + Mock 认证
 *
 * 使用方法：
 * npx tsx src/test/test.ts
 */

import { signUp, signIn, signOut } from "@/server/actions/auth.action";
import {
  getScenarioListAction,
  getSpeakingScenarioTypesAction,
  getWritingScenarioTypesAction,
} from "@/server/actions/scenario.action";
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
} from "@/server/actions/user.action";
import {
  createWritingExerciseAction,
  getWritingExerciseAction,
  saveDraftAction,
  getDraftAction,
  getWritingHistoryAction,
  deleteWritingExerciseAction,
  // submitWritingAction, // 需要 OpenAI API，暂时跳过
  // getWritingResultAction, // 依赖提交后的结果
} from "@/server/actions/writing.action";
import * as authService from "@/server/services/auth.service";
import * as scenarioService from "@/server/services/scenario.service";
import * as authLib from "@/lib/auth";
import type { EnglishLevel, MembershipTier } from "@/schema";

// ==================== 工具函数 ====================

/**
 * 打印分隔线
 */
function printSeparator(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60) + "\n");
}

/**
 * 打印测试结果
 */
function printResult(testName: string, result: any, success: boolean) {
  const status = success ? "✅" : "❌";
  console.log(`${status} ${testName}`);
  if (!success) {
    console.error("   错误:", result?.error || result);
  } else {
    console.log("   结果:", JSON.stringify(result, null, 2).substring(0, 200));
  }
}

/**
 * 生成唯一的测试邮箱
 */
function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@articulab.test`;
}

// ==================== 测试用例 ====================

/**
 * 测试 1: 无需认证的 Actions
 */
async function testUnauthenticatedActions() {
  printSeparator("测试 1: 无需认证的 Actions");

  // 1.1 获取场景列表
  try {
    console.log("📋 测试获取写作场景列表...");
    const writingScenarios = await getScenarioListAction({
      category: "writing",
      page: 1,
      pageSize: 5,
    });
    printResult("获取写作场景列表", writingScenarios, writingScenarios.success);

    if (writingScenarios.success) {
      console.log(
        `   场景列表: ${writingScenarios.data.prompts.length} 个场景`,
      );

      if (writingScenarios.data.prompts.length > 0) {
        console.log(`   找到 ${writingScenarios.data.prompts.length} 个场景`);
        const firstPrompt = writingScenarios.data.prompts[0];
        if (firstPrompt) {
          console.log(`   第一个场景: ${firstPrompt.title}`);
        }
        console.log(writingScenarios.data.prompts);
      }
    }
  } catch (error) {
    printResult("获取写作场景列表", { error }, false);
  }

  // 1.2 获取口语场景列表
  try {
    console.log("\n📋 测试获取口语场景列表...");
    const speakingScenarios = await getScenarioListAction({
      category: "speaking",
      page: 1,
      pageSize: 5,
    });
    printResult(
      "获取口语场景列表",
      speakingScenarios,
      speakingScenarios.success,
    );
  } catch (error) {
    printResult("获取口语场景列表", { error }, false);
  }

  // 1.3 获取口语场景类型
  try {
    console.log("\n🎯 测试获取口语场景类型...");
    const speakingTypes = await getSpeakingScenarioTypesAction();
    printResult("获取口语场景类型", speakingTypes, speakingTypes.success);

    if (speakingTypes.success) {
      console.log(`   类型列表: ${speakingTypes.data.join(", ")}`);
    }
  } catch (error) {
    printResult("获取口语场景类型", { error }, false);
  }

  // 1.4 获取写作场景类型
  try {
    console.log("\n🎯 测试获取写作场景类型...");
    const writingTypes = await getWritingScenarioTypesAction();
    printResult("获取写作场景类型", writingTypes, writingTypes.success);

    if (writingTypes.success) {
      console.log(`   类型列表: ${writingTypes.data.join(", ")}`);
    }
  } catch (error) {
    printResult("获取写作场景类型", { error }, false);
  }
}

/**
 * 测试 2: 认证相关 Actions
 */
async function testAuthActions() {
  printSeparator("测试 2: 认证相关 Actions");

  const testEmail = generateTestEmail();
  const testPassword = "TestPassword123!";
  const testName = "Test User";

  console.log(`📧 测试邮箱: ${testEmail}\n`);

  // 2.1 注册用户
  try {
    console.log("🔐 测试用户注册...");
    const signUpResult = await signUp({
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      name: testName,
    });
    printResult("用户注册", signUpResult, signUpResult.success);

    if (!signUpResult.success) {
      console.error("⚠️  注册失败，跳过后续认证测试");
      return null;
    }
  } catch (error) {
    printResult("用户注册", { error: String(error) }, false);
    return null;
  }

  // 2.2 用户登录
  try {
    console.log("\n🔑 测试用户登录...");
    const signInResult = await signIn({
      email: testEmail,
      password: testPassword,
    });
    printResult("用户登录", signInResult, signInResult.success);

    if (!signInResult.success) {
      console.error("⚠️  登录失败，跳过后续认证测试");
      return null;
    }
  } catch (error) {
    printResult("用户登录", { error: String(error) }, false);
    return null;
  }

  // 2.3 退出登录（注意：在脚本环境中 Cookie 不会被清除）
  try {
    console.log("\n🚪 测试退出登录...");
    await signOut();
    console.log("✅ 退出登录调用成功（Cookie 在脚本环境中不会被实际清除）");
  } catch (error) {
    console.error("❌ 退出登录失败:", error);
  }

  return { email: testEmail, password: testPassword, name: testName };
}

/**
 * 设置测试用户并 Mock 认证
 */
async function setupTestUserAndMock(): Promise<{
  userId: string;
  email: string;
}> {
  printSeparator("准备测试环境: 创建测试用户并 Mock 认证");

  const testEmail = generateTestEmail();
  const testPassword = "TestPassword123!";
  const testName = "Test User for Actions";

  console.log(`📧 创建测试用户: ${testEmail}\n`);

  try {
    // 直接调用 Service 层创建用户（绕过 Action 的 Cookie 限制）
    const user = await authService.registerUser({
      email: testEmail,
      password: testPassword,
      name: testName,
    });

    console.log(`✅ 测试用户创建成功`);
    console.log(`   用户 ID: ${user.id}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   姓名: ${user.name}`);

    // Mock getCurrentUser 函数（使用 Object.defineProperty 绕过只读限制）
    Object.defineProperty(authLib, "getCurrentUser", {
      value: async () => ({
        userId: user.id,
        email: user.email,
        name: user.name,
        englishLevel: user.englishLevel as EnglishLevel | null,
        membershipTier: user.membershipTier as MembershipTier,
      }),
      writable: true,
      configurable: true,
    });

    console.log("\n✅ 认证状态已 Mock");
    console.log(`   Mock 用户 ID: ${user.id}\n`);

    return { userId: user.id, email: testEmail };
  } catch (error) {
    console.error("❌ 创建测试用户失败:", error);
    throw error;
  }
}

/**
 * 测试 3: 用户相关 Actions（需要认证）
 */
async function testUserActions() {
  printSeparator("测试 3: 用户相关 Actions（需要认证）");

  // 3.1 获取用户资料
  try {
    console.log("👤 测试获取用户资料...");
    const profileResult = await getUserProfile();
    printResult("获取用户资料", profileResult, profileResult.success);

    if (profileResult.success) {
      console.log(`   用户 ID: ${profileResult.data.userProfile.id}`);
      console.log(`   邮箱: ${profileResult.data.userProfile.email}`);
      console.log(`   姓名: ${profileResult.data.userProfile.name}`);
      console.log(
        `   英语等级: ${profileResult.data.userProfile.englishLevel}`,
      );
      console.log(
        `   会员等级: ${profileResult.data.userProfile.membershipTier}`,
      );
    }
  } catch (error) {
    printResult("获取用户资料", { error: String(error) }, false);
  }

  // 3.2 更新用户资料
  try {
    console.log("\n✏️  测试更新用户资料...");
    const updateResult = await updateUserProfile("", {
      name: "Updated Test User",
      learningGoal: "Improve IELTS writing score to 7.0",
    });
    printResult("更新用户资料", updateResult, updateResult.success);

    if (updateResult.success) {
      console.log(`   更新后姓名: ${updateResult.data.userProfile.name}`);
      console.log(`   学习目标: ${updateResult.data.userProfile.learningGoal}`);
    }
  } catch (error) {
    printResult("更新用户资料", { error: String(error) }, false);
  }

  // 3.3 修改密码
  try {
    console.log("\n🔒 测试修改密码...");
    const passwordResult = await updatePassword({
      currentPassword: "TestPassword123!",
      newPassword: "NewPassword456!",
      confirmNewPassword: "NewPassword456!",
    });
    printResult("修改密码", passwordResult, passwordResult.success);
  } catch (error) {
    printResult("修改密码", { error: String(error) }, false);
  }
}

/**
 * 测试 4: 写作练习相关 Actions（需要认证）
 */
async function testWritingActions() {
  printSeparator("测试 4: 写作练习相关 Actions（需要认证）");

  let exerciseId: string | null = null;

  // 4.1 获取一个可用的场景 ID
  let scenarioId: string | null = null;
  try {
    console.log("📋 获取写作场景用于测试...");
    const scenarios = await scenarioService.getScenarioList({
      category: "writing",
      page: 1,
      pageSize: 1,
    });

    if (scenarios.prompts.length > 0) {
      const firstPrompt = scenarios.prompts[0];
      if (firstPrompt) {
        scenarioId = firstPrompt.id;
        console.log(`   使用场景: ${firstPrompt.title} (ID: ${scenarioId})`);
      }
    } else {
      console.error("⚠️  没有可用的写作场景，跳过写作测试");
      return;
    }
  } catch (error) {
    console.error("❌ 获取场景失败:", error);
    return;
  }

  // 4.2 创建写作练习
  try {
    console.log("\n✍️  测试创建写作练习...");
    const createResult = await createWritingExerciseAction({
      scenarioType: "daily",
      prompt: "Test Writing Prompt for Automated Testing",
      isCustomPrompt: true,
      scenarioId: null,
    });
    printResult("创建写作练习", createResult, createResult.success);

    if (createResult.success) {
      exerciseId = createResult.data.exercise.id;
      console.log(`   练习 ID: ${exerciseId}`);
      console.log(`   场景类型: ${createResult.data.exercise.scenarioType}`);
      console.log(`   状态: ${createResult.data.exercise.status}`);
    } else {
      console.error("⚠️  创建失败，跳过后续写作测试");
      return;
    }
  } catch (error) {
    printResult("创建写作练习", { error: String(error) }, false);
    return;
  }

  // 4.3 获取写作练习详情
  if (exerciseId) {
    try {
      console.log("\n📄 测试获取写作练习详情...");
      const detailResult = await getWritingExerciseAction({
        exerciseId: exerciseId,
      });
      printResult("获取写作练习详情", detailResult, detailResult.success);

      if (detailResult.success) {
        console.log(`   场景类型: ${detailResult.data.exercise.scenarioType}`);
        console.log(
          `   内容长度: ${detailResult.data.exercise.content?.length || 0} 字符`,
        );
        console.log(`   字数: ${detailResult.data.exercise.wordCount}`);
      }
    } catch (error) {
      printResult("获取写作练习详情", { error: String(error) }, false);
    }
  }

  // 4.4 保存草稿
  if (exerciseId) {
    try {
      console.log("\n💾 测试保存草稿...");
      const draftContent = "This is an updated draft content for testing.";
      const wordCount = draftContent.trim().split(/\s+/).length;
      const saveDraftResult = await saveDraftAction({
        exerciseId: exerciseId,
        content: draftContent,
        wordCount: wordCount,
      });
      printResult("保存草稿", saveDraftResult, saveDraftResult.success);

      if (saveDraftResult.success) {
        console.log(`   草稿内容: ${saveDraftResult.data.draft.content}`);
        console.log(`   字数: ${saveDraftResult.data.draft.wordCount}`);
        console.log(
          `   最后保存时间: ${saveDraftResult.data.draft.lastSavedAt}`,
        );
      }
    } catch (error) {
      printResult("保存草稿", { error: String(error) }, false);
    }
  }

  // 4.5 获取草稿
  if (exerciseId) {
    try {
      console.log("\n📥 测试获取草稿...");
      const getDraftResult = await getDraftAction({
        exerciseId: exerciseId,
      });
      printResult("获取草稿", getDraftResult, getDraftResult.success);

      if (getDraftResult.success) {
        console.log(`   草稿内容: ${getDraftResult.data.draft.content}`);
        console.log(`   字数: ${getDraftResult.data.draft.wordCount}`);
      }
    } catch (error) {
      printResult("获取草稿", { error: String(error) }, false);
    }
  }

  // 4.6 获取写作历史
  try {
    console.log("\n📚 测试获取写作历史...");
    const historyResult = await getWritingHistoryAction({
      page: 1,
      pageSize: 10,
    });
    printResult("获取写作历史", historyResult, historyResult.success);

    if (historyResult.success) {
      console.log(`   总记录数: ${historyResult.data.pagination.total}`);
      console.log(`   当前页: ${historyResult.data.pagination.page}`);
      console.log(`   每页数量: ${historyResult.data.pagination.limit}`);

      if (historyResult.data.exercises.length > 0) {
        console.log(`   第一条记录:`);
        const firstExercise = historyResult.data.exercises[0];
        if (firstExercise) {
          console.log(`     - ID: ${firstExercise.id}`);
          console.log(`     - 场景类型: ${firstExercise.scenarioType}`);
          console.log(`     - 状态: ${firstExercise.status}`);
        }
      }
    }
  } catch (error) {
    printResult("获取写作历史", { error: String(error) }, false);
  }

  // 4.7 删除写作练习
  if (exerciseId) {
    try {
      console.log("\n🗑️  测试删除写作练习...");
      const deleteResult = await deleteWritingExerciseAction({
        exerciseId: exerciseId,
      });
      printResult("删除写作练习", deleteResult, deleteResult.success);

      if (deleteResult.success) {
        console.log(`   已删除练习 ID: ${deleteResult.data.id}`);
      }
    } catch (error) {
      printResult("删除写作练习", { error: String(error) }, false);
    }
  }

  // 4.8 提交写作批改（需要 OpenAI API，可选测试）
  // 注意：这个测试会消耗 OpenAI API 配额，默认跳过
  /*
  if (exerciseId && process.env.TEST_OPENAI === "true") {
    try {
      console.log("\n🤖 测试提交写作批改（需要 OpenAI API）...");
      const submitResult = await submitWritingAction({
        exerciseId: exerciseId,
        content: "This is the final submission content for AI evaluation.",
      });
      printResult("提交写作批改", submitResult, submitResult.success);
    } catch (error) {
      printResult("提交写作批改", { error: String(error) }, false);
    }
  }
  */
}

/**
 * 主测试流程
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔" + "═".repeat(58) + "╗");
  console.log(
    "║" +
      " ".repeat(10) +
      "ArticuLab Server Actions 自动化测试" +
      " ".repeat(10) +
      "║",
  );
  console.log("╚" + "═".repeat(58) + "╝");
  console.log("\n开始时间:", new Date().toLocaleString("zh-CN"));

  const startTime = Date.now();

  try {
    // ========== 阶段 1: 测试无需认证的 Actions ==========
    await testUnauthenticatedActions();

    // ========== 阶段 2: 测试认证 Actions ==========
    await testAuthActions();

    // ========== 阶段 3: 准备测试用户并 Mock 认证 ==========
    const testUserInfo = await setupTestUserAndMock();

    // ========== 阶段 4: 测试需要认证的 Actions ==========
    await testUserActions();
    await testWritingActions();

    // ========== 测试完成 ==========
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    printSeparator("测试完成");
    console.log(`✅ 所有测试执行完毕`);
    console.log(`⏱️  总耗时: ${duration} 秒`);
    console.log(`📧 测试用户邮箱: ${testUserInfo.email}`);
    console.log(`🆔 测试用户 ID: ${testUserInfo.userId}`);
    console.log(`\n⚠️  注意: 测试数据已保留在数据库中，如需清理请手动删除`);
    console.log(`   可以使用以下 SQL 删除测试用户:\n`);
    console.log(`   DELETE FROM "User" WHERE email LIKE '%@articulab.test';\n`);
  } catch (error) {
    console.error("\n❌ 测试过程中发生严重错误:");
    console.error(error);
    process.exit(1);
  }
}

// 执行测试
runAllTests().catch((error) => {
  console.error("❌ 未捕获的错误:", error);
  process.exit(1);
});
