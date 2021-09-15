import BN from 'bn.js'
import { GAS, parseNearAmount, marketId, contractId } from '../state/near';

export const handleMint = async (account, royalties, media, validMedia, title, description, minBidAmount) => {
    if (!media.length || !validMedia) {
        alert('Please enter a valid Image Link. You should see a preview below!');
        return;
    }

    // shape royalties data for minting and check max is < 20%
    let perpetual_royalties = Object.entries(royalties).map(([receiver, royalty]) => ({
        [receiver]: royalty * 100
    })).reduce((acc, cur) => Object.assign(acc, cur), {});
    if (Object.values(perpetual_royalties).reduce((a, c) => a + c, 0) > 2000) {
        return alert('Cannot add more than 20% in perpetual NFT royalties when minting');
    }
    
    const extra = minBidAmount;
    const metadata = { 
        media,
        title,
        description,
        extra,
        issued_at: Date.now().toString()
    };
    const deposit = parseNearAmount('0.1');
    const tokenId = 'token-' + Date.now();

    // localStorage.clear();
    localStorage.setItem("tokenId", tokenId);
    localStorage.setItem("stage", "mint");

    try {
      
        await account.functionCall(contractId, 'nft_mint', {
            token_id: tokenId,
            metadata,
            perpetual_royalties
        }, GAS, deposit);
        
    }
    catch {

        console.log("In Catch Block");
    }
};

// vote action
export const nftVote = async (account, token_id) => {
    await account.functionCall("auction.gyanlakshmi.testnet", 'vote', {
        tokenId: token_id
    });
};


export const nftApprove = async (account, token_id) => {
    await account.functionCall(contractId, 'nft_approve', {
        token_id: token_id,
        account_id: marketId
    }, GAS, parseNearAmount('0.01'));
};

export const nftTransfer = async (account, tokenId) => {
    const FT_TRANSFER_DEPOSIT = '1';
    await account.functionCall(contractId, 'nft_transfer', {
            receiver_id: marketId,
            token_id: tokenId
        }, GAS, FT_TRANSFER_DEPOSIT);
};


export const handleAcceptOffer = async (account, token_id, ft_token_id) => {
    if (ft_token_id !== 'near') {
        return alert('currently only accepting NEAR offers');
    }
    await account.functionCall(marketId, 'accept_offer', {
        nft_contract_id: contractId,
        token_id,
        ft_token_id,
    }, GAS);
};

export const handleRegisterStorage = async (account) => {
    // WARNING this just pays for 10 "spots" to sell NFTs in marketplace vs. paying each time
    // TBD - we need to make this call before settiing the NFT up for sale in the marketplace
    await account.functionCall(
        marketId,
        'storage_deposit',
        {},
        GAS,
        new BN(await account.viewFunction(marketId, 'storage_amount', {}, GAS)).mul(new BN('10'))
    )
};

export const handleSaleUpdate = async (account, token_id, newSaleConditions) => {
    debugger
    const sale = await account.viewFunction(marketId, 'get_sale', { nft_contract_token: contractId + ":" + token_id }).catch(() => { });
    if (sale) {
        
        await account.functionCall(marketId, 'update_price', {
            nft_contract_id: contractId,
            token_id,
            ft_token_id: newSaleConditions[0].ft_token_id,
            price: newSaleConditions[0].price
        }, GAS);
    } else {
        await account.functionCall(contractId, 'nft_approve', {
            token_id,
            account_id: marketId,
            msg: JSON.stringify({ sale_conditions: newSaleConditions })
        }, GAS, parseNearAmount('0.01'));
    }
};