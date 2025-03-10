interface CreateDevisFormProps {
  onSuccess: () => void;
}

const CreateDevisForm: React.FC<CreateDevisFormProps> = ({ onSuccess }) => {
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // ... logique de soumission existante ...

    // Après la création réussie du devis
    onSuccess();
  };

  // ... reste du code existant ...
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Contenu du formulaire */}
      <button type="submit">Créer un devis</button>
    </form>
  );
};

export default CreateDevisForm; 