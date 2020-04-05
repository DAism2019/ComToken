from contract import MoleCoin
from web3.auto.infura.rinkeby import w3
from privateKey import my_address, private_key
# from web3.auto import w3


def getName():
    name = MoleCoin.functions.name().call()
    print("当前合约的名字为:",name)
    symbol = MoleCoin.functions.symbol().call()
    print("当前合约的符号为:",symbol)

def getTokenIdBase(tokenId):
    base = MoleCoin.functions.getTokenIdBase(tokenId).call()
    print("base:",base)

def getType(tokenId):
    type = MoleCoin.functions.getType(tokenId).call()
    print("类型为:",hex(type))
    typeBase = MoleCoin.functions.getTypeBase(type).call()
    print("类型序号为:",typeBase)
    isType = MoleCoin.functions.isType(type).call()
    print("是否类型:",isType)



#更改纪念币价格
def changePrice(typeId,newPrice):
    args = [typeId, int(newPrice * 10**18)]
    print(args)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = MoleCoin.functions.changePrice(*args).buildTransaction({
        'nonce': nonce,
        'gas':300000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("更改纪念币价格交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("更改成功")
    else:
        print("更改失败")


# getName()
# getType(0x400000000000000000000000000000001)
changePrice(0x100000000000000000000000000000000,0.008)
# isType = MoleCoin.functions.isType(0x100000000000000000000000000000000).call()
# print("是否类型:",isType)
