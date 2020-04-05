const fsService = require('../scripts/fileService');
const fileName = "./test/address.json";

const MoleCoin = artifacts.require("MoleCoin");


const data = {
    "MoleCoin": MoleCoin.address
}

module.exports = function(deployer) {
    fsService.writeJson(fileName, data);
    console.log('address save over');
};
