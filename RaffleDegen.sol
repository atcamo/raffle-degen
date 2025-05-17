// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RaffleDegen is Ownable, ReentrancyGuard {
    IERC20 public degenToken;
    uint256 public constant TICKET_PRICE = 10 * 10**18; // 10 DEGEN
    uint256 public constant POOL_PERCENTAGE = 70;
    uint256 public constant BURN_PERCENTAGE = 30;
    
    uint256 public totalTickets;
    mapping(address => uint256) public userTickets;
    address[] public participants;
    
    event TicketPurchased(address indexed buyer, uint256 amount);
    event RaffleDrawn(address indexed winner, uint256 amount);
    event TokensBurned(uint256 amount);
    
    constructor(address _degenToken) Ownable(msg.sender) {
        degenToken = IERC20(_degenToken);
    }
    
    function buyTickets(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        uint256 totalCost = _amount * TICKET_PRICE;
        
        require(
            degenToken.transferFrom(msg.sender, address(this), totalCost),
            "Transfer failed"
        );
        
        userTickets[msg.sender] += _amount;
        totalTickets += _amount;
        
        for(uint i = 0; i < _amount; i++) {
            participants.push(msg.sender);
        }
        
        emit TicketPurchased(msg.sender, _amount);
    }
    
    function drawRaffle() external onlyOwner {
        require(totalTickets > 0, "No tickets sold");
        
        uint256 totalPrize = degenToken.balanceOf(address(this));
        uint256 prizeAmount = (totalPrize * POOL_PERCENTAGE) / 100;
        uint256 burnAmount = (totalPrize * BURN_PERCENTAGE) / 100;
        
        // Select winner
        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % totalTickets;
        address winner = participants[winnerIndex];
        
        // Transfer prize
        require(
            degenToken.transfer(winner, prizeAmount),
            "Prize transfer failed"
        );
        
        // Burn tokens
        require(
            degenToken.transfer(address(0), burnAmount),
            "Burn transfer failed"
        );
        
        emit RaffleDrawn(winner, prizeAmount);
        emit TokensBurned(burnAmount);
        
        // Reset raffle
        delete participants;
        totalTickets = 0;
    }
    
    function getUserTickets(address _user) external view returns (uint256) {
        return userTickets[_user];
    }
    
    function getTotalTickets() external view returns (uint256) {
        return totalTickets;
    }
} 