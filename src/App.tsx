import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProductsPage from './pages/Products';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        {/* Ajoutez vos autres routes ici */}
      </Routes>
    </Router>
  );
};

export default App; 