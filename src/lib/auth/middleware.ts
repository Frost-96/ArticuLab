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
 */
export function createAuthenticatedHandler(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withAuth(handler, { requireAuth: true });
}

/**
 * 创建可选认证的API处理器
 */
export function createOptionalAuthHandler(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>
) {
  return withAuth(handler, { requireAuth: false });
}