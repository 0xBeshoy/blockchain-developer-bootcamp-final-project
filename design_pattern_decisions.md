# Design Patterns

## Inheritance and Interfaces
* ```Escrow Contract``` is inheriting the ownership and access control permissions from the OpenZepplin ```Ownable``` contract.

---
## Access Control Design Patterns
* ```updateEscrowAmount()``` is protected using the ```onlyOwner``` modifier inherited from OpenZepplin.
* ```UpdateEscrowConditions()``` is protected using the ```onlyOwner``` modifier inherited from OpenZepplin.
* ```buyerDispute()``` is protected using the ```onlyOwner``` modifier inherited from OpenZepplin.

All the above functions are protected against unauthorized access from the `Seller` or the `Buyer` or from any other interested party who may be wanting to manipulate the Escrow transaction.
