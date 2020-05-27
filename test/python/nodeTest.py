# from web3.auto.infura.rinkeby import w3
from web3.auto import w3


#测试节点是否可连接
connected = w3.isConnected()
print("connected:",connected)
