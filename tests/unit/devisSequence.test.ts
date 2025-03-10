import { getNextDevisNumber, resetDevisSequence } from '@/services/devisSequence';

describe('Devis Sequence Service', () => {
  beforeEach(async () => {
    await resetDevisSequence();
  });

  test('should generate sequential numbers', async () => {
    const num1 = await getNextDevisNumber();
    expect(num1).toBe('S00001');
    
    const num2 = await getNextDevisNumber();
    expect(num2).toBe('S00002');
  });
}); 