import React, { useState } from 'react';

interface StarPackage {
  id: string;
  amount: number;
  price: number;
  bonus?: number;
}

const packages: StarPackage[] = [
  { id: 'small', amount: 100, price: 4.99 },
  { id: 'medium', amount: 500, price: 19.99, bonus: 50 },
  { id: 'large', amount: 1000, price: 34.99, bonus: 150 },
  { id: 'xlarge', amount: 2000, price: 59.99, bonus: 400 }
];

export default function StarPurchase() {
  const [selectedPackage, setSelectedPackage] = useState<string>('medium');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/stars/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          packageId: selectedPackage
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Kauf');
      }

      // Hier würde die Integration des Zahlungsanbieters erfolgen
      alert('Kauf erfolgreich!');
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Kauf. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Yacoolo Stars kaufen</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-primary-800 rounded-lg p-6 cursor-pointer transition-all ${
              selectedPackage === pkg.id
                ? 'ring-2 ring-secondary-500'
                : 'hover:bg-primary-700'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                {pkg.amount} Stars
              </h3>
              {pkg.bonus && (
                <span className="text-secondary-400 text-sm">
                  +{pkg.bonus} Bonus Stars
                </span>
              )}
              <p className="text-2xl font-bold text-white mt-2">
                {pkg.price.toFixed(2)} €
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="bg-secondary-500 text-white px-8 py-3 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Wird verarbeitet...' : 'Jetzt kaufen'}
        </button>
      </div>
    </div>
  );
} 