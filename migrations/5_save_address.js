const fsService = require('../scripts/fileService');
const fileName = "./test/address.json";

const ComToken = artifacts.require("ComToken");
const TokenInfo = artifacts.require("TokenInfo");


const data = {
    "ComToken": ComToken.address,
    "TokenInfo":TokenInfo.address
}

module.exports = function(deployer) {
    fsService.writeJson(fileName, data);
    console.log('address save over');
};


