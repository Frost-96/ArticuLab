import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, TokenVerificationResult } from './jwt';

export interface AuthContext {
  userId: string;
  email: string;
  isAuthenticated: boolean;
  tokenVerification?: TokenVerificationResult;
}

/**
 * 验证请求的认证状态
 *
 * 输入格式：
 * - request: NextRequest - Next.js请求对象
 *
 * 验证流程：
 * 1. 从请求头提取Authorization头
 * 2. 从Authorization头提取JWT token
 * 3. 验证token的有效性
 * 4. 返回认证上下文
 *
 * 输出格式：
 * - AuthContext 对象包含：
 *   - userId: string - 用户ID（认证成功时）
 *   - email: string - 用户邮箱（认证成功时）
 *   - isAuthenticated: boolean - 是否已认证
 *   - tokenVerification?: TokenVerificationResult - token验证详情（可选）
 *
 * 认证状态：
 * - 成功：isAuthenticated = true，包含userId和email
 * - 失败：isAuthenticated = false，userId和email为空字符串
 *
 * 示例：
 * ```
 * const authContext = await authenticateRequest(request);
 * // 认证成功: { userId: "user123", email: "test@example.com", isAuthenticated: true, tokenVerification: {...} }
 * // 认证失败: { userId: "", email: "", isAuthenticated: false }
 * ```
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return { 
      userId: '', 
      email: '', 
      isAuthenticated: false 
    };
  }
  
  const verificationResult = verifyToken(token);
  
  if (!verificationResult.isValid || !verificationResult.payload) {
    return { 
      userId: '', 
      email: '', 
      isAuthenticated: false,
      tokenVerification: verificationResult
    };
  }
  
  return {
    userId: verificationResult.payload.userId,
    email: verificationResult.payload.email,
    isAuthenticated: true,
    tokenVerification: verificationResult
  };
}

/**
 * 保护API路由的中间件 - 返回认证上下文或错误响应
 *
 * 输入格式：
 * - handler: (request: NextRequest, context: AuthContext) => Promise<Response> - 原始请求处理器
 * - options?: 配置选项
 *   - requireAuth?: boolean - 是否要求认证（默认：true）
 *   - customErrorHandler?: (authContext: AuthContext) => Response | null - 自定义错误处理器
 *
 * 功能说明：
 * 1. 自动处理OPTIONS预检请求
 * 2. 验证请求的认证状态
 * 3. 根据requireAuth配置决定是否要求认证
 * 4. 认证失败时返回适当的错误响应
 * 5. 认证成功时调用原始处理器
 *
 * 输出格式：
 * - 返回一个函数，该函数接收NextRequest并返回Promise<Response>
 *
 * 使用示例：
 * ```
 * // 创建需要认证的API处理器
 * const protectedHandler = withAuth(async (request, authContext) => {
 *   return NextResponse.json({ message: "认证成功", user: authContext.userId });
 * });
 *
 * // 创建可选认证的API处理器
 * const optionalHandler = withAuth(async (request, authContext) => {
 *   if (authContext.isAuthenticated) {
 *     return NextResponse.json({ message: "欢迎回来", user: authContext.userId });
 *   } else {
 *     return NextResponse.json({ message: "请登录以获取更多功能" });
 *   }
 * }, { requireAuth: false });
 * ```
 *
 * 错误响应：
 * - 默认：401状态码，{ success: false, error: "未授权访问", code: "UNAUTHORIZED" }
 * - Token过期：401状态码，{ success: false, error: "认证令牌已过期，请重新登录", code: "UNAUTHORIZED" }
 * - Token无效：401状态码，{ success: false, error: "认证令牌无效", code: "UNAUTHORIZED" }
 */
export async function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options?: {
    requireAuth?: boolean;
    customErrorHandler?: (authContext: AuthContext) => Response | null;
  }
) {
  const { requireAuth = true, customErrorHandler } = options || {};
  
  return async (request: NextRequest) => {
    // 跳过OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    const authContext = await authenticateRequest(request);
    
    // 如果不需要认证，直接传递上下文
    if (!requireAuth) {
      return handler(request, authContext);
    }
    
    // 如果需要认证但未认证
    if (!authContext.isAuthenticated) {
      // 使用自定义错误处理器
      if (customErrorHandler) {
        const customResponse = customErrorHandler(authContext);
        if (customResponse) {
          return customResponse;
        }
      }
      
      // 默认错误响应
      let errorMessage = '未授权访问';
      let statusCode = 401;
      
      if (authContext.tokenVerification?.errorType === 'expired') {
        errorMessage = '认证令牌已过期，请重新登录';
        statusCode = 401;
      } else if (authContext.tokenVerification?.errorType === 'invalid') {
        errorMessage = '认证令牌无效';
        statusCode = 401;
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          code: 'UNAUTHORIZED'
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, authContext);
  };
}

/**
 * 创建需要认证的API处理器
 *
 * 输入格式：
 * - handler: (request: NextRequest, context: AuthContext) => Promise<Response> - 原始请求处理器
 *
 * 功能说明：
 * 1. 使用withAuth中间件包装处理器
 * 2. 设置requireAuth = true（必须认证）
 * 3. 简化创建需要认证的API处理器的流程
 *
 * 输出格式：
 * - 返回一个经过认证中间件包装的函数
 *
 * 使用示例：
 * ```
 * export const GET = createAuthenticatedHandler(async (request, authContext) => {
 *   // 只有认证用户才能访问
 *   return NextResponse.json({
 *     message: "欢迎回来",
 *     userId: authContext.userId
 *   });
 * });
 * ```
 */
export function createAuthenticatedHandler(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withAuth(handler, { requireAuth: true });
}

/**
 * 创建可选认证的API处理器
 *
 * 输入格式：
 * - handler: (request: NextRequest, context: AuthContext) => Promise<Response> - 原始请求处理器
 *
 * 功能说明：
 * 1. 使用withAuth中间件包装处理器
 * 2. 设置requireAuth = false（可选认证）
 * 3. 无论是否认证都会调用处理器，但提供认证上下文
 * 4. 处理器可以根据authContext.isAuthenticated决定行为
 *
 * 输出格式：
 * - 返回一个经过认证中间件包装的函数
 *
 * 使用示例：
 * ```
 * export const GET = createOptionalAuthHandler(async (request, authContext) => {
 *   if (authContext.isAuthenticated) {
 *     return NextResponse.json({
 *       message: "个性化内容",
 *       userId: authContext.userId
 *     });
 *   } else {
 *     return NextResponse.json({
 *       message: "公开内容"
 *     });
 *   }
 * });
 * ```
 */
export function createOptionalAuthHandler(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withAuth(handler, { requireAuth: false });
}