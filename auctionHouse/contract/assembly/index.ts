// /*
//  * This is an example of an AssemblyScript smart contract with two simple,
//  * symmetric functions:
//  *
//  * 1. setGreeting: accepts a greeting, such as "howdy", and records it for the
//  *    user (account_id) who sent the request
//  * 2. getGreeting: accepts an account_id and returns the greeting saved for it,
//  *    defaulting to "Hello"
//  *
//  * Learn more about writing NEAR smart contracts with AssemblyScript:
//  * https://docs.near.org/docs/develop/contracts/as/intro
//  *
//  */

// import { Context, logging, storage } from 'near-sdk-as'

// const DEFAULT_MESSAGE = 'Hello'

// // Exported functions will be part of the public interface for your smart contract.
// // Feel free to extract behavior to non-exported functions!
// export function getGreeting(accountId: string): string | null {
//   // This uses raw `storage.get`, a low-level way to interact with on-chain
//   // storage for simple contracts.
//   // If you have something more complex, check out persistent collections:
//   // https://docs.near.org/docs/concepts/data-storage#assemblyscript-collection-types
//   return storage.get<string>(accountId, DEFAULT_MESSAGE)
// }

// export function setGreeting(message: string): void {
//   const account_id = Context.sender

//   // Use logging.log to record logs permanently to the blockchain!
//   logging.log(
//     // String interpolation (`like ${this}`) is a work in progress:
//     // https://github.com/AssemblyScript/assemblyscript/pull/1115
//     'Saving greeting "' + message + '" for account "' + account_id + '"'
//   )

//   storage.set(account_id, message)
// }

//Algorithm
// 1. The first person to call the game - creates the game and locks in x amount of NEAR
// 2. After the game is created, game state changes to available and we can see the amount of NEAR locked
// 3. Player 2 can choose amongst a set of available games and lock their near
// 4. Once two players are in, game is set to start
// 5. Once game starts, a random number is generated 
// 6. One of the players is randomly asked to make a guess(Can make static for v0)
// 7. Heads - mapped to even number, Tails is mapped to odd number
// 8. Winning player gets total locked amount
// 9. Game state is changed to unavailable/complete
import { context, u128, PersistentVector, PersistentMap, logging, ContractPromise, RNG, storage} from "near-sdk-as";

/** 
 * Exporting a new class Game so it can be used outside of this file.
 */
@nearBindgen
export class AuctionHouse {
    nftState: boolean;
    price: u128;
    tokenId: string;
    votes: i32;
    owner: string;
    constructor(_tokenId: string, _price: u128, _owner: string) {

        /*
        Generates a random number for the gameId.
        Need to change this to counter eventually.
        */
        this.nftState = true;
        this.price = _price;
        this.tokenId = _tokenId;
        this.owner = _owner;
        this.votes = 0;
        
    }

}
const ONE_TERAGAS = 1000000000000

@nearBindgen
class CustomType {
  constructor(
    public arg1: string,
    public arg2: string,
    public arg3: string
  ) { }

  toString(): string {
    return this.arg1 + '|' + this.arg2 + '|' + this.arg3
  }
}

@nearBindgen
class CustomTypeWrapper {
  constructor(public args: CustomType) { }
}

export const auctionNfts = new PersistentMap<string, AuctionHouse>("n");
export const tokenIds1 = new PersistentVector<string>("t1");
export const maxTokenId = new PersistentVector<string>("mt1");
export const maxVotes = new PersistentVector<i32>("mv1");
export let maxTokenId1:string = "None";
export let maxVotes1:i32 = 0;


export function addNft(tokenId: string, owner: string): string {
    const nft = new AuctionHouse(tokenId, u128.Zero, owner);
    auctionNfts.set(tokenId, nft);
    tokenIds1.push(tokenId);
    return nft.tokenId;
}

export function vote(tokenId: string) : i32 {
    const nft = auctionNfts.get(tokenId);
    
    if(nft != null){
      nft.votes = nft.votes+1;
      auctionNfts.set(tokenId, nft);
      return nft.votes;
    }
    return 0;
}

export function getHighestVoted() : string {

    for( let i=0; i < tokenIds1.length; i++) {
        const token = tokenIds1[i];
        const nft = auctionNfts.get(token);
        let maxVotes1:i32 = 0;
        if(nft != null) {
            if(nft.votes > maxVotes1){
              if(maxVotes.isEmpty){
                maxVotes.push(nft.votes);
                maxTokenId.push(nft.tokenId);
                maxVotes1 = nft.votes;
              }
              else {
                maxVotes.pop();
                maxVotes.push(nft.votes);
                maxTokenId.pop();
                maxTokenId.push(nft.tokenId);
                maxVotes1 = nft.votes;
              }
            }
        }
        else {
          logging.log("NFT is null");
        }
        
    }
    return maxTokenId.first;
    
}

export function closeAuction(): bool {
  //Cross contract call
  const self = "market.naik899.testnet"
  const token = "token-"+maxTokenId.first;
  const custom = new CustomType("naik899.testnet", token, "near");
  const GAS = 200*ONE_TERAGAS;
  const args = new CustomTypeWrapper(custom)

  ContractPromise.create(
    self,
    "accept_offer",
    custom,
    GAS,
    u128.Zero
  )
  auctionNfts.delete(maxTokenId.first);
  maxTokenId.pop();
  maxVotes.pop();
  return true;
}

export function getMaxToken() : string {
  return maxTokenId.first;
}

export function getMaxVotes() : i32 {
  return maxVotes.first;
}

export function getOwner(tokenId : string) : string {
  const nft = auctionNfts.get(tokenId);
  if(nft != null) {
    return nft.owner;
  }

  else
    return "None";
}

//Getters for all the game variables

//Returns all the active games which have been created
export function getActiveAuctionsTokenIds(): Array<string> {
  
  let tempAuctionMap = new Array<string>();

  for(let i =0; i< tokenIds1.length; i++){
      const nft = auctionNfts.get(tokenIds1[i]);

      if(nft != null){
          tempAuctionMap.push(nft.tokenId)
      }

  }
  return tempAuctionMap;
}

//Returns all the active games which have been created
export function getActiveAuctionsVotes(): Array<u32> {
  
  let tempAuctionMap = new Array<u32>();

  for(let i =0; i< tokenIds1.length; i++){
      const nft = auctionNfts.get(tokenIds1[i]);

      if(nft != null){
        if(nft.nftState == true){
          tempAuctionMap.push(nft.votes)
        }
      }

  }
  return tempAuctionMap;
}

//Returns tokens and votes
export function getActiveAuctionsTokenVotes(): Map<string, u32> {

  let tempAuctionMap = new Map<string, u32>();

  for(let i =0; i< tokenIds1.length; i++){
      const nft = auctionNfts.get(tokenIds1[i]);

      if(nft != null){
        if(nft.nftState == true){
          tempAuctionMap.set(nft.tokenId, nft.votes)
        }
      }

  }
  return tempAuctionMap;
}

export function calculatePrice(tokenId : string) : u128 {
    const nft = auctionNfts.get(tokenId);
    if(nft != null){
      const price = u128.fromU32(nft.votes*10);
      nft.price = price;
      auctionNfts.set(tokenId, nft);
      return nft.price;
    }
    
    return u128.Zero;

}
