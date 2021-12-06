const Escrow = artifacts.require("Escrow");


contract("EscrowContract", (accounts) => {
    const owner = accounts[0];
    const buyer = accounts[1];
    const seller = accounts[2];
    let escrow_id = 0;
    let escrowType = 0;
    let escrowAmount = web3.utils.toWei('10', 'ether');
    let escrowReleaseDate = 0;
    const BN = web3.utils.BN;

    beforeEach(async () => {
        escrowInstance = await Escrow.new({
            from: owner
        });
        //assert.equal(await web3.eth.getBalance(escrowInstance.address), 0);
    });

    it("[1] - Should be deployed successfully, initial balance equals 0, and admin set correctly.", async () => {
        // const escrowInstance = await Escrow.deployed();
        // console.log(escrowContract.address, owner, buyer, seller);
        const balance = await escrowInstance.getBalance();
        const _owner = await escrowInstance.owner();
        // console.log(balance);
        assert.equal(balance.valueOf(), 0), "Initial Balance of contract should be ZERO";
        assert.equal(_owner, owner, "Wrong contract admin was set")
    })


    it("[2] - Wallet address should be set to contract address.", async () => {
        // const escrowInstance = await Escrow.deployed();
        const wallet = await escrowInstance.WALLET();
        assert.equal(wallet, escrowInstance.address, "Wrong WALLET address was set")
    })


    it("[3] - Should initialize a new escrow successfully.", async () => {
        await escrowInstance.escrowInit(escrowType, buyer, seller, escrowAmount, escrowReleaseDate);
        const _id = await escrowInstance.getEscrowID.call()
        // console.log(_id.toNumber());
        const escrow = await escrowInstance.EscrowDB(_id, {
            from: buyer
        })
        // console.log(escrow[0].toString());
        assert.equal(escrow[5].toString(), buyer, "Wrong Buyer")
        assert.equal(escrow[6].toString(), seller, "Wrong Seller")
        assert.equal(escrow[7].toString(), await escrowInstance.WALLET(), "Wrong Wallet")
        assert.equal(escrow[8].toString(), escrowAmount, "Wrong Amount")
    })

    it("[4] - Should allow parties to agree on escrow terms.", async () => {

        await escrowInstance.escrowInit(escrowType, buyer, seller, escrowAmount, escrowReleaseDate);
        const _id = await escrowInstance.getEscrowID.call({
            from: owner
        });
        await escrowInstance.partiesAgreement(_id, {
            from: buyer
        });
        await escrowInstance.partiesAgreement(_id, {
            from: seller
        });
        const escrow = await escrowInstance.EscrowDB.call(_id, {
            from: owner
        });
        const buyerAgree = await escrow[3];
        const sellerAgree = await escrow[4];

        assert.equal(_id.toNumber(), escrow[0].toNumber(), "Escrow ID not found")
        console.log("          --- Escrow ID found")
        assert.equal(escrow[2], 3, "Parties should agree first");
        console.log("          --- Parties agree")
        assert.equal(buyerAgree, true, "Buyer must confirm agreement");
        console.log("          --- Buyer confirmed")
        assert.equal(sellerAgree, true, "Seller must confirm agreement.");
        console.log("          --- Seller confirmed")
    })

    it("[5] - Should fail if one party only agreed", async () => {
        await escrowInstance.escrowInit(escrowType, buyer, seller, escrowAmount, escrowReleaseDate);
        const _id = await escrowInstance.getEscrowID.call({
            from: owner
        });
        await escrowInstance.partiesAgreement(_id, {
            from: buyer
        });
        await escrowInstance.partiesAgreement(_id, {
            from: accounts[4]
        });
        const escrow = await escrowInstance.EscrowDB.call(_id, {
            from: owner
        });
        const buyerAgree = await escrow[3];
        const sellerAgree = await escrow[4];
        assert.equal(escrow[2], 1, "Escrow status shouldn't change when only one party confirms the escrow terms");
    })

    it("[6] - If escrow type is AGREEMENT_BASED and buyer confirms, seller should be able to withdraw funds successfully.", async () => {
        await escrowInstance.escrowInit(escrowType, buyer, seller, escrowAmount, escrowReleaseDate);     
        let oldBalance = await web3.eth.getBalance(seller);
        const _id = await escrowInstance.getEscrowID.call({
            from: owner
        });     
        await escrowInstance.partiesAgreement(_id, {
            from: buyer
        });
        await escrowInstance.partiesAgreement(_id, {
            from: seller
        });
        await escrowInstance.buyerDeposit(_id, {
            value: escrowAmount,
            from: buyer
        })
        await escrowInstance.buyerConfirmAgreement(_id, {
            from: buyer
        })
        const escrow = await escrowInstance.EscrowDB.call(_id, {
            from: owner
        });
        await escrowInstance.sellerWithdraw(_id, {
            from: seller
        })
        let newBalance = await web3.eth.getBalance(seller);
        assert.equal(await escrow[2], 8, "Escrow Status should be COMPLETE for the seller to be able to withdraw")
        console.log("          --- Escrow status changed to COMPLETE successfully.")
        assert.isAbove(parseFloat(web3.utils.fromWei(newBalance, "ether")), parseFloat(web3.utils.fromWei(oldBalance, "ether")), "Withdrawal Failed")
        console.log("          --- Funds transferred successfully.")
    })
})