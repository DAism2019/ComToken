# 测试代币合约，内容主要有：
# 1、纪念币创建
# 2、纪念币发行
# 3、纪念币列举
# 4、纪念币交易
# 5、纪念币元数据
# 6、纪念币最初购买者
# 7、纪念币总数量
# 8、更改纪念币价格与URI
from contract import Token
from privateKey import my_address, private_key
from os.path import dirname, abspath
# from web3.auto.infura.rinkeby import w3
from web3.auto import w3
from urllib.request import urlopen
from json import loads
import ssl

#金质纪念币，发行量10个。单价66.66ETH，奖励1,500,000NDT和150 Rep（声望）
#玫瑰金纪念币，发行量46个。单价46.66ETH，奖励1,000,000个NDT和100 Rep。
#银质纪念币，发行量366个，单价3.66ETH，奖励88,000个NDT和8.8 Rep
#鼠年纪念币，发行量6666个，单价0.6666ETH，奖励16,000个NDT和1.6 Rep

# 用来进行https访问
ssl._create_default_https_context = ssl._create_unverified_context
beneficiary = '0x2267E877215fC21514BF507F30f553AF2342b6c2'
work_address = '0x2267E877215fC21514BF507F30f553AF2342b6c2'


#获取发行纪念币时的相关信息，包含价格、上限、图标等
def getInfos():
    with open("./infos.json") as f:
        infos = loads(f.read())
    return infos


#获取图标SVG源码
def getIcon(svg_name):
    file_name = './image/' + svg_name
    with open(file_name) as f:
        svg = f.read()
    return svg


#纪念币链上信息
def getTypeAmount():
    amount = Token.functions.nonce().call()
    print("当前创建的纪念币数量为:", amount, "编号分别为:")
    for i in range(amount):
        index = (i + 1) << 128
        print("当前纪念币的类型编号为:", hex(index))
        info = Token.functions.getInfoByNonce(i+1).call()
        print("纪念币创建者为:", info[0][0])
        print("纪念币收益人为:", info[0][1])
        print("发行上限为:", info[1][0])
        print("已发行数量为:", info[1][1])
        print("出售上限为:", info[1][2])
        print("已出售数量为:", info[1][3])
        print("发行价格为:", info[1][4] / 10**18, " ETH")
        baseURI = Token.functions.getTypeURI(i+1).call()
        print("基准URI为:",baseURI)



# createCoin(uint _limit, uint _buyLimt, uint _price,address payable _beneficiary, string calldata _baseURI, string calldata _icon)
#创建纪念币
# coin_name [gold,rosegold,silver,mouse]
def createCoin(coin_name):
    infos = getInfos()
    info = infos[coin_name]
    price = int(info['price'] * (10**18))
    amount = info['amount']
    svg = getIcon(info['icon'])
    args = [0,amount, price, beneficiary, 'https://kaihua.xyz/nd/token/',svg]
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.createToken(*args).buildTransaction({
        'nonce': nonce,
        # 'gas':9000000,
        'gasPrice': 3 * (10 ** 9)
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("创建" + coin_name + "纪念币交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("交易成功")
    else:
        print("交易失败")


#获取纪念币余额
def getTokenBalance(address):
    balance = Token.functions.balanceOf(address).call()
    print("当前地址", address, "的代币数量为:", balance)
    ids = Token.functions.getBalances(address).call()
    print("所有代币的ID为:")
    for id in ids:
        print(hex(id))


#购买纪念币
def buyCoin(token_type, owner):
    args = [token_type, owner]
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.buyToken(*args).buildTransaction({
        'nonce': nonce,
        'value': int(0.12 * 10**18)
        # 'gas':300000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("购买纪念币交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("交易成功")
    else:
        print("交易失败")


def mintToken(token_type,owners):
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.mintToken(token_type,owners).buildTransaction({
        'nonce': nonce,
        # 'gas':300000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("赠送纪念币交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("交易成功")
    else:
        print("交易失败")


#纪念币发行总数量
def getSupply():
    supply = Token.functions.totalSupply().call()
    print("当前所有纪念币数量为:",supply)



#获取纪念币元数据
def getTokenURI(token_id):
    uri = Token.functions.tokenURI(token_id).call()
    print("当前编号为:", token_id, "的URI为:",uri)
    with urlopen(uri) as response:
        if response.status == 200:
            print(loads(response.read()))
        else:
            print("访问uri错误")


#更改纪念币价格
def changePrice(typeId,newPrice):
    args = [typeId, int(newPrice * 10**18)]
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.changePrice(*args).buildTransaction({
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


#更改baseuri
def changeBaseURI(typeId,new_uri):
    args = [typeId, new_uri]
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = Token.functions.changeBaseURI(*args).buildTransaction({
        'nonce': nonce,
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("更改baseURI交易已经发送")
    result = w3.eth.waitForTransactionReceipt(hash)
    if result.status == 1:
        print("更改成功")
    else:
        print("更改失败")


# https://rinkeby.opensea.io/assets/0xA064202d4EBd9bD618082c002d4a4C0f0DB0Cfb3/340282366920938463463374607431768211457
# https://rinkeby.opensea.io/assets/0xA064202d4EBd9bD618082c002d4a4C0f0DB0Cfb3/680564733841876926926749214863536422913
# createCoin('gold')
# createCoin('rosegold')
# createCoin('silver')
# createCoin('mouse')
# getTypeAmount()
# changeBaseURI(0x100000000000000000000000000000000,"https://kaihua.xyz/daism/token/")

# buyCoin(0x200000000000000000000000000000000,my_address)
# getTokenBalance(my_address)
# buyCoin(0x300000000000000000000000000000000,work_address)
# mintToken(0x200000000000000000000000000000000,[my_address])
# getTokenBalance(work_address)
getTokenURI(0x100000000000000000000000000000001)
# getTokenURI(0x400000000000000000000000000000001)
# getSupply()
# getOrigin(0x200000000000000000000000000000001)
# changePrice(0x100000000000000000000000000000000,0.008)

