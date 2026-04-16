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
 *
 * 输入格式：
 * - userId: string - 用户ID，必填
 * - email: string - 用户邮箱，必填
 *
 * 配置参数：
 * - JWT_SECRET: 环境变量，用于签名token
 * - JWT_EXPIRES_IN: 环境变量，token过期时间（默认："7d"）
 *
 * 生成规则：
 * 1. 验证userId和email都是有效的非空字符串
 * 2. 使用jwt.sign()生成token
 * 3. payload包含：{ userId, email }
 * 4. 使用JWT_SECRET进行签名
 * 5. 设置过期时间为JWT_EXPIRES_IN
 *
 * 输出格式：
 * - string - 生成的JWT token字符串
 *
 * 错误处理：
 * - 如果输入无效，抛出错误："生成token需要有效的userId参数" 或 "生成token需要有效的email参数"
 * - 如果生成失败，抛出错误："认证令牌生成失败，请稍后重试"
 *
 * 示例：
 * ```
 * const token = generateToken("user123", "test@example.com");
 * // 返回: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
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
 *
 * 输入格式：
 * - token: string - 需要验证的JWT token字符串
 *
 * 验证规则：
 * 1. 检查token是否为空或无效字符串
 * 2. 使用jwt.verify()验证token签名和过期时间
 * 3. 使用JWT_SECRET进行验证
 *
 * 输出格式：
 * - TokenVerificationResult 对象包含：
 *   - isValid: boolean - token是否有效
 *   - payload: JwtPayload | null - 解码后的payload（有效时）
 *   - error: string | null - 错误信息（无效时）
 *   - errorType: 'missing' | 'invalid' | 'expired' | 'malformed' | 'other' | null - 错误类型
 *
 * 错误类型说明：
 * - 'missing': token为空或未提供
 * - 'expired': token已过期
 * - 'invalid': token无效（签名错误、格式错误等）
 * - 'malformed': token格式错误
 * - 'other': 其他未知错误
 *
 * 示例：
 * ```
 * const result = verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
 * // 有效时返回: { isValid: true, payload: { userId: "user123", email: "test@example.com" }, error: null, errorType: null }
 *
 * const result2 = verifyToken("invalid.token.here");
 * // 无效时返回: { isValid: false, payload: null, error: "Token无效", errorType: "invalid" }
 * ```
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
 *
 * 输入格式：
 * - authHeader: string | null - Authorization请求头值
 *
 * 提取规则：
 * 1. 验证Authorization头格式：必须为 "Bearer <token>"
 * 2. 检查是否包含两部分：认证方案和token
 * 3. 认证方案必须为 "Bearer"
 * 4. token不能为空
 *
 * 输出格式：
 * - string | null - 提取到的token字符串，如果提取失败则返回null
 *
 * 错误处理：
 * - 如果Authorization头为空或不是字符串，返回null
 * - 如果格式不正确，记录警告日志并返回null
 * - 如果提取过程出错，记录错误日志并返回null
 *
 * 示例：
 * ```
 * const token = extractTokenFromHeader("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
 * // 返回: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * const token2 = extractTokenFromHeader("Basic dXNlcjpwYXNz");
 * // 返回: null (认证方案不是Bearer)
 * ```
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
 *
 * 输入格式：无
 *
 * 检查规则：
 * 1. 检查JWT_SECRET是否已设置
 * 2. 检查JWT_SECRET是否使用默认值（生产环境不安全）
 * 3. 检查JWT_SECRET长度是否足够（建议至少32个字符）
 *
 * 输出格式：
 * - 对象包含：
 *   - isValid: boolean - 配置是否有效（没有错误）
 *   - warnings: string[] - 警告信息数组
 *   - errors: string[] - 错误信息数组
 *
 * 使用场景：
 * - 应用启动时检查配置
 * - 开发环境提醒配置问题
 * - 生产环境确保安全性
 *
 * 示例：
 * ```
 * const configCheck = validateJwtConfig();
 * // 返回: { isValid: true, warnings: [], errors: [] } (配置正确)
 * // 或: { isValid: false, warnings: ["JWT_SECRET使用的是默认值..."], errors: ["JWT_SECRET未设置"] }
 * ```
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