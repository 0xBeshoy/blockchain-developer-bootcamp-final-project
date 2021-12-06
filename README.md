# Blockchain Developer Bootcamp Final Project

## Decentralized Escrow dApp

### Local Development
*   Ganache-cli should be running
*   Run the command ```npm run all-dev``` this script command will run the following commands in their respective order:
       * ```truffle compile```
       * ```migrate --reset --network development```
       * ```copyfiles -f -V build/contracts/*.json ./client/abi/``` to copy abi files to the ```client``` folder
       * ```lite-server --baseDir='client'``` to spin-up a local server to serve the front-end



### Front-End for Demo dApp
* [Escrow dApp](https://escrowdapp.vercel.app/)