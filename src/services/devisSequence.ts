import prisma from '@/lib/prisma';

export const getNextDevisNumber = async () => {
  try {
    console.log('Connexion à la base de données...');
    
    const sequence = await prisma.sequence.findUnique({
      where: { name: 'devis' },
    });

    console.log('Séquence trouvée :', sequence);

    let nextValue: number;
    
    if (!sequence) {
      console.log('Création d\'une nouvelle séquence...');
      const newSequence = await prisma.sequence.create({
        data: {
          name: 'devis',
          value: 1,
        },
      });
      nextValue = newSequence.value;
    } else {
      console.log('Incrémentation de la séquence existante...');
      const updatedSequence = await prisma.sequence.update({
        where: { name: 'devis' },
        data: { value: { increment: 1 } },
      });

      nextValue = updatedSequence.value;
    }

    // Formater le numéro avec le préfixe et le padding
    const formattedNumber = `DEV-${String(nextValue).padStart(6, '0')}`;
    console.log('Numéro de devis généré :', formattedNumber);
    
    return formattedNumber;
  } catch (error) {
    console.error('Erreur détaillée :', error);
    throw new Error('Impossible de générer le numéro de devis. Veuillez vérifier la connexion à la base de données.');
  }
};

export const resetDevisSequence = async () => {
  try {
    await prisma.devisSequence.deleteMany({});
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la séquence :', error);
    throw new Error('Impossible de réinitialiser la séquence');
  }
}; 