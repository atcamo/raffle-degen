import { useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import BuyTickets from './components/BuyTickets';

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-purple-900 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-4 text-purple-900">
                      Raffle DEGEN
                    </h1>
        <p className="text-center mb-6 text-gray-700">
                      Compra boletos para participar en el sorteo de DEGEN tokens.
                      Cada boleto cuesta 10 DEGEN.
                    </p>
                    <BuyTickets />
                  </div>
                </div>
  );
}
