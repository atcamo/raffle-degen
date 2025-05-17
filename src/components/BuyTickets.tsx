import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import FrameSDK from '@farcaster/frame-sdk';

const DEGEN_TOKEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // DEGEN token address
const RAFFLE_CONTRACT_ADDRESS = '0x2026eD696e1bbA70eC3Ff3F7Dc95FE0E851bd928'; // Replace with deployed contract address
const TICKET_PRICE = 10; // Precio en DEGEN por boleto
const privateKey = '2b280e4bcd1a7eed373423a9b0a61f77f9d7527ef8804cdcc82e8d66d312d2b0';

const BuyTickets = () => {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [degenAmount, setDegenAmount] = useState(10);
  const [approvedAmount, setApprovedAmount] = useState(BigInt(0));
  const frame = new FrameSDK();

  // Check allowance
  const { data: allowance = BigInt(0) } = useContractRead({
    address: DEGEN_TOKEN_ADDRESS,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'allowance',
    args: [address, RAFFLE_CONTRACT_ADDRESS],
    enabled: !!address
  }) as { data: bigint };

  // Actualizar la cantidad aprobada cuando cambie el allowance
  useEffect(() => {
    if (allowance) {
      console.log('Allowance actualizado:', allowance.toString());
      setApprovedAmount(allowance);
    }
  }, [allowance]);

  // Get user tickets
  const { data: userTickets = BigInt(0) } = useContractRead({
    address: RAFFLE_CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ name: '_user', type: 'address' }],
        name: 'getUserTickets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'getUserTickets',
    args: [address],
    enabled: !!address
  }) as { data: bigint };

  // Get total tickets
  const { data: totalTickets = BigInt(0) } = useContractRead({
    address: RAFFLE_CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [],
        name: 'getTotalTickets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }
    ],
    functionName: 'getTotalTickets'
  }) as { data: bigint };

  // Approve tokens
  const { write: approve, data: approveData } = useContractWrite({
    address: DEGEN_TOKEN_ADDRESS,
    abi: [
      {
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'approve'
  });

  // Buy tickets
  const { write: buyTickets, data: buyTicketsData } = useContractWrite({
    address: RAFFLE_CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ name: '_amount', type: 'uint256' }],
        name: 'buyTickets',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'buyTickets'
  });

  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      // Después de aprobar, proceder con la compra
      const ticketAmount = degenAmount / TICKET_PRICE;
      buyTickets({
        args: [ticketAmount]
      });
    }
  });

  const { isLoading: isBuying } = useWaitForTransaction({
    hash: buyTicketsData?.hash,
    onSuccess: () => {
      // Notificar a Farcaster que la compra fue exitosa
      frame.postMessage({
        type: 'tx-success',
        message: `¡Compra exitosa! Has comprado ${degenAmount / TICKET_PRICE} boletos por ${degenAmount} DEGEN`
      });
    }
  });

  const handleDegenAmountChange = (value: string) => {
    const amount = Number(value);
    // Asegurarnos de que sea múltiplo de 10
    if (amount >= 10 && amount % 10 === 0) {
      setDegenAmount(amount);
    }
  };

  const handleBuyTickets = async () => {
    if (!address) {
      const injected = connectors.find((c) => c.id === 'injected');
      if (injected) {
        connect({ connector: injected });
      }
      return;
    }

    // Verificar si estamos en la red correcta
    if (chain?.id !== base.id) {
      if (switchNetwork) {
        await switchNetwork(base.id);
      }
      return;
    }

    // Asegurarnos de que la cantidad sea múltiplo de 10
    if (degenAmount % 10 !== 0) {
      console.error('La cantidad debe ser múltiplo de 10');
      frame.postMessage({
        type: 'error',
        message: 'La cantidad debe ser múltiplo de 10'
      });
      return;
    }

    const totalNeeded = parseEther(degenAmount.toString());
    
    console.log('Cantidad en DEGEN:', degenAmount);
    console.log('Total en wei:', totalNeeded.toString());
    console.log('Cantidad aprobada actual:', approvedAmount.toString());

    try {
      // Solo aprobar si la cantidad aprobada es menor que la cantidad necesaria
      if (approvedAmount < totalNeeded) {
        console.log('Necesita aprobación. Cantidad a aprobar:', totalNeeded.toString());
        
        // Notificar a Farcaster que se necesita aprobación
        frame.postMessage({
          type: 'approval-needed',
          message: `Necesitas aprobar ${degenAmount} DEGEN para comprar ${degenAmount / TICKET_PRICE} boletos`
        });
        
        // Aprobar la cantidad exacta que necesitamos
        approve({
          args: [RAFFLE_CONTRACT_ADDRESS, totalNeeded]
        });
        return;
      }

      // Si ya tenemos suficiente aprobación, proceder con la compra
      console.log('No necesita aprobación. Procediendo a comprar.');
      const ticketAmount = degenAmount / TICKET_PRICE;
      buyTickets({
        args: [ticketAmount]
      });
    } catch (error) {
      console.error('Error en la transacción:', error);
      frame.postMessage({
        type: 'error',
        message: 'Error al procesar la transacción'
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-purple-900">Estado del Sorteo</h3>
        <p className="text-sm text-gray-700">
          Total de boletos vendidos: {totalTickets.toString()}
        </p>
        <p className="text-sm text-gray-700">
          Tus boletos: {userTickets.toString()}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Cantidad en DEGEN (múltiplos de 10)
        </label>
        <input
          type="number"
          min="10"
          step="10"
          value={degenAmount}
          onChange={(e) => handleDegenAmountChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Precio por boleto: {TICKET_PRICE} DEGEN
        </p>
        <p className="text-sm text-gray-700">
          Cantidad de boletos: {degenAmount / TICKET_PRICE}
        </p>
      </div>

      <button
        onClick={handleBuyTickets}
        disabled={isApproving || isBuying}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors duration-200"
      >
        {!address ? 'Conecta tu wallet' : 
         chain?.id !== base.id ? 'Cambiar a Base' :
         isApproving ? 'Aprobando...' : 
         isBuying ? 'Comprando...' : 
         'Comprar Boletos'}
      </button>
    </div>
  );
};

export default BuyTickets; 