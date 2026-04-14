// License 验证 + 7 天试用逻辑（仅 Tauri 桌面版）
//
// 流程：
// 1. 首次打开 → 写入 trial_start 时间戳，开始 7 天试用
// 2. 试用期内 → 正常使用所有功能
// 3. 试用到期 → 必须输入 License Key 激活
// 4. 激活成功 → 写入 license 信息，永久有效
//
// 数据存储在 Tauri AppData 目录（~/.follow/）

import { writeTextFile, readTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

const LICENSE_FILE = 'license.json';
const TRIAL_DAYS = 7;

// 替换为你的 Keygen Account ID
const KEYGEN_ACCOUNT = import.meta.env.VITE_KEYGEN_ACCOUNT_ID || '';

/**
 * 读取本地 license 文件
 */
async function readLicenseFile() {
  try {
    const content = await readTextFile(LICENSE_FILE, { baseDir: BaseDirectory.AppData });
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 写入本地 license 文件（首次写入时自动创建 AppData 目录）
 */
async function writeLicenseFile(data) {
  const content = JSON.stringify(data, null, 2);
  try {
    await writeTextFile(LICENSE_FILE, content, { baseDir: BaseDirectory.AppData });
  } catch {
    // 目录不存在时先创建再重试
    await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
    await writeTextFile(LICENSE_FILE, content, { baseDir: BaseDirectory.AppData });
  }
}

/**
 * 检查当前 license 状态
 * @returns {{ status: 'licensed' | 'trial' | 'expired', daysLeft?: number }}
 */
export async function checkLicense() {
  const data = await readLicenseFile();

  // 已激活
  if (data?.licenseKey && data?.activatedAt) {
    return { status: 'licensed' };
  }

  // 试用中
  if (data?.trialStart) {
    const start = new Date(data.trialStart);
    const now = new Date();
    const elapsed = Math.floor((now - start) / 86400000);
    const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
    if (daysLeft > 0) {
      return { status: 'trial', daysLeft };
    }
    return { status: 'expired', daysLeft: 0 };
  }

  // 首次使用，初始化试用
  await writeLicenseFile({ trialStart: new Date().toISOString() });
  return { status: 'trial', daysLeft: TRIAL_DAYS };
}

/**
 * 使用 License Key 激活
 * @returns {{ success: boolean, error?: string }}
 */
export async function activateLicense(key) {
  key = key.trim();
  if (!key) return { success: false, error: '请输入 License Key' };

  if (!KEYGEN_ACCOUNT) {
    return { success: false, error: '未配置 Keygen Account ID' };
  }

  try {
    const res = await fetch(
      `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT}/licenses/actions/validate-key`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          meta: { key },
        }),
      }
    );

    const data = await res.json();

    if (data.meta?.valid) {
      // 激活成功，保存到本地
      const existing = await readLicenseFile() || {};
      await writeLicenseFile({
        ...existing,
        licenseKey: key,
        activatedAt: new Date().toISOString(),
      });
      return { success: true };
    }

    // Keygen 返回了具体原因
    const code = data.meta?.code || 'UNKNOWN';
    const detail = data.meta?.detail || '验证失败';
    if (code === 'NOT_FOUND') {
      return { success: false, error: 'License Key 不存在，请检查后重试' };
    }
    if (code === 'SUSPENDED' || code === 'EXPIRED') {
      return { success: false, error: 'License 已过期或被暂停' };
    }
    return { success: false, error: detail };
  } catch {
    return { success: false, error: '网络错误，请检查网络连接后重试' };
  }
}
