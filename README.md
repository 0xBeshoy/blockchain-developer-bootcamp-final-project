# Blockchain Developer Bootcamp Final Project

# Decentralized Escrow dApp


## Deployed dApp Demo Link:
* [Escrow dApp](https://escrowdapp.vercel.app/)  


## Public Address for Certification NFT:
```json
 0xc2615ad6938235dEb58aA48515727F1d0Ce598E6 
 ```

--- 

## Local Development:

### Prerequisites: 
* Nodejs
* Truffle
* Ganache

### Local Deployment Flow: 

*   Run ```npm install``` to download and install project dependencies.
*   ```ganache-cli``` or ```Ganache GUI``` should be running first before deploying
*   Run the command ```npm run all-dev``` in case you're using ```ganache-cli```, ***OR***  ```npm run all-dev-gui``` in case you're using ```Ganache GUI``` this script command will run the following commands in their respective order:
       * ```truffle compile```
       * ```migrate --reset --network development``` | Development network will accept any network id.
       * ```copyfiles -f -V build/contracts/*.json ./client/abi/``` to copy **ABI** files to the ```client``` folder to be used by `web3js` instance
       * ```lite-server --baseDir='client'``` to spin-up a local server to serve the front-end
* Run ```truffle test``` to run smart contracts tests.
---
### Mainnet and Testnet Deployment Flow: 

* ```.secrets.json``` file should first be populated with the mnemonic of the wallet in which the contract will be deployed from, and the infura project id
* In ```truffle-config.js``` file, un-comment the network in which you'll be deploying to, in our case the network is `ropsten`, and fill the needed details like the ***provider*** and ***infura*** network link
* Also, when deploying to another network other than `ropsten`, update `package.json` script `"truffle-prod"` and change the network name to your network.

---
## Project Description: 
The decentralized escrow dapp allows two parties to have a trustless escrow transaction based on one of two criteria. *01) Agreement/Delivery based escrow* ***OR*** *02) Time based escrow*. 
- In case of the agreement based escrow type, the buyer should first confirm the delivery of the goods/services so the seller will be able to withdraw their funds.
- In case of time base escrow type, the agreed on period have to pass first for the seller to be able to withdraw their funds.
  
### Deployed Contract Address (ropsten):
```json
0xF26c2DDB69fAAFBD29e0F804633796a10d2DC7f2
```

### User Interaction Flow: 

1. Any wallet address user first initiates a transaction with the specified requirements of the escrow, like the buyer wallet, the seller wallet, the amount, and the end date in case of a time based escrow
2. Both parties should first agree and confirm the escrow terms, so the buyer will be able to deposit the amount of the escrow
3. After both parties confirm, the escrow transaction status will change to be waiting the buyer to deposit the specified escrow amount
4. Two cases will arise here:
   1. If escrow is Agreement_Based, the buyer should confirm delivery first. The seller have the right to make a dispute in case of delivery and not being paid. Only wallet admin is the person allowed to make this action
   2. If escrow is Time_Based, the specified end date should pass first. The buyer have the right to make a dispute for a refund in case of making a deposit and not being delivered the agreed on goods/services. Only wallet admin is the person allowed to make this action.
5. After confirmation, or time passed, the funds will be available for the seller to withdraw and the escrow transaction status will be set to COMPLETE.

---
### Directory Structure:
* `build` folder : The deployed contracts ABI files
* `client` folder : Frontend JS/HTML/CSS source code 
* `contracts` folder : Solidity smart contracts source code
* `migrations` folder : Deployment scripts for Truffle
* `test` folder : Smart contracts truffle test source code
* `.secrets.json` file : HDWallet mnemonic and infura project id variables
* `package.json` file : Nodejs dependencies and scripts file
* `truffle-config` file : Used by Truffle for deployment and testing

---

### Features to be done:
1. More escrow transaction statuses which will allow both parties to set milestones
2. Better UI/UX
3. Separate Admin actions and escrow parties actions to different pages based on logged-in user
