import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';

const DEGEN_TOKEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // DEGEN token address
const RAFFLE_CONTRACT_ADDRESS = '0x2026eD696e1bbA70eC3Ff3F7Dc95FE0E851bd928'; // Replace with deployed contract address
const TICKET_PRICE = 10; // Precio en DEGEN por boleto

const BuyTickets = () => {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [ticketAmount, setTicketAmount] = useState(1);
  const [approvedAmount, setApprovedAmount] = useState(BigInt(0));

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
    hash: approveData?.hash
  });

  const { isLoading: isBuying } = useWaitForTransaction({
    hash: buyTicketsData?.hash
  });

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

    // Calcular el total exacto en wei
    const totalAmount = parseEther((TICKET_PRICE * ticketAmount).toString());

    // Solo aprobar si la cantidad aprobada es menor que la cantidad necesaria
    if (approvedAmount < totalAmount) {
      approve({
        args: [RAFFLE_CONTRACT_ADDRESS, totalAmount]
      });
    } else {
      buyTickets({
        args: [ticketAmount]
      });
    }
  };

  // Calcular el total en DEGEN
  const totalInDegen = ticketAmount * TICKET_PRICE;

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
          Cantidad de Boletos
        </label>
        <input
          type="number"
          min="1"
          value={ticketAmount}
          onChange={(e) => setTicketAmount(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Precio por boleto: {TICKET_PRICE} DEGEN
        </p>
        <p className="text-sm text-gray-700">
          Total: {totalInDegen} DEGEN
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