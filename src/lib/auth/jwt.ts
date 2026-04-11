import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenVerificationResult {
  isValid: boolean;
  payload: JwtPayload | null;
  error: string | null;
  errorType: 'missing' | 'invalid' | 'expired' | 'malformed' | 'other' | null;
}

// 启动时检查JWT_SECRET
if (process.env.NODE_ENV === 'production' && 
    (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production')) {
  console.error('❌ 严重错误：生产环境必须设置JWT_SECRET环境变量');
  throw new Error('生产环境必须设置JWT_SECRET环境变量');
}

if (JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  警告：JWT_SECRET使用的是默认值，生产环境请修改');
}

/**
 * 生成JWT token
 */
export function generateToken(userId: string, email: string): string {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('生成token需要有效的userId参数');
    }
    
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('生成token需要有效的email参数');
    }
    
    return jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  } catch (error) {
    console.error('生成JWT token失败:', error);
    throw new Error('认证令牌生成失败，请稍后重试');
  }
}

/**
 * 验证JWT token - 返回结构化结果
 */
export function verifyToken(token: string): TokenVerificationResult {
  const defaultResult: TokenVerificationResult = {
    isValid: false,
    payload: null,
    error: null,
    errorType: null
  };
  
  try {
    // 检查token是否有效
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return {
        ...defaultResult,
        error: 'Token不能为空',
        errorType: 'missing'
      };
    }
    
    // 验证token
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    return {
      isValid: true,
      payload,
      error: null,
      errorType: null
    };
    
  } catch (error: any) {
    let errorMessage = 'Token验证失败';
    let errorType: TokenVerificationResult['errorType'] = 'other';
    
    // 根据错误类型分类
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token已过期';
      errorType = 'expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Token无效';
      errorType = 'invalid';
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token尚未生效';
      errorType = 'invalid';
    } else if (error.message?.includes('malformed')) {
      errorMessage = 'Token格式错误';
      errorType = 'malformed';
    }
    
    console.error(`Token验证失败 (${errorType}):`, error.message || error);
    
    return {
      ...defaultResult,
      error: errorMessage,
      errorType
    };
  }
}

/**
 * 从请求头提取token
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  try {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      console.warn('提取token：Authorization头格式不正确，应为"Bearer <token>"');
      return null;
    }
    
    if (parts[0] !== 'Bearer') {
      console.warn(`提取token：认证方案应为"Bearer"，实际为"${parts[0]}"`);
      return null;
    }
    
    const token = parts[1];
    
    if (!token || token.trim().length === 0) {
      console.warn('提取token：token为空');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('从请求头提取token失败:', error);
    return null;
  }
}

/**
 * 检查JWT配置是否有效
 */
export function validateJwtConfig(): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!JWT_SECRET || JWT_SECRET.trim().length === 0) {
    errors.push('JWT_SECRET未设置');
  } else if (JWT_SECRET === 'your-secret-key-change-in-production') {
    warnings.push('JWT_SECRET使用的是默认值，生产环境不安全');
  }
  
  if (JWT_SECRET && JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET长度较短，建议使用至少32个字符的强密钥');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}