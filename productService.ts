export async function getAllProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
} 