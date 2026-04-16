import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth/middleware';
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password';

// 验证结果接口
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 个人信息更新数据接口
interface ProfileUpdateData {
  name?: string;
  avatar?: string;
  password?: {
    currentPassword: string;
    newPassword: string;
  };
  englishLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningGoal?: string;
}

/**
 * 验证个人信息更新请求
 * 
 * 输入格式：
 * - body: any - 请求体对象
 * 
 * 验证规则：
 * 1. body必须是对象类型
 * 2. 所有字段都是可选的
 * 3. 如果提供password字段，必须包含currentPassword和newPassword
 * 4. englishLevel必须是有效的枚举值
 * 5. 字符串字段长度限制
 * 
 * 输出格式：
 * - ValidationResult 对象包含：
 *   - isValid: boolean - 验证是否通过
 *   - errors: string[] - 错误信息数组（验证失败时）
 */
function validateProfileUpdateRequest(body: any): ValidationResult {
  const errors: string[] = [];
  
  // 检查body是否存在
  if (!body || typeof body !== 'object') {
    errors.push('请求体格式不正确');
    return { isValid: false, errors };
  }
  
  const { name, avatar, password, englishLevel, learningGoal } = body;
  
  // 验证name字段（可选）
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      errors.push('昵称必须是字符串类型');
    } else if (name.trim().length === 0) {
      errors.push('昵称不能为空');
    } else if (name.length > 50) {
      errors.push('昵称长度不能超过50个字符');
    }
  }
  
  // 验证avatar字段（可选）
  if (avatar !== undefined && avatar !== null) {
    if (typeof avatar !== 'string') {
      errors.push('头像URL必须是字符串类型');
    } else if (avatar.trim().length === 0) {
      errors.push('头像URL不能为空');
    } else if (avatar.length > 500) {
      errors.push('头像URL长度不能超过500个字符');
    } else if (!avatar.startsWith('http://') && !avatar.startsWith('https://')) {
      errors.push('头像URL必须以http://或https://开头');
    }
  }
  
  // 验证password字段（可选）
  if (password !== undefined && password !== null) {
    if (typeof password !== 'object') {
      errors.push('密码字段必须是对象类型');
    } else {
      const { currentPassword, newPassword } = password;
      
      if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim().length === 0) {
        errors.push('当前密码不能为空');
      }
      
      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
        errors.push('新密码不能为空');
      } else {
        // 验证新密码强度
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
    }
  }
  
  // 验证englishLevel字段（可选）
  if (englishLevel !== undefined && englishLevel !== null) {
    const validEnglishLevels = ['beginner', 'intermediate', 'advanced'];
    if (typeof englishLevel !== 'string' || !validEnglishLevels.includes(englishLevel)) {
      errors.push('英语水平必须是 beginner, intermediate 或 advanced 之一');
    }
  }
  
  // 验证learningGoal字段（可选）
  if (learningGoal !== undefined && learningGoal !== null) {
    if (typeof learningGoal !== 'string') {
      errors.push('学习目标必须是字符串类型');
    } else if (learningGoal.trim().length === 0) {
      errors.push('学习目标不能为空');
    } else if (learningGoal.length > 500) {
      errors.push('学习目标长度不能超过500个字符');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 用户个人信息更新接口
 * 
 * 输入格式：
 * - 请求方法：PUT
 * - 请求头：
 *   - Authorization: Bearer <token>  // JWT认证令牌，必填
 *   - Content-Type: application/json
 * - 请求体（JSON格式）：
 *   {
 *     "name": "新昵称",              // 可选
 *     "avatar": "https://...",       // 可选
 *     "password": {                  // 可选，修改密码时使用
 *       "currentPassword": "当前密码",
 *       "newPassword": "新密码"
 *     },
 *     "englishLevel": "intermediate", // 可选
 *     "learningGoal": "雅思备考"      // 可选
 *   }
 * 
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "message": "个人信息更新成功",
 *     "data": {
 *       "id": "string",
 *       "email": "string",
 *       "name": "string | null",
 *       "avatar": "string | null",
 *       "englishLevel": "string | null",
 *       "membershipTier": "string",
 *       "membershipExpiry": "string | null",
 *       "learningGoal": "string | null",
 *       "createdAt": "string",
 *       "updatedAt": "string"
 *     }
 *   }
 * 
 * 错误响应：
 * - 400：请求参数错误（缺少必填字段、格式错误等）
 * - 401：未授权访问（缺少或无效的认证令牌）
 * - 404：用户不存在
 * - 500：服务器内部错误
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证请求的认证状态
    const authContext = await authenticateRequest(request);
    
    if (!authContext.isAuthenticated) {
      return NextResponse.json(
        { 
          success: false,
          error: "未授权访问",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "请求体格式不正确，必须是有效的JSON" 
        },
        { status: 400 }
      );
    }

    // 验证请求体
    const validation = validateProfileUpdateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "请求参数错误",
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const { name, avatar, password, englishLevel, learningGoal } = body as ProfileUpdateData;

    // 查找用户（包含密码字段用于验证）
    const user = await prisma.user.findUnique({
      where: { id: authContext.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        password: true,
        englishLevel: true,
        learningGoal: true,
        membershipTier: true,
        membershipExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "用户不存在",
          code: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // 准备更新数据
    const updateData: any = {};

    // 更新name字段
    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }

    // 更新avatar字段
    if (avatar !== undefined) {
      updateData.avatar = avatar.trim() || null;
    }

    // 更新englishLevel字段
    if (englishLevel !== undefined) {
      updateData.englishLevel = englishLevel;
    }

    // 更新learningGoal字段
    if (learningGoal !== undefined) {
      updateData.learningGoal = learningGoal.trim() || null;
    }

    // 处理密码更新
    if (password) {
      const { currentPassword, newPassword } = password;
      
      // 检查用户是否有密码（OAuth用户可能没有密码）
      if (!user.password) {
        return NextResponse.json(
          { 
            success: false,
            error: "该账户未设置密码，无法修改密码",
            code: "NO_PASSWORD_SET"
          },
          { status: 400 }
        );
      }

      // 验证当前密码
      const isPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { 
            success: false,
            error: "当前密码不正确",
            code: "INVALID_CURRENT_PASSWORD"
          },
          { status: 400 }
        );
      }

      // 哈希新密码
      const hashedPassword = await hashPassword(newPassword);
      updateData.password = hashedPassword;
    }

    // 如果没有提供任何更新字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "未提供任何更新字段",
          code: "NO_UPDATE_FIELDS"
        },
        { status: 400 }
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: authContext.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        englishLevel: true,
        membershipTier: true,
        membershipExpiry: true,
        learningGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "个人信息更新成功",
      data: updatedUser
    });
  } catch (error) {
    console.error("更新用户信息错误:", error);
    
    // 处理 Prisma 错误
    if (error instanceof Error && error.message.includes('prisma')) {
      return NextResponse.json(
        { 
          success: false,
          error: "数据库操作失败",
          code: "DATABASE_ERROR"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "服务器内部错误",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}

/**
 * 处理 OPTIONS 预检请求
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}