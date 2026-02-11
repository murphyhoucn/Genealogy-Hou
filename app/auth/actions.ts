"use server";

// 验证邀请码的服务器端函数
export async function validateInviteCode(inviteCode: string): Promise<boolean> {
  const validInviteCodes = process.env.REGISTRATION_INVITE_CODES?.split(',').map(code => code.trim()) || [];
  
  // 如果没有配置邀请码，默认允许注册（向后兼容）
  if (validInviteCodes.length === 0) {
    return true;
  }
  
  return validInviteCodes.includes(inviteCode.trim());
}

// 获取是否启用邀请码机制
export async function isInviteCodeRequired(): Promise<boolean> {
  const validInviteCodes = process.env.REGISTRATION_INVITE_CODES?.split(',').map(code => code.trim()) || [];
  return validInviteCodes.length > 0;
}