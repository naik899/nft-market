import { connect, Contract, keyStores, KeyPair, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')



// Initialize contract & set global variables
export async function initContract() {

  //Auction House Contract Initialisation - add auctionHouse json

 // debugger;
const keyStore = new keyStores.InMemoryKeyStore();
const PRIVATE_KEY =
  "ed25519:3739iHaKVy3Kriu9v2CJNPqBbD2zuJNKBGeB7rsxriSatkDdXUmxVKD8UjfkxXiZQZGsCFG8bDsYaLK8z9kYLGMg";
// creates a public / private key pair using the provided private key
const keyPair = KeyPair.fromString(PRIVATE_KEY);
// adds the keyPair you created to keyStore
await keyStore.setKey("testnet", "auction.gyanlakshmi.testnet", keyPair);
  // Initialize connection to the NEAR testnet
  const config = { 
    keyStore, // instance of InMemoryKeyStore
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org'
  };
  
  // inside an async function
  const near = await connect(config)

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.ah = {}
  const accountAh = await near.account("auction.gyanlakshmi.testnet");
  //window.ah.walletConnection = new WalletConnection(near)

  // // Getting the Account ID. If still unauthorized, it's just empty string
  window.ah.accountIdAh = accountAh.accountId
  window.ah.account = accountAh

  //debugger;
  // Initializing our contract APIs by contract name and configuration
  window.ah.contract = await new Contract(accountAh, "auction.gyanlakshmi.testnet", {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['getHighestVoted', 'getMaxToken', 'getOwner', 'getActiveAuctionsVotes', 'getActiveAuctionsTokenIds', 'getActiveAuctionsTokenVotes'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['addNft', 'vote'],
  })

  await initContract2();
}


export async function initContract2() {

  //Marketplace Contract Initialisation - add marketplace json
  let marketAccount = "market.naik899.testnet";
const keyStore = new keyStores.InMemoryKeyStore();
const PRIVATE_KEY =
  "ed25519:fCYgK9DSX5x7DcwoR4mZFNyBXks6EPtaQt99YaLLBUuGb94dTAnF3ZaSUX1hY9zokyYXV2WFKWgEQf3XCYwxGbb";
// creates a public / private key pair using the provided private key
const keyPair = KeyPair.fromString(PRIVATE_KEY);
// adds the keyPair you created to keyStore
await keyStore.setKey("testnet", marketAccount, keyPair);
 // debugger;
  // Initialize connection to the NEAR testnet
  const config = { 
    keyStore, // instance of InMemoryKeyStore
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org'
  };

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org

  const near = await connect(config)

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.mp = {}
  const accountMp = await near.account(marketAccount);
  //window.ah.walletConnection = new WalletConnection(near)

  // // Getting the Account ID. If still unauthorized, it's just empty string
  window.mp.accountIdMp = accountMp.accountId

window.mp.account = accountMp
  //debugger;
  // Initializing our contract APIs by contract name and configuration
  window.mp.contract = await new Contract(accountMp, marketAccount, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['getHighestVoted', 'getMaxToken', 'getOwner', 'getActiveAuctionsVotes', 'getActiveAuctionsTokenIds'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['addNft', 'vote'],
  })

}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(nearConfig.contractName)
}
