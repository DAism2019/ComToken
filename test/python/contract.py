from web3.auto.infura.rinkeby import w3
# from web3.auto import w3
from json import loads
from os.path import dirname, abspath

#构造对应的合约对象
def init():
    path = dirname(dirname(dirname(abspath(__file__))))
    all_address_path = path + '/test/address.json'
    all_address = loads(open(all_address_path).read())
    rep_abi_path = path + '/build/contracts/ComToken.json'
    contract_rep_abi = loads(open(rep_abi_path).read())['abi']
    contract_rep = w3.eth.contract(
        address=all_address["ComToken"], abi=contract_rep_abi)
    return contract_rep


Token = init()
