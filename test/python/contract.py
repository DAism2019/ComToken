# from web3.auto.infura.rinkeby import w3
from web3.auto import w3
from json import loads
from os.path import dirname, abspath

#构造对应的合约对象
def init():
    path = dirname(dirname(dirname(abspath(__file__))))
    all_address_path = path + '/test/address.json'
    all_address = loads(open(all_address_path).read())
    token_abi_path = path + '/build/contracts/ComToken.json'
    info_abi_path = path + '/build/contracts/TokenInfo.json'
    contract_token_abi = loads(open(token_abi_path).read())['abi']
    contract_info_abi = loads(open(info_abi_path).read())['abi']
    contract_token = w3.eth.contract(
        address=all_address["ComToken"], abi=contract_token_abi)
    contract_info = w3.eth.contract(
        address=all_address["TokenInfo"], abi=contract_info_abi)
    return contract_token,contract_info


Token,TokenInfo = init()
