import { prisma } from './prisma';

export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error fetching setting with key ${key}:`, error);
    return null;
  }
}

export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.settings.findMany({
      where: { category },
    });
    
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }
}

export async function setSetting(key: string, value: string, description?: string, category: string = 'GENERAL'): Promise<boolean> {
  try {
    await prisma.settings.upsert({
      where: { key },
      update: { value, description, category },
      create: { key, value, description, category },
    });
    return true;
  } catch (error) {
    console.error(`Error setting value for key ${key}:`, error);
    return false;
  }
} 