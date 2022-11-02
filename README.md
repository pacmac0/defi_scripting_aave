### Aave protocol interaction
In this project we will interact directly with the Aave protocol on chain to automate defi functionalities and learn more about the particularities of such protocols.

### Development
For development we use a new method to interact with the blockchain. Instead of deploying mocks to our local test chain, we will use our node provider to fork mainnet locally and get the necessary functionality, state and data made available localy.

Aave works with a address provider contract from which we can get the contract addresses. Therefore we have to first get that and from the address it returns for the actuall lending-pool we grab the pool contract. 
To import these contract files, like the once used in the Lending-pool interface, we can add them from npm with
```bash
yarn add --dev @aave/protocol-v2
```
instead of adding the interfaces locally and pointing to them.

=> Use Alchemy node, infura node ran into errors that couldnt be resolved. 

### Resources
- [Aave docs](https://docs.aave.com/developers/v/2.0/)

