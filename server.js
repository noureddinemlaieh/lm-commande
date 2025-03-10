app.post('/api/devis', async (req, res) => {
    try {
        const devisData = req.body;
        // Logique pour sauvegarder le devis dans la base de données
        res.status(200).json({ message: 'Devis sauvegardé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du devis:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}); 