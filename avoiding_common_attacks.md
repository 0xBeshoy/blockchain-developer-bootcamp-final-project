# Security Measures

## Unprotected Ether Withdrawal - (SWC-105)
* ```Escrow Contract``` is protected by the ```Ownable``` access control library using the ```onlyOwner``` modifier, which helps to protect against any unauthorized access to funds. Also, any funds related to the ```Buyer``` of the escrow is protected with the ```onlyBuyer``` modifier, the same applies for the ```Seller``` with the ```onlySeller``` modifier, of-course after certain conditions are met.

--- 

## Outdated Compiler Version - (SWC-102)
* The ```Escrow Contract``` is using recent stable compiler version ```0.8.8```.

---

## Floating Pragma - (SWC-103)
* A specific compiler version ```0.8.8``` is used to avoid any bugs introduced in any other old/new compiler version.

---

## Checking Conditions using Require()
* Always using the ```require()``` function when applicable to make sure certain conditions are met before calling continuing the function call.
* 