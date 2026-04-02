import prisma from '@/config/prisma';

/**
 * Get a system setting by key
 */
export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
};

/**
 * Set a system setting
 */
export const setSetting = async (key: string, value: string): Promise<void> => {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};

/**
 * Is trade mode set to loss?
 */
export const isTradeLossMode = async (): Promise<boolean> => {
  const value = await getSetting('trade_mode');
  return value === 'loss';
};
