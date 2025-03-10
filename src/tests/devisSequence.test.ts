import { getNextDevisNumber } from '../services/devisSequence';

async function testDevisNumber() {
  try {
    const num1 = await getNextDevisNumber();
    console.log('Numéro 1 :', num1);
    
    const num2 = await getNextDevisNumber();
    console.log('Numéro 2 :', num2);
    
    const num3 = await getNextDevisNumber();
    console.log('Numéro 3 :', num3);
  } catch (error) {
    console.error('Test échoué :', error);
  }
}

testDevisNumber(); 