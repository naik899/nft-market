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
import { context, u128, PersistentVector, PersistentMap, logging, ContractPromiseBatch, RNG} from "near-sdk-as";

/** 
 * Exporting a new class Game so it can be used outside of this file.
 */
@nearBindgen
export class AuctionHouse {
    nftState: boolean;
    price: u128;
    tokenId: u32;
    votes: u32;
    owner: string;
    constructor(_tokenId: u32, _price: u128, _owner: string) {

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

export const auctionNfts = new PersistentMap<u32, AuctionHouse>("n");
export const tokenIds = new PersistentVector<u32>("t");

export function addNft(tokenId: u32, owner: string): u32 {
    const nft = new AuctionHouse(tokenId, u128.Zero, owner);
    auctionNfts.set(tokenId, nft);
    tokenIds.push(tokenId);
    return nft.tokenId;
}

export function vote(tokenId: u32) : boolean {
    const nft = auctionNfts.get(tokenId);
    if(nft != null){
      nft.votes = nft.votes+1;
      auctionNfts.set(tokenId, nft);
      return true;
    }
    return false;
    
}

export function getHighestVoted() : u32 {

    let maxToken = tokenIds[0];
    for( let i=0; i < tokenIds.length; i++) {
        const token = tokenIds[i];
        const nft = auctionNfts.get(token);
        let maxVotes = 0;
        if(nft != null) {
          if(nft.nftState == true){
            if(nft.votes > maxVotes){
                maxVotes = nft.votes;
                maxToken = nft.tokenId;
            }
        }
        }
        else {
          logging.log("NFT is null");
        }
        
    }
    const nftMax = auctionNfts.get(maxToken);
    if(nftMax != null) {
      nftMax.nftState = false;
      auctionNfts.set(maxToken, nftMax);
      return maxToken;
    }

    return 0;
    
}


//Getters for all the game variables

//Returns all the active games which have been created
export function getActiveAuctions(): Array<u32> {
  
  let tempAuctionMap = new Array<u32>();

  for(let i =0; i< tokenIds.length; i++){
      const nft = auctionNfts.get(tokenIds[i]);

      if(nft != null){
        if(nft.nftState == true){
          tempAuctionMap.push(nft.tokenId)
        }
      }

  }
  return tempAuctionMap;
}

export function calculatePrice(tokenId : u32) : u128 {
    const nft = auctionNfts.get(tokenId);
    if(nft != null){
      const price = u128.fromU32(nft.votes*10);
      nft.price = price;
      auctionNfts.set(tokenId, nft);
      return nft.price;
    }
    
    return u128.Zero;

}
