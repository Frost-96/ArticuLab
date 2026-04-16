import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证密码强度
 *
 * 输入格式：
 * - password: string - 需要验证的密码
 *
 * 验证规则：
 * 1. 必须是字符串类型
 * 2. 不能为空
 * 3. 长度至少8个字符
 * 4. 必须包含至少一个字母（大小写均可）
 * 5. 必须包含至少一个数字
 *
 * 输出格式：
 * - PasswordValidationResult 对象包含：
 *   - isValid: boolean - 验证是否通过
 *   - errors: string[] - 错误信息数组（验证失败时）
 *
 * 示例：
 * ```
 * const result = validatePasswordStrength("Password123");
 * // 返回: { isValid: true, errors: [] }
 *
 * const result2 = validatePasswordStrength("weak");
 * // 返回: { isValid: false, errors: ["密码长度至少需要8位", "密码必须包含至少一个数字"] }
 * ```
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // 检查输入类型
  if (typeof password !== 'string') {
    errors.push('密码必须是字符串类型');
    return { isValid: false, errors };
  }
  
  // 检查空值
  if (!password || password.trim().length === 0) {
    errors.push('密码不能为空');
    return { isValid: false, errors };
  }
  
  // 检查长度
  if (password.length < 8) {
    errors.push('密码长度至少需要8位');
  }
  
  // 检查是否包含字母
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含至少一个字母');
  }
  
  // 检查是否包含数字
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 哈希密码
 *
 * 输入格式：
 * - password: string - 需要哈希的原始密码
 *
 * 处理规则：
 * 1. 验证输入必须是有效的非空字符串
 * 2. 使用bcrypt算法进行哈希
 * 3. 使用10轮盐值（SALT_ROUNDS = 10）
 *
 * 输出格式：
 * - Promise<string> - 哈希后的密码字符串
 *
 * 错误处理：
 * - 如果输入无效，抛出错误："密码必须是有效的非空字符串"
 * - 如果哈希失败，抛出错误："密码处理失败，请稍后重试"
 *
 * 示例：
 * ```
 * const hashed = await hashPassword("myPassword123");
 * // 返回: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof password !== 'string' || !password.trim()) {
      throw new Error('密码必须是有效的非空字符串');
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('密码哈希失败:', error);
    throw new Error('密码处理失败，请稍后重试');
  }
}

/**
 * 验证密码
 *
 * 输入格式：
 * - password: string - 用户输入的原始密码
 * - hashedPassword: string - 数据库中存储的哈希密码
 *
 * 验证规则：
 * 1. 验证两个输入都是有效的字符串
 * 2. 使用bcrypt.compare()进行密码比对
 *
 * 输出格式：
 * - Promise<boolean> - 密码是否匹配
 *   - true: 密码匹配
 *   - false: 密码不匹配或输入无效
 *
 * 错误处理：
 * - 如果输入无效，返回false并记录警告日志
 * - 如果验证过程出错，返回false并记录错误日志
 *
 * 示例：
 * ```
 * const isValid = await verifyPassword("myPassword123", storedHash);
 * // 返回: true (如果密码匹配)
 * // 返回: false (如果密码不匹配)
 * ```
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    if (typeof password !== 'string' || !password.trim()) {
      console.warn('验证密码：密码输入无效');
      return false;
    }
    
    if (typeof hashedPassword !== 'string' || !hashedPassword.trim()) {
      console.warn('验证密码：哈希密码无效');
      return false;
    }
    
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}