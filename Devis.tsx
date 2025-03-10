async function handleSave() {
    try {
        const devisData = {
            // Exemple de données à sauvegarder
            clientName: 'John Doe',
            services: [
                { id: '1', quantity: 2 },
                { id: '2', quantity: 1 }
            ],
            totalPrice: 100.0
        };

        const response = await fetch('/api/devis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(devisData),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        const data = await response.json();
        console.log('Devis sauvegardé avec succès:', data);
    } catch (error) {
        console.error('Erreur:', error);
    }
} 