export const calculateDevisTotals = (sections) => {
  let totalHT = 0;
  let totalTVA = 0;
  
  sections.forEach(section => {
    section.prestations.forEach(prestation => {
      // Ajouter le prix de la prestation
      const prestationHT = prestation.quantity * prestation.unitPrice;
      totalHT += prestationHT;
      totalTVA += prestationHT * (prestation.tva / 100);
      
      // Ajouter uniquement les matériaux facturables
      prestation.materials.forEach(material => {
        if (material.billable !== false) {
          const materialHT = material.quantity * material.price;
          totalHT += materialHT;
          totalTVA += materialHT * (material.tva / 100);
        }
      });
    });
  });
  
  return {
    totalHT,
    totalTVA,
    totalTTC: totalHT + totalTVA
  };
}; 