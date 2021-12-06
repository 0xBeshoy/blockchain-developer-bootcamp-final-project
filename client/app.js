const web3 = new Web3(window.ethereum)

window.userWalletAddress = null;

/**
 * Elements definitions
 */
const userWallet = document.getElementById('userWallet');
const connectButton = document.querySelector("#connectButton");
const loginFirst = document.querySelector("#loginFirst");
const correctNetwork = document.querySelector("#correctNetwork");
const wrongNetwork = document.querySelector("#wrongNetwork");
const notCompatible = document.querySelector("#notCompatible");
const timeBasedType = document.querySelector("#timeBasedType");
const agreementBasedType = document.querySelector("#agreementBasedType");
const buyerAddressInput = document.querySelector("#buyerAddressInput");
const sellerAddressInput = document.querySelector("#sellerAddressInput");
const amountInput = document.querySelector("#amountInput");
const dateInput = document.querySelector("#dateInput");
const createEscrowButton = document.querySelector("#createEscrowButton");
const getEscrowID = document.querySelector("#getEscrowID");
const crntEscrowID = document.querySelector("#crntEscrowID");
const crntEscrowDetails = document.querySelector("#crntEscrowDetails");
const crntEscrowBothConfirm = document.querySelector("#crntEscrowBothConfirm");
const crntEscrowBuyerDeposit = document.querySelector("#crntEscrowBuyerDeposit");
const crntEscrowBuyerConfirm = document.querySelector("#crntEscrowBuyerConfirm");
const crntEscrowSellerWithdraw = document.querySelector("#crntEscrowSellerWithdraw");
const crntEscrowBuyerDispute = document.querySelector("#crntEscrowBuyerDispute");

let ropstenNet = "0x3"
let ganacheNet = "0x539";

// let contract_provider = "http://localhost:8545"

/**
 * Summary. Defining the contract instance from the abi file
 */
let EscrowContract;

/**
 * Summary. load() will be used to load the abi file of the contract when the page loads. Used in the <body onLoad="">.
 */
async function load() {
    EscrowContract = await (await fetch('./abi/Escrow.json')).json();

}

/**
 * Summary. Change network warning status from hidden to shown 
 * Description. use in the connectButton eventListener 
 * @param statusToShow {number} is the zero-index based status in allStatus array variable
 */
function changeConnectionHidden(statusToShow) {
    let allStatus = [correctNetwork, wrongNetwork, notCompatible]
    for (i in allStatus) {
        if (statusToShow == i) {
            allStatus[i].removeAttribute("hidden")
        } else if (statusToShow != i) {
            allStatus[i].setAttribute("hidden", "true")
        }
    }
}


/**
 * Summary. eventFunction to load when page loads for first time before logging in, it will look for the network
 */
// async function loadNetwork() {
//     if (window.ethereum) {
//         let id
//         await web3.eth.net.getId().then(data => id = data);
//         debugger
//         if (id != ropstenNet) {
//             loginFirst.setAttribute("hidden", "false")
//             return false
//         } else {
//             loginFirst.setAttribute("hidden", "true")
//             changeConnectionHidden(0)
//         }
//     }
// }


/**
 * Summary. Function to check window.ethereum found or not when logging in 
 * @returns window.ethereum found or not
 */
async function toggleButton() {
    if (!window.ethereum) {
        connectButton.innerText = "MetaMask isn't installed"
        changeConnectionHidden(2)
        return false;
    } else {
        let _id
        await web3.eth.net.getId().then(data => _id = data);
        if (_id == ropstenNet) {
            changeConnectionHidden(0)
        } else {
            changeConnectionHidden(1)
        }
        whenNetworkChange()
    }
    connectButton.addEventListener("click", loginWithMetaMask);
    window.ethereum.enable();
    // changeConnectionHidden(0)

}

/**
 * Summary. Helper function to strip down the address of the user wallet
 * @param {string} address the current logged in address
 */
function stripAddress(address) {
    let part1 = address.slice(0, 5)
    let part2 = address.slice(-5)
    return `${part1}......${part2}`
}


/**
 * Summary. Helper function to return the current Escrow Type as a number
 */

function getEscrowType() {
    let agreementBased = 0;
    let timeBased = 1;

    if (timeBasedType.checked == true) {
        // agreementBasedType.checked = !agreementBasedType.checked;
        agreementBasedType.checked = null;
        return timeBased;
    } else if (agreementBasedType.checked == true) {
        // timeBasedType.checked = !timeBasedType.checked;
        timeBasedType.checked = null;
        dateInput.value = 0;
        return agreementBased;
    } else {
        return
    };
}


/**
 * Event listeners
 */

timeBasedType.addEventListener("click", getEscrowType)
agreementBasedType.addEventListener("click", getEscrowType)
createEscrowButton.addEventListener('click', createNewEscrow)
crntEscrowBothConfirm.addEventListener("click", agreeOnEscrow)
crntEscrowDetails.addEventListener("click", writeEscrowDetails)
crntEscrowBuyerDeposit.addEventListener("click", buyerDeposit)
crntEscrowBuyerConfirm.addEventListener("click", buyerConfirm)
crntEscrowSellerWithdraw.addEventListener("click", sellerWithdraw)
crntEscrowBuyerDispute.addEventListener("click", buyerDispute)
crntEscrowBuyerRefund.addEventListener("click", buyerRefund)

/**
 * Summary. Logging in with metamask and getting the contract instance to interact with
 * @returns contractInstance 
 */
let contractAddress;
let contractInstance;

async function loginWithMetaMask() {

    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    })
        .catch((err) => {
            console.error(err.message);
            return
        })
    if (!accounts) {
        return
    }

    window.userWalletAddress = accounts[0];
    userWallet.innerText = stripAddress(`${window.userWalletAddress}`)
    connectButton.innerText = 'Disconnect Wallet'


    connectButton.removeEventListener('click', loginWithMetaMask)
    setTimeout(() => {
        connectButton.addEventListener('click', signOutOfMetaMask)
    }, 200)

    // Get the Contract Instance
    let networkId;
    await web3.eth.net.getId().then(data => networkId = data);
    console.log(networkId)
    const deployedNetwork = await EscrowContract.networks[networkId];
    contractAddress = await deployedNetwork.address

    contractInstance = new web3.eth.Contract(
        EscrowContract.abi,
        contractAddress
    )
    // console.log(contractInstance)
    await getNetworkName()
    await whenAccountChange()
    await whenNetworkChange()
    // debugger
    // console.log(networkName)
    return contractInstance

}


/**
 * Summary. Empty all fields after creating a new escrow or after logging out
 */
function emptyFields() {
    buyerAddressInput.value = null;
    sellerAddressInput.value = null;
    amountInput.value = null;
    dateInput.value = null;
    // getEscrowID.value = null;
    crntEscrowID.value = null;
    returnType.innerText = `Escrow Type:`;
    returnStatus.innerText = `Escrow Status:`;
    returnBuyerConfirm.innerText = `Buyer Confirmed:`;
    returnSellerConfirm.innerText = `Seller Confirmed:`;
    returnBuyerAddress.innerText = `Buyer Address:`;
    returnSellerAddress.innerText = `Seller Address:`;
    returnWalletAddress.innerText = `Wallet Address:`;
    returnEscrowAmount.innerText = `Escrow Amount:`;
    returnEscrowStart.innerText = `Escrow Start Date:`;
    returnEscrowEnd.innerText = `Escrow End Date:`;
}

/**
 * Summary. Sign-out of MetaMask
 */
function signOutOfMetaMask() {
    window.userWalletAddress = null
    userWallet.innerText = ''
    connectButton.innerText = 'Connect Wallet'
    emptyFields();

    connectButton.removeEventListener('click', signOutOfMetaMask)
    setTimeout(() => {
        connectButton.addEventListener('click', loginWithMetaMask)
    }, 200)
    // window.location.reload()
}




let networkName;
async function getNetworkName() {
    await web3.eth.net.getNetworkType()
        .then(data => networkName = data)
    console.log(networkName)
}


async function whenAccountChange() {
    await window.ethereum.on('accountsChanged', function (accounts) {
        // console.log("Account changed")
        window.userWalletAddress = accounts[0];
        userWallet.innerText = ""
        userWallet.innerText = stripAddress(`${window.userWalletAddress}`);

    })
};



async function whenNetworkChange() {
    await window.ethereum.on('chainChanged', (_chainId) => {
        // window.location.reload()
        console.log(_chainId);
        if (_chainId == ropstenNet) {
            changeConnectionHidden(0)

        } else {
            signOutOfMetaMask();
            changeConnectionHidden(1)
        }
    })
};


/**
 * Summary. Get latest created escrow transaction.
 */
let EscrowID;
async function getLastEscrow() {
    await contractInstance.methods.getEscrowID().call({
        from: userWalletAddress
    }).then(function (_EscrowID) {
        EscrowID = _EscrowID;
    })

}


/**
 * Summary. Create new escrow
 */
async function createNewEscrow() {
    await contractInstance.methods.escrowInit(
        getEscrowType(),
        buyerAddressInput.value,
        sellerAddressInput.value,
        web3.utils.toWei(amountInput.value, "ether"),
        dateInput.value
    ).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(await receipt)
    });
    await getLastEscrow();
    getEscrowID.innerText = EscrowID;
    emptyFields()

}


/**
 * Summary. Get details of current escrow transaction
 */
let EscrowData;
async function getEscrowDetails() {
    await contractInstance.methods.getEscrowInfo(crntEscrowID.value).call({
        from: userWalletAddress
    }).then(function (_Escrow) {
        EscrowData = _Escrow;
    })
}


/**
 * Summary. Helper function to get the current status of the escrow in plain text
 */
function getStatus(_status_id) {
    let status_obj = [
        {
            index: 0,
            status: "NOT_INIT",
            text: "Escrow isn't initiated yet"
        },
        {
            index: 1,
            status: "WAITING_CONFIRMATION",
            text: "Escrow awaiting for the buyer and the seller to confirm on the agreement"
        },
        {
            index: 2,
            status: "ESCROW_CANCELED",
            text: "Escrow is canceled when any or both parties refuse to confirm"
        },
        {
            index: 3,
            status: "WAITING_PAYMENT",
            text: "Escrow waiting for buyer to deposit escrow amount"
        },
        {
            index: 4,
            status: "WAITING_AGREEMENT",
            text: "If escrow type is AGREEMENT_BASED, will use this value"
        },
        {
            index: 5,
            status: "WAITING_TIME",
            text: "Waiting for the escrow time to pass"
        },
        {
            index: 6,
            status: "DISPUTE_BUYER",
            text: "If escrow had problems and the buyer wants to refund, the WALLET Admin will confirm in case of authenticity"
        },
        {
            index: 7,
            status: "DISPUTE_SELLER",
            text: "If escrow had problems and the seller delivers and didn't receive the funds, the WALLET Admin will confirm in case of authenticity"
        },
        {
            index: 8,
            status: "COMPLETED",
            text: "Escrow is finished and seller received their funds"
        }
    ]

    let status = status_obj.find(status => status.index === _status_id)
    return `Current status is (${status_obj[status_obj.indexOf(status)].status}) --- ${status_obj[status_obj.indexOf(status)].text}`

}


/**
 * Summary. Write Escrow details to page
 */
async function writeEscrowDetails() {
    await getEscrowDetails();
    returnType.innerText = `Escrow Type: ${EscrowData[1] == 0 ? "Agreement Based Escrow" : "Time Based Escrow"}`;
    returnStatus.innerText = `Escrow Status: ${getStatus(parseInt(EscrowData[2]))}`;
    returnBuyerConfirm.innerText = `Buyer Confirmed: ${EscrowData[3] == true ? "Yes" : "Not Yet"}`;
    returnSellerConfirm.innerText = `Seller Confirmed: ${EscrowData[4] == true ? "Yes" : "Not Yet"}`;
    returnBuyerAddress.innerText = `Buyer Address: ${EscrowData[5]}`;
    returnSellerAddress.innerText = `Seller Address: ${EscrowData[6]}`;
    returnWalletAddress.innerText = `Wallet Address: ${EscrowData[7]}`;
    returnEscrowAmount.innerText = `Escrow Amount: ${web3.utils.fromWei(EscrowData[8], "ether")} ETH`;
    returnEscrowStart.innerText = `Escrow Start Date: ${new Date(parseInt(EscrowData[9] * 1000))}`;
    returnEscrowEnd.innerText = `Escrow End Date: ${EscrowData[10] > 0 ? new Date(parseInt(EscrowData[10] * 1000)) : "Escrow Doesn't have an end date, buyer can only confirm delivery"}`;
}


/**
 * Summary. Agree on escrow terms
 */
async function agreeOnEscrow() {
    await contractInstance.methods.partiesAgreement(crntEscrowID.value).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(await receipt)
    })
}


/**
 * Summary. Buyer deposit function
 */
async function buyerDeposit() {
    await contractInstance.methods.buyerDeposit(crntEscrowID.value).send({
        from: userWalletAddress,
        value: EscrowData[8]
    }).then(async function (receipt) {
        console.log(await receipt)
    })
}


/**
 * Summary. Confirming the agreement by the buyer so the seller will be able to withdraw the funds
 */
async function buyerConfirm() {
    await contractInstance.methods.buyerConfirmAgreement(crntEscrowID.value).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(await receipt)
    })
}


/**
 * Summary. Seller withdrawal function
 */
async function sellerWithdraw() {
    await contractInstance.methods.sellerWithdraw(crntEscrowID.value).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(await receipt)
    })
}

/**
 * Summary. Admin Only - Change te status of the escrow to BUYER_DISPUTE so the buyer can make a refund 
 */
async function buyerDispute() {
    await contractInstance.methods.buyerDispute(crntEscrowID.value).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(await receipt)
    })
}


/**
 * Summary. Buyer Only - Get a refund after admin change the status to BUYER_DISPUTE
 */
async function buyerRefund() {
    await contractInstance.methods.buyerWithdraw(crntEscrowID.value).send({
        from: userWalletAddress
    }).then(async function (receipt) {
        console.log(receipt)
    })
}



window.addEventListener("DOMContentLoaded", toggleButton);
