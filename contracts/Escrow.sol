// SPDX-License-Identifier: MIT

pragma solidity =0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    // Variables
    enum EscrowType {
        AGREEMENT_BASED, // An agreement/delivery based escrow type, where the buyer is the one who confirms the delivery
        TIME_BASED // A time based where funds will be released after the specified period of time passes
    }

    enum EscrowStatus {
        NOT_INIT, // Escrow isn't initiated yet
        WAITING_CONFIRMATION, // Escrow awaiting for the buyer and the seller to confirm on the agreement
        ESCROW_CANCELED, // Escrow is canceled when any or both parties refuse to confirm (may not be used ever, will see)
        WAITING_PAYMENT, // Escrow waiting for buyer to deposit escrow amount
        WAITING_AGREEMENT, // If escrow type is AGREEMENT_BASED, will use this value
        WAITING_TIME, // If escrow type is TIME_BASED, will use this value
        DISPUTE_BUYER, // If escrow had problems and the buyer wants to refund, the WALLET Admin will confirm in case of authenticity. The only condition buyer can refund.
        DISPUTE_SELLER, // If escrow had problems and the seller delivers and didn't receive the funds, the WALLET Admin will confirm in case of authenticity
        COMPLETED // Escrow is finished and seller received their funds
    }

    // Escrow Transaction Struct
    struct EscrowTx {
        uint256 escrow_id;
        EscrowType escrow_type;
        EscrowStatus escrow_status;
        bool buyer_confirm;
        bool seller_confirm;
        address buyer;
        address payable seller;
        address payable wallet;
        uint256 amount;
        uint256 init_date;
        uint256 release_date;
    }

    EscrowTx[] public escrows;

    mapping(uint256 => EscrowTx) public EscrowDB;
    mapping(address => EscrowTx) public EscrowBuyerDB;
    mapping(address => EscrowTx) public EscrowSellerDB;

    uint256[] public allEscrowIds;
    address[] public allEscrowBuyers;
    address[] public allEscrowSellers;

    uint64 public NONCE;
    address payable public WALLET;

    // Modifiers
    /**
    /// @notice onlyBuyer modifier
    /// @dev Used when depositing escrow amount, and withdrawing in case of dispute
     */
    modifier onlyBuyer(uint256 _escrow_id) {
        require(
            EscrowDB[_escrow_id].buyer == msg.sender,
            "Only buyer can call this function"
        );
        _;
    }
    /**
    /// @notice onlySeller modifier
    /// @dev Used when withdrawing funds after agreement terms are met
     */
    modifier onlySeller(uint256 _escrow_id) {
        require(
            EscrowDB[_escrow_id].seller == msg.sender,
            "Only seller can call this function"
        );
        _;
    }

    modifier escrowNotStarted(uint256 _escrow_id) {
        require(
            EscrowDB[_escrow_id].escrow_status == EscrowStatus.NOT_INIT,
            "Escrow already in progress"
        );
        _;
    }

    /**
    /// @notice escrowNotStarted modifier
    /// @dev Usde to make sure both parties are confirming escrow terms before buyer can deposit any funds
     */
    modifier escrowPartiesAgreed(uint256 _escrow_id) {
        require(
            EscrowDB[_escrow_id].buyer_confirm == true &&
                EscrowDB[_escrow_id].seller_confirm == true,
            "Make sure both parties are agreeing on escrow terms"
        );
        _;
    }

    /**
    /// @dev Setting the NONCE and the WALLER address at contract creation
     */
    constructor() payable {
        NONCE = uint64(block.difficulty);
        WALLET = payable(this);
    }

    receive() external payable {}

    fallback() external payable {}

    /**
    /// @notice Get the ID of the last created escrow.
    /// @dev This function is used to get the ID when testing the contract
     */
    function getEscrowID() public view returns (uint256) {
        return allEscrowIds[allEscrowIds.length - 1];
    }

    /**
    /// @notice Get information about any given escrow if found
    /// @dev Escrow should exist for the function to work properly
    /// @param _id escrow id
     */
    function getEscrowInfo(uint64 _id)
        public
        view
        returns (
            uint256 _escrow_id,
            EscrowType _escrow_type,
            EscrowStatus _escrow_status,
            bool _buyer_confirm,
            bool _seller_confirm,
            address _buyer,
            address _seller,
            address _wallet,
            uint256 _amount,
            uint256 _init_date,
            uint256 _release_date
        )
    {
        _escrow_id = EscrowDB[_id].escrow_id;
        _escrow_type = EscrowDB[_id].escrow_type;
        _escrow_status = EscrowDB[_id].escrow_status;
        _buyer_confirm = EscrowDB[_id].buyer_confirm;
        _seller_confirm = EscrowDB[_id].seller_confirm;
        _buyer = EscrowDB[_id].buyer;
        _seller = EscrowDB[_id].seller;
        _wallet = EscrowDB[_id].wallet;
        _amount = EscrowDB[_id].amount;
        _init_date = EscrowDB[_id].init_date;
        _release_date = EscrowDB[_id].release_date;
        return (
            _escrow_id,
            _escrow_type,
            _escrow_status,
            _buyer_confirm,
            _seller_confirm,
            _buyer,
            _seller,
            _wallet,
            _amount,
            _init_date,
            _release_date
        );
    }

    /**
    /// @notice Get the total available balance of the WALLET address
     */
    function getBalance() public view returns (uint256) {
        return WALLET.balance;
    }

    /**
    /// @notice Getting random number to be used to generate a random escrow id.
    /// @dev Using the block.timestamp and the NONCE to get a fairely unique number that will be used to assign the escrow tx an ID
     */
    function getRandomNum() public view returns (uint64) {
        return uint64(uint256(block.timestamp) + uint256(block.number));
    }

    /**
    /// @notice This function will initiate a new escrow with essential details of the escrow
    /// @dev Anybody can call this function, but the buyer and the seller must confirm for the escrow to initiate.
    /// @param _escrowType escrow type, 0 for AGREEMENT_BASED and 1 for TIME_BASED
    /// @param _buyer address of the buyer of the escrow
    /// @param _seller address of the seller of the escrow
    /// @param _escrowAmount escrow amount in wei
    /// @param _escrowReleaseDate set to 0 if type is AGREEMENT_BASED, and with Unix Epoch of the escrow end date if type is TIME_BASED
    /// @return _id of the created escrow transaction, which will be used to call other functions
     */
    function escrowInit(
        EscrowType _escrowType,
        address _buyer,
        address payable _seller,
        uint256 _escrowAmount,
        uint256 _escrowReleaseDate
    ) public returns (uint64) {
        uint64 _id = getRandomNum();
        EscrowDB[_id].escrow_id = _id;
        EscrowDB[_id].escrow_type = _escrowType;
        EscrowDB[_id].escrow_status = EscrowStatus.WAITING_CONFIRMATION;
        EscrowDB[_id].buyer = _buyer;
        EscrowDB[_id].seller = _seller;
        EscrowDB[_id].wallet = WALLET;
        EscrowDB[_id].amount = _escrowAmount;
        EscrowDB[_id].init_date = block.timestamp;
        if (_escrowType == EscrowType.TIME_BASED) {
            require(
                _escrowReleaseDate > block.timestamp,
                "Funds release date must be in the future"
            );
        }
        EscrowDB[_id].release_date = _escrowReleaseDate;
        NONCE++;
        allEscrowIds.push(_id);
        allEscrowBuyers.push(_buyer);
        allEscrowBuyers.push(_seller);
        return _id;
    }

    /**
    /// @notice Buyer and Seller must call this function if they are agreeing to the terms of the contract
    /// @dev After both parties call this function, the status of the transaction will change to EscrowStatus.WAITING_PAYMENT, so the buyer can proceed to buyerDeposit()
    /// @param _id The _id returned from escrowInit() function call which is now the escrow transaction id
     */
    function partiesAgreement(uint64 _id) public {
        // EscrowDB[_id].buyer_confirm = true;
        if (msg.sender == EscrowDB[_id].buyer) {
            EscrowDB[_id].buyer_confirm = true;
        }
        if (msg.sender == EscrowDB[_id].seller) {
            EscrowDB[_id].seller_confirm = true;
        }
        if (
            EscrowDB[_id].buyer_confirm == true &&
            EscrowDB[_id].seller_confirm == true
        ) {
            EscrowDB[_id].escrow_status = EscrowStatus.WAITING_PAYMENT;
        }
    }

    /**
    /// @notice Buyer calls this function after he/she confirms the terms of the escrow with the seller
    /// @dev Only the buyer can call this function after making sure both parties are agreeing to the terms of the escrow
    /// @dev The balance of the buyer is checked and the amount of the escrow is also checked
    /// @param _id The _id returned from escrowInit() function call which is now the escrow transaction id 
     */
    function buyerDeposit(uint64 _id)
        public
        payable
        escrowPartiesAgreed(_id)
        onlyBuyer(_id)
    {
        require(
            EscrowDB[_id].escrow_status == EscrowStatus.WAITING_PAYMENT,
            "Amount Already Transferred"
        );
        require(
            EscrowDB[_id].buyer.balance > msg.value,
            "Insufficient buyer balance"
        );
        require(msg.value == EscrowDB[_id].amount, "Insufficient amount sent");
        payable(WALLET).transfer(msg.value);
        if (EscrowDB[_id].escrow_type == EscrowType.TIME_BASED) {
            EscrowDB[_id].escrow_status = EscrowStatus.WAITING_TIME;
        } else {
            EscrowDB[_id].escrow_status = EscrowStatus.WAITING_AGREEMENT;
        }
    }

    /**
    /// @notice onlyOwner function that can be called in case of making a mistake from the buyer when setting the escrow for the first time
    /// @dev Only the owner/admin of the contract is able to call this funtion
    /// @param _id escrow id number
    /// @param _newAmount the new amount that will be changed to, in wei
     */
    function updateEscrowAmount(uint64 _id, uint256 _newAmount)
        public
        onlyOwner
    {
        EscrowDB[_id].amount = _newAmount;
    }

    /**
    /// @notice onlyOwner function that can be called in case of a dispute arises so the admin will be able to make the escrow transation complete so the seller can withdraw it, or will make it BUYER_DISPUTE so the buyer will be able to get a refund
    /// @dev Only the owner/admin of the contract is able to call this funtion
    /// @param _id escrow id number
    /// @param _newStatus the new status of the escrow (zero based index of the EscrowStatus enum)
    */
    function UpdateEscrowConditions(uint64 _id, EscrowStatus _newStatus)
        public
        onlyOwner
    {
        EscrowDB[_id].escrow_status = _newStatus;
    }

    /**
    /// @notice If escrow type is AGREEMENT_BASED, the buyer will need to call this function if he/she are happy with the seller delivery, so the seller will be able to withdraw the escrow amount
    /// @dev only the buyer can call this function
    /// @param _id escrow transactio id    
     */
    function buyerConfirmAgreement(uint64 _id)
        public
        payable
        onlyBuyer(_id)
        returns (bool)
    {
        require(
            EscrowDB[_id].escrow_type == EscrowType.AGREEMENT_BASED,
            "You can't confirm a TIME_BASED escrow"
        );
        require(
            EscrowDB[_id].escrow_status == EscrowStatus.WAITING_AGREEMENT,
            "Check Agreement with seller first"
        );
        EscrowDB[_id].escrow_status = EscrowStatus.COMPLETED;
        return true;
    }

    /**
    /// @notice Seller will need to call this function to withdraw the funds of the escrow
    /// @dev only the seller is able to call this function, only when the buyer confirms delivery in case of AGREEMENT_BASED, or escrow period ends in case of TIME_BASED
    /// @param _id escrow transaction id    
     */
    function sellerWithdraw(uint64 _id) public payable onlySeller(_id) {
        if (
            EscrowDB[_id].escrow_type == EscrowType.TIME_BASED &&
            block.timestamp < EscrowDB[_id].release_date
        ) {
            payable(EscrowDB[_id].seller).transfer(EscrowDB[_id].amount);
        } else if (
            EscrowDB[_id].escrow_type == EscrowType.AGREEMENT_BASED &&
            EscrowDB[_id].escrow_status == EscrowStatus.COMPLETED
        ) {
            payable(EscrowDB[_id].seller).transfer(EscrowDB[_id].amount);
        } else {
            revert(
                "You're not allowed to withdraw yet, buyer had to confirm the Escrow or the agreed upon time has to pass first."
            );
        }
    }

    // Buyer dispute, when he/she wants a refunds of their funds (function will reset release_date if set). only WALLET admin is allowed to perform this
    function buyerDispute(uint64 _id) public onlyOwner {
        EscrowDB[_id].escrow_status = EscrowStatus.DISPUTE_BUYER;
        EscrowDB[_id].release_date = 0;
    }

    /**
    /// @notice Buyer can call this function in case a dispute happened and the admin approved the authenticity of the buyer claims
    /// @dev only the buyer can call this function
    /// @param _id escrow transaction id   
     */
    function buyerWithdraw(uint64 _id) public payable onlyBuyer(_id) {
        require(
            EscrowDB[_id].escrow_status == EscrowStatus.DISPUTE_BUYER,
            "Admin must approve the dispute first"
        );
        payable(EscrowDB[_id].buyer).transfer(EscrowDB[_id].amount);
    }
}
