// SPDX-License-Identifier: MIT

pragma solidity =0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";


/// @title Escrow Contract
/// @author Beshoy Shehata | https://twitter.com/0xBeshoy
/// @notice A trustless SmartContract that enables two parties to settle transfer of ETHER
/// @dev .

contract Escrow is Ownable {

    // Variables
    enum EscrowType {
        AGREEMENT_BASED,        // An agreement/delivery based escrow type, where the buyer is the one who confirms the delivery
        TIME_BASED              // A time based where funds will be released after the specified period of time passes
    }

    enum EscrowStatus {
        NOT_INIT,               // Escrow isn't initiated yet
        WAITING_CONFIRMATION,   // Escrow awaiting for the buyer and the seller to confirm on the agreement
        WAITING_PAYMENT,        // Escrow waiting for buyer to deposit escrow amount
        WAITING_AGREEMENT,      // If escrow type is AGREEMENT_BASED, will use this value
        WAITING_TIME,           // If escrow type is TIME_BASED, will use this value
        DISPUTE,                // If escrow had problems and the wallet admin should release/refund the escrowAmount
        COMPLETED               // Escrow is finished and seller recieved their funds  
    }

    // variable definitions for the current type and status of the escrow
    EscrowType public ctrctType;
    EscrowStatus public ctrctStatus;

    // variable defintions for escrow aggrement
    bool public buyerAgrees;
    bool public sellerAgrees;
    uint public escrowAmount;

    // If contract type is TIME_BASED, escrowReleaseDate must be assigned a value. escrowInitDate is the unix time of the contract initialization time
    uint escrowInitDate;
    uint escrowReleaseDate;

    address public buyerAddress;
    address payable public sellerAddress;
    address payable escrowWallet;

    // escrowId will be generated on the fly to assign a random number for the contract, so it could be used in a mapping to get a specific escrow
    uint[] public escrowId;

    
    // Escrow Transaction Struct
    struct EscrowTx {
        uint escrow_id;
        EscrowType escrow_type;
        EscrowStatus escrow_status;
        address buyer;
        address seller;
        address wallet;
        uint amount;
        uint init_date;
        uint release_date;
    }

    EscrowTx public escrowInstance;


    // Mappings

    // Get escrow struct by its ID
    mapping(uint => EscrowTx) escrowByID;


    // Modifiers

    modifier onlyBuyer() {
        require(msg.sender == buyerAddress, "Only buyer can call this function.");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == sellerAddress, "Only seller can call this function.");
        _;
    }

    modifier escrowNotStarted() {
        require(ctrctStatus == EscrowStatus.NOT_INIT, "Escrow already started before.");
        _;
    }

    // Functions
    constructor(
        address _buyer, 
        address payable _seller, 
        address payable _wallet,
        EscrowType _type,
        uint _unlockDate,
        uint _amount
    ) {
        buyerAddress = _buyer;
        sellerAddress = _seller;
        escrowWallet = _wallet;
        ctrctType = _type;
        escrowAmount  =_amount;
        escrowInitDate = block.timestamp;
        if(escrowInstance.escrow_type == EscrowType.TIME_BASED){
            escrowReleaseDate = _unlockDate;
        } else if(escrowInstance.escrow_type == EscrowType.AGREEMENT_BASED){
            escrowReleaseDate = 0;
        }


    }
}