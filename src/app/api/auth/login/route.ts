import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEmail, validateAuthRequest, sanitizeEmail } from '@/lib/auth/validation';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';

/**
 * 用户登录接口
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
 * 输出格式（成功响应）：
 * - 状态码：200
 * - 响应体（JSON格式）：
 *   {
 *     "success": true,
 *     "message": "登录成功",
 *     "data": {
 *       "user": {
 *         "id": "string",
 *         "email": "string",
 *         "name": "string | null",
 *         "avatar": "string | null",
 *         "englishLevel": "string | null",
 *         "membershipTier": "string",
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
 * - 400：请求参数错误（邮箱格式错误、缺少必填字段等）
 * - 401：认证失败（邮箱或密码错误、账户未设置密码等）
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
    const requestValidation = validateAuthRequest(body, 'login');
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
      // 邮箱格式错误，返回具体错误信息
      return NextResponse.json(
        { 
          success: false, 
          error: '请输入有效的邮箱地址',
          details: emailValidation.errors 
        },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
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

    // 检查用户是否存在
    if (!user) {
      // 用户不存在，返回通用错误信息
      return NextResponse.json(
        { 
          success: false, 
          error: '邮箱或密码错误' 
        },
        { status: 401 }
      );
    }

    // 检查是否有密码（OAuth用户可能没有密码）
    if (!user.password) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该账户未设置密码，请使用其他登录方式' 
        },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '邮箱或密码错误' 
        },
        { status: 401 }
      );
    }

    // 生成JWT token
    const token = generateToken(user.id, user.email);

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    // 返回响应
    return NextResponse.json(
      {
        success: true,
        message: '登录成功',
        data: {
          user: userWithoutPassword,
          token,
        },
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error('登录接口错误:', error);
    
    // 处理已知错误类型
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