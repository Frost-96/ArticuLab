import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEmail, validateAuthRequest, sanitizeEmail } from '@/lib/auth/validation';
import { validatePasswordStrength, hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';

/**
 * 用户注册接口
 *
 * 输入格式：
 * - 请求方法：POST
 * - 请求头：Content-Type: application/json
 * - 请求体（JSON格式）：
 *   {
 *     "email": "string",    // 用户邮箱地址，必填
 *     "password": "string"  // 用户密码，必填
 *   }
 *
 * 密码要求：
 * - 至少8个字符
 * - 包含至少一个大写字母
 * - 包含至少一个小写字母
 * - 包含至少一个数字
 * - 包含至少一个特殊字符
 *
 * 输出格式（成功响应）：
 * - 状态码：201
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "message": "用户注册成功",
 *     "data": {
 *       "user": {
 *         "id": "string",
 *         "email": "string",
 *         "name": "string | null",
 *         "avatar": "string | null",
 *         "englishLevel": "string | null",
 *         "membershipTier": "string",  // 默认为 "free"
 *         "membershipExpiry": "string | null",
 *         "learningGoal": "string | null",
 *         "createdAt": "string",
 *         "updatedAt": "string"
 *       },
 *       "token": "string"  // JWT认证令牌
 *     }
 *   }
 *
 * 错误响应：
 * - 400：请求参数错误（邮箱格式错误、密码强度不足、缺少必填字段等）
 * - 409：邮箱已被注册
 * - 500：服务器内部错误
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: '请求体格式不正确，必须是有效的JSON' 
        },
        { status: 400 }
      );
    }

    // 验证请求体基本结构
    const requestValidation = validateAuthRequest(body, 'register');
    if (!requestValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '请求参数错误',
          details: requestValidation.errors 
        },
        { status: 400 }
      );
    }

    const { email, password } = body;
    
    // 清理和规范化邮箱
    const normalizedEmail = sanitizeEmail(email);
    
    // 验证邮箱格式
    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '邮箱格式错误',
          details: emailValidation.errors 
        },
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '密码强度不足',
          details: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该邮箱已被注册' 
        },
        { status: 409 }
      );
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        membershipTier: 'free',
      },
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

    // 生成JWT token
    const token = generateToken(user.id, user.email);

    // 返回响应
    return NextResponse.json(
      {
        success: true,
        message: '用户注册成功',
        data: {
          user,
          token,
        },
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error('注册接口错误:', error);
    
    // 处理已知错误类型
    if (error.code === 'P2002') {
      // Prisma唯一约束错误
      return NextResponse.json(
        { 
          success: false, 
          error: '该邮箱已被注册' 
        },
        { status: 409 }
      );
    }
    
    if (error.message?.includes('密码处理失败')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '密码处理失败，请稍后重试' 
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('认证令牌生成失败')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '认证令牌生成失败，请稍后重试' 
        },
        { status: 500 }
      );
    }
    
    // 通用错误响应
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      },
      { status: 500 }
    );
  }
}