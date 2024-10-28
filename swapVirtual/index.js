const dotenv = require('dotenv')
dotenv.config()

const Web3 = require('web3')
const web3 = new Web3('https://base-mainnet.infura.io/v3/200a54a78d294101bbd166a319063408')
const web3Socket = new Web3('wss://base-mainnet.infura.io/ws/v3/200a54a78d294101bbd166a319063408')
const contractUni = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24'

const abiUni = [
  {
    inputs: [
      {internalType: 'uint256', name: 'amountIn', type: 'uint256'},
      {internalType: 'uint256', name: 'amountOutMin', type: 'uint256'},
      {internalType: 'address[]', name: 'path', type: 'address[]'},
      {internalType: 'address', name: 'to', type: 'address'},
      {internalType: 'uint256', name: 'deadline', type: 'uint256'}
    ],
    name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const keyAir1 = {
  address: process.env.ADDRESS,
  privateKey: process.env.PRIVATEKEY
}

const tokenIn = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b'

const getTokenAddress = data => {
  const adad = web3.eth.abi.decodeParameters(['uint256', 'address', 'address', 'address', 'address', 'address'], data)
  return adad[1]
}
const amountSwap = 100000000000000000000n

const contract = new web3.eth.Contract(abiUni, contractUni)
const account = web3.eth.accounts.privateKeyToAccount(keyAir1.privateKey)

const logTele = mess => {
  fetch(`https://api.telegram.org/bot7917519312:AAGAfMOk9QOGohyECmjAPgRK71TFlxMLZlg/sendMessage?chat_id=-1002295398585&text=${mess}`)
}

const swap = async (nonce, gasPrice, tokenOut) => {
  try {
    const rawTransaction = {
      to: contract._address,
      data: contract.methods
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(amountSwap, 0, [tokenIn, tokenOut], keyAir1.address, 17300092450)
        .encodeABI(),
      gasPrice: gasPrice,
      nonce: nonce,
      gas: 300000
    }
    const signedTransaction = await account.signTransaction(rawTransaction)

    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
    console.log('🚀 ~ swap ~ receipt:', receipt)
    logTele(`swap Okla ${receipt.transactionHash}`)
  } catch (err) {
    logTele(`swap tach rau`)
  }
  return nonce + 1
}

const socket = async () => {
  let nonce = await web3.eth.getTransactionCount(keyAir1.address)
  let gasPrice = Number(await web3.eth.getGasPrice()) + 10000
  console.log('🚀 ~ socket ~ nonce:', nonce, gasPrice)
  setInterval(async () => {
    gasPrice = Number(await web3.eth.getGasPrice()) + 10000
  }, 30000)

  web3Socket.eth
    .subscribe(
      'logs',
      {
        address: '0x94Bf9622348Cf5598D9A491Fa809194Cf85A0D61',
        topics: ['0xf9d151d23a5253296eb20ab40959cf48828ea2732d337416716e302ed83ca658']
      },
      function (error, result) {
        // if (!error) console.log(result)
      }
    )
    .on('connected', function (subscriptionId) {
      console.log(subscriptionId)
    })
    .on('data', async function (log) {
      console.log('🚀 ~ log:', log)
      try {
        console.log('hash    ', log.transactionHash)
        logTele(`new Token ${log.transactionHash}`)
        const tokenOut = getTokenAddress(log.data)
        logTele(`new Token ${tokenOut}`)
        // const tokenOut = tokenOutTest
        nonce = await swap(nonce, gasPrice, tokenOut)
      } catch (err) {
        console.log('🚀 ~ err:', err)
      }
    })
}

socket()
