require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const compiledBillSystem = require('./build/BillSystem.json');

const provider = new HDWalletProvider(
    process.env.MNEMONIC,
    process.env.RINKEBY_URL
);

const web3 = new Web3(provider);

let result;

const deploy = async () => {
    const accounts = await web3.eth.getAccounts().catch(err => console.log(err));
    console.log('Attempting to deploy from account : ', accounts[0]);

    result = await new web3.eth.Contract(JSON.parse(compiledBillSystem.interface))
        .deploy({ data: compiledBillSystem.bytecode })
        .send({ from: accounts[0], gas: "0x3d0900" })
        .catch(err => {console.log(err)})
    console.log('Contract deployed to : ', result.options.address);
    provider.engine.stop();
}

deploy();
