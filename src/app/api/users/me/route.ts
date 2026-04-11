import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
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

    // 查找用户信息
    const user = await prisma.user.findUnique({
      where: { id: authContext.userId },
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

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
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