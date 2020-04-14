from contract import Token,TokenInfo
from privateKey import my_address, private_key
from web3.auto import w3


def setup():
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.setTokenInfo(TokenInfo.address).buildTransaction({
        'nonce': nonce,
        'gasPrice': 3 * (10 ** 9)
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("设置tokenInfo地址交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("交易成功")
    else:
        print("交易失败")


def getTokenInfoAddress():
    address = Token.functions.tokenInfo().call()
    print("当前tokenInfo的地址为:",address)



getTokenInfoAddress()
setup()
getTokenInfoAddress()