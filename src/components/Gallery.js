import React, { useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import { parseNearAmount, token2symbol, getTokenOptions, handleOffer } from '../state/near';
import {
	formatAccountId,
} from '../utils/near-utils';
import { getMarketStoragePaid, loadItems } from '../state/views';
import { getSaleInfo, handleAcceptOffer, handleRegisterStorage, handleSaleUpdate, nftApprove, nftTransfer, nftVote } from '../state/actions';
import { useHistory } from '../utils/history';
import { Token } from './Token';
import Card from 'react-bootstrap/Card';
import { Container, Row, Col, Button, Badge, Toast } from 'react-bootstrap';


const PATH_SPLIT = '?t=';
const SUB_SPLIT = '&=';

const {
	utils: { format: { formatNearAmount } }
} = nearAPI;


const n2f = (amount) => parseFloat(parseNearAmount(amount, 8));

const sortFunctions = {
	1: (a, b) => parseInt(a.metadata.issued_at || '0') - parseInt(b.metadata.issued_at || '0'),
	2: (b, a) => parseInt(a.metadata.issued_at || '0') - parseInt(b.metadata.issued_at || '0'),
	3: (a, b) => n2f(a.sale_conditions?.near || '0') - n2f(b.sale_conditions?.near || '0'),
	4: (b, a) => n2f(a.sale_conditions?.near || '0') - n2f(b.sale_conditions?.near || '0'),
};

export const Gallery = ({ app, views, update, contractAccount, account, loading, dispatch }) => {
	if (!contractAccount) return null;

	const { tab, sort, filter } = app;
	const { tokens, sales, allTokens, marketStoragePaid, maxVotedTokens, currentVotes } = views

	let accountId = '';
	if (account) accountId = account.accountId;

	/// market
	const [offerPrice, setOfferPrice] = useState('');
	const [offerToken, setOfferToken] = useState('near');

	/// updating user tokens
	const [price, setPrice] = useState('');
	const [ft, setFT] = useState('near');
	const [saleConditions, setSaleConditions] = useState({});
	const [bidsInfo, setBidsInfo] = useState({});


	useEffect(async () => {
		if (!loading) {
			if (window.location.href.includes("transactionHashes")) {
				const stage = localStorage.getItem("stage");
				const tokenId = localStorage.getItem("tokenId");

				if (stage === "mint") {
					localStorage.setItem("stage", "approve");
					alert("Inside approval!"); 

					await nftApprove(account, tokenId);
				}
				if (stage === "approve") {
					alert("Inside transfer!");
					localStorage.setItem("stage", "transfer");

					await nftTransfer(account, tokenId);



				}
				if (stage === "transfer") {


					let DELIMITER = "||";



					let tokenInfo = tokenId;


					// sales conditions add.
					const newSaleConditions = {
						...saleConditions,
						[ft]: parseNearAmount('1')
					}
					setSaleConditions(newSaleConditions);
					setPrice('');
					setFT('near');
					await handleSaleUpdate(window.mp.account, tokenId, newSaleConditions);


					const bidsInfo = await getSaleInfo(window.mp.account, tokenInfo);
					setBidsInfo(bidsInfo);
					//  approve nft to itself  , this will add it to sales 
					//	await nftApprove(window.mp.account, tokenId);

					
					localStorage.setItem("stage", "transferred");

					await window.ah.contract.addNft({
						accountId: window.mp.accountIdMp,
						tokenId: tokenId.replace("token-", ""),
						owner: account.accountId
					})


				}
				else if(stage === "transferred")
				{
					let tokenInfo = tokenId;
					const bidsInfo = await getSaleInfo(window.mp.account, tokenInfo);
					setBidsInfo(bidsInfo);
				}



			}
			dispatch(loadItems(account))
			dispatch(getMarketStoragePaid(account))
		}
	}, [loading]);

	// path to token
	const [path, setPath] = useState(window.location.href);
	useHistory(() => {
		setPath(window.location.href);
	});
	let tokenId;
	let pathSplit = path.split(PATH_SPLIT)[1];
	if (allTokens.length && pathSplit?.length) {
		console.log(pathSplit);
		tokenId = pathSplit.split(SUB_SPLIT)[0];
	}


	const currentSales = sales.filter(({ owner_id, sale_conditions }) => account?.accountId === owner_id && Object.keys(sale_conditions || {}).length > 0)


	let market = sales;
	if (tab !== 2 && filter === 1) {
		market = market.concat(allTokens.filter(({ token_id }) => !market.some(({ token_id: t }) => t === token_id)));
	}
	market.sort(sortFunctions[sort]);
	tokens.sort(sortFunctions[sort]);


	const token = market.find(({ token_id }) => tokenId === token_id);
	if (token) {
		return <Token {...{ dispatch, account, token }} />;
	}

	let myTokens = []

	if (tokens.length) {
		myTokens.push(tokens[0])
		//myTokens.push(tokens.find(r => r.token_id === 'token-1631718110381'))
	}


	return <>

		{

			tab === 1 && tokens.length && myTokens.map(({
				metadata: { media, title, description },
				owner_id,
				token_id,
				bids = {},
				sale_conditions = {}
			}) =>
				<Container style={{ marginTop: '20px' }}>
					{
						<>
							<Row>
								<Col md /* style={{display:'flex' , justifyContent:'center'}} */>
									<Card key={token_id} style={{ margin: '20px', boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)" }} onClick={() => history.pushState({}, '', window.location.pathname + '?t=' + token_id)}>
										{/* <Card.Img height="400" width="400" variant="top" src={media}  crossOrigin="Anonymous"/> */}

										<img
  crossOrigin="anonymous" className="card-img-top"
  src={media} 
  style={{height: '400', width: 400}}
  alt="img"
/>
										<Card.Body>
											<Card.Title>{title}
											</Card.Title>
											{/* <Card.Subtitle>Min Bid Price {extra} NEAR</Card.Subtitle> */}
											<Card.Text>
												{description} {owner_id}
											</Card.Text>
											{
												accountId.length > 0 && <>
													<input type="number" placeholder="Price" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
													{

													}
													<button onClick={() => handleOffer(account, token_id, offerToken, offerPrice)}>Offer</button>
												</>
											}

											{
												Object.keys(sale_conditions).length > 0 && <>
													<h4>Sale Conditions</h4>
													{
														Object.entries(sale_conditions).map(([ft_token_id, price]) => <div className="margin-bottom" key={ft_token_id}>
															{price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
														</div>)
													}
													{
														accountId.length > 0 && <>
															<input type="number" placeholder="Price" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
															{
																getTokenOptions(offerToken, setOfferToken, Object.keys(sale_conditions))
															}
															<button onClick={() => handleOffer(account, token_id, offerToken, offerPrice)}>Offer</button>
														</>
													}
												</>
											}

										</Card.Body>
									</Card>
								</Col>


							</Row>

							<Row>
								{Object.keys(bidsInfo).length > 0 && (
									<>

										{(bidsInfo["near"]).map(

											(d) => (
												<div className="offers">
													<div>

														<h1>
														Highest Bid- {formatNearAmount(d.price, 4)} NEAR
														
														</h1>
													</div>

												</div>
											)
										)}
									</>
								)}
							</Row>
						</>

					}


				</Container>

				// <div key={token_id} className="item">

				// 	{
				// 		Object.keys(bids).length > 0 && <>
				// 			<h4>Offers</h4>
				// 			{
				// 				Object.entries(bids).map(([ft_token_id, ft_token_bids]) => ft_token_bids.map(({ owner_id: bid_owner_id, price }) => <div className="offers" key={ft_token_id}>
				// 					<div>
				// 						{price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]} by {bid_owner_id}
				// 					</div>
				// 					{
				// 						accountId === owner_id &&
				// 						<button onClick={() => handleAcceptOffer(account, token_id, ft_token_id)}>Accept</button>
				// 					}
				// 				</div>) )
				// 			}
				// 		</>
				// 	}
				// </div>				)
			)}

		{
			tab === 2 && <>
				{!tokens.length && <p className="margin">No NFTs. Try minting something!</p>}
				{
					<Container style={{ marginTop: '20px' }}><Row>
						{
							tokens.map(({
								metadata: { media, title, description, extra },
								owner_id,
								token_id,
								sale_conditions = {},
								bids = {},
								royalty = {},
								voteButtonDisabled = owner_id === accountId,
								myVote = currentVotes[token_id.replace("token-", "")]
							}) =>


								<Col key={token_id} sm /* style={{display:'flex' , justifyContent:'center'}} */>
									<Card style={{ width: '18rem', margin: '20px', boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)" }} onClick={() => history.pushState({}, '', window.location.pathname + '?t=' + token_id)}>
									<img
  crossOrigin="anonymous" className="card-img-top"
  src={media} 
  style={{height: '200', width: '200'}}
  alt="img"
/>
										
										<Card.Body>
											<Card.Title>{title} {token_id}<span style={{ float: "right", fontSize: "0.75em", lineHeight: "24px" }}>
												<svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 288"><g id="Layer_1" data-name="Layer 1"><path d="M187.58,79.81l-30.1,44.69a3.2,3.2,0,0,0,4.75,4.2L191.86,103a1.2,1.2,0,0,1,2,.91v80.46a1.2,1.2,0,0,1-2.12.77L102.18,77.93A15.35,15.35,0,0,0,90.47,72.5H87.34A15.34,15.34,0,0,0,72,87.84V201.16A15.34,15.34,0,0,0,87.34,216.5h0a15.35,15.35,0,0,0,13.08-7.31l30.1-44.69a3.2,3.2,0,0,0-4.75-4.2L96.14,186a1.2,1.2,0,0,1-2-.91V104.61a1.2,1.2,0,0,1,2.12-.77l89.55,107.23a15.35,15.35,0,0,0,11.71,5.43h3.13A15.34,15.34,0,0,0,216,201.16V87.84A15.34,15.34,0,0,0,200.66,72.5h0A15.35,15.35,0,0,0,187.58,79.81Z" /></g></svg>
												{extra} |
												<svg width="24px" height="24px" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="M 40 7 C 21.786448 7 7 21.786448 7 40 C 7 58.213552 21.786448 73 40 73 C 58.213552 73 73 58.213552 73 40 C 73 21.786448 58.213552 7 40 7 z M 40 9 C 40.857181 9 41.703463 9.0451837 42.542969 9.1132812 A 1 1 0 0 0 42 10 A 1 1 0 0 0 43 11 A 1 1 0 0 0 44 10 A 1 1 0 0 0 43.621094 9.2167969 C 45.116404 9.3905204 46.579588 9.6664826 48.001953 10.044922 A 1 1 0 0 0 49 11 A 1 1 0 0 0 49.806641 10.589844 C 59.042061 13.664179 66.335821 20.957939 69.410156 30.193359 A 1 1 0 0 0 69 31 A 1 1 0 0 0 69.955078 31.998047 C 70.333517 33.420412 70.60948 34.883596 70.783203 36.378906 A 1 1 0 0 0 70 36 A 1 1 0 0 0 69 37 A 1 1 0 0 0 70 38 A 1 1 0 0 0 70.886719 37.458984 C 70.954713 38.297859 71 39.143478 71 40 C 71 40.857181 70.954816 41.703463 70.886719 42.542969 A 1 1 0 0 0 70 42 A 1 1 0 0 0 69 43 A 1 1 0 0 0 70 44 A 1 1 0 0 0 70.783203 43.621094 C 70.60948 45.116404 70.333517 46.579588 69.955078 48.001953 A 1 1 0 0 0 69 49 A 1 1 0 0 0 69.410156 49.806641 C 66.335821 59.042061 59.042061 66.335821 49.806641 69.410156 A 1 1 0 0 0 49 69 A 1 1 0 0 0 48.001953 69.955078 C 46.579588 70.333517 45.116404 70.60948 43.621094 70.783203 A 1 1 0 0 0 44 70 A 1 1 0 0 0 43 69 A 1 1 0 0 0 42 70 A 1 1 0 0 0 42.541016 70.886719 C 41.702141 70.954713 40.856522 71 40 71 C 39.142819 71 38.296537 70.954816 37.457031 70.886719 A 1 1 0 0 0 38 70 A 1 1 0 0 0 37 69 A 1 1 0 0 0 36 70 A 1 1 0 0 0 36.378906 70.783203 C 34.883596 70.60948 33.420412 70.333517 31.998047 69.955078 A 1 1 0 0 0 31 69 A 1 1 0 0 0 30.193359 69.410156 C 20.957939 66.335821 13.664179 59.042061 10.589844 49.806641 A 1 1 0 0 0 11 49 A 1 1 0 0 0 10.044922 48.001953 C 9.6664826 46.579588 9.3905204 45.116404 9.2167969 43.621094 A 1 1 0 0 0 10 44 A 1 1 0 0 0 11 43 A 1 1 0 0 0 10 42 A 1 1 0 0 0 9.1132812 42.541016 C 9.0452875 41.702141 9 40.856522 9 40 C 9 39.142819 9.0451837 38.296537 9.1132812 37.457031 A 1 1 0 0 0 10 38 A 1 1 0 0 0 11 37 A 1 1 0 0 0 10 36 A 1 1 0 0 0 9.2167969 36.378906 C 9.3905204 34.883596 9.6664826 33.420412 10.044922 31.998047 A 1 1 0 0 0 11 31 A 1 1 0 0 0 10.589844 30.193359 C 13.664179 20.957939 20.957939 13.664179 30.193359 10.589844 A 1 1 0 0 0 31 11 A 1 1 0 0 0 31.998047 10.044922 C 33.420412 9.6664826 34.883596 9.3905204 36.378906 9.2167969 A 1 1 0 0 0 36 10 A 1 1 0 0 0 37 11 A 1 1 0 0 0 38 10 A 1 1 0 0 0 37.458984 9.1132812 C 38.297859 9.0452875 39.143478 9 40 9 z M 28 12 A 1 1 0 0 0 27 13 A 1 1 0 0 0 28 14 A 1 1 0 0 0 29 13 A 1 1 0 0 0 28 12 z M 34 12 A 1 1 0 0 0 33 13 A 1 1 0 0 0 34 14 A 1 1 0 0 0 35 13 A 1 1 0 0 0 34 12 z M 40 12 A 1 1 0 0 0 39 13 A 1 1 0 0 0 40 14 A 1 1 0 0 0 41 13 A 1 1 0 0 0 40 12 z M 46 12 A 1 1 0 0 0 45 13 A 1 1 0 0 0 46 14 A 1 1 0 0 0 47 13 A 1 1 0 0 0 46 12 z M 52 12 A 1 1 0 0 0 51 13 A 1 1 0 0 0 52 14 A 1 1 0 0 0 53 13 A 1 1 0 0 0 52 12 z M 25 15 A 1 1 0 0 0 24 16 A 1 1 0 0 0 25 17 A 1 1 0 0 0 26 16 A 1 1 0 0 0 25 15 z M 31 15 A 1 1 0 0 0 30 16 A 1 1 0 0 0 31 17 A 1 1 0 0 0 32 16 A 1 1 0 0 0 31 15 z M 37 15 A 1 1 0 0 0 36 16 A 1 1 0 0 0 37 17 A 1 1 0 0 0 38 16 A 1 1 0 0 0 37 15 z M 43 15 A 1 1 0 0 0 42 16 A 1 1 0 0 0 43 17 A 1 1 0 0 0 44 16 A 1 1 0 0 0 43 15 z M 49 15 A 1 1 0 0 0 48 16 A 1 1 0 0 0 49 17 A 1 1 0 0 0 50 16 A 1 1 0 0 0 49 15 z M 55 15 A 1 1 0 0 0 54 16 A 1 1 0 0 0 55 17 A 1 1 0 0 0 56 16 A 1 1 0 0 0 55 15 z M 22 18 A 1 1 0 0 0 21 19 A 1 1 0 0 0 22 20 A 1 1 0 0 0 23 19 A 1 1 0 0 0 22 18 z M 28 18 A 1 1 0 0 0 27 19 A 1 1 0 0 0 28 20 A 1 1 0 0 0 29 19 A 1 1 0 0 0 28 18 z M 34 18 A 1 1 0 0 0 33 19 A 1 1 0 0 0 34 20 A 1 1 0 0 0 35 19 A 1 1 0 0 0 34 18 z M 40 18 A 1 1 0 0 0 39 19 A 1 1 0 0 0 40 20 A 1 1 0 0 0 41 19 A 1 1 0 0 0 40 18 z M 46 18 A 1 1 0 0 0 45 19 A 1 1 0 0 0 46 20 A 1 1 0 0 0 47 19 A 1 1 0 0 0 46 18 z M 52 18 A 1 1 0 0 0 51 19 A 1 1 0 0 0 52 20 A 1 1 0 0 0 53 19 A 1 1 0 0 0 52 18 z M 58 18 A 1 1 0 0 0 57 19 A 1 1 0 0 0 58 20 A 1 1 0 0 0 59 19 A 1 1 0 0 0 58 18 z M 19 21 A 1 1 0 0 0 18 22 A 1 1 0 0 0 19 23 A 1 1 0 0 0 20 22 A 1 1 0 0 0 19 21 z M 25 21 A 1 1 0 0 0 24 22 A 1 1 0 0 0 25 23 A 1 1 0 0 0 26 22 A 1 1 0 0 0 25 21 z M 31 21 A 1 1 0 0 0 30 22 A 1 1 0 0 0 31 23 A 1 1 0 0 0 32 22 A 1 1 0 0 0 31 21 z M 37 21 A 1 1 0 0 0 36 22 A 1 1 0 0 0 37 23 A 1 1 0 0 0 38 22 A 1 1 0 0 0 37 21 z M 43 21 A 1 1 0 0 0 42 22 A 1 1 0 0 0 43 23 A 1 1 0 0 0 44 22 A 1 1 0 0 0 43 21 z M 49 21 A 1 1 0 0 0 48 22 A 1 1 0 0 0 49 23 A 1 1 0 0 0 50 22 A 1 1 0 0 0 49 21 z M 55 21 A 1 1 0 0 0 54 22 A 1 1 0 0 0 55 23 A 1 1 0 0 0 56 22 A 1 1 0 0 0 55 21 z M 61 21 A 1 1 0 0 0 60 22 A 1 1 0 0 0 61 23 A 1 1 0 0 0 62 22 A 1 1 0 0 0 61 21 z M 16 24 A 1 1 0 0 0 15 25 A 1 1 0 0 0 16 26 A 1 1 0 0 0 17 25 A 1 1 0 0 0 16 24 z M 22 24 A 1 1 0 0 0 21 25 A 1 1 0 0 0 22 26 A 1 1 0 0 0 23 25 A 1 1 0 0 0 22 24 z M 28 24 A 1 1 0 0 0 27 25 A 1 1 0 0 0 28 26 A 1 1 0 0 0 29 25 A 1 1 0 0 0 28 24 z M 34 24 A 1 1 0 0 0 33 25 A 1 1 0 0 0 34 26 A 1 1 0 0 0 35 25 A 1 1 0 0 0 34 24 z M 40 24 A 1 1 0 0 0 39 25 A 1 1 0 0 0 40 26 A 1 1 0 0 0 41 25 A 1 1 0 0 0 40 24 z M 46 24 A 1 1 0 0 0 45 25 A 1 1 0 0 0 46 26 A 1 1 0 0 0 47 25 A 1 1 0 0 0 46 24 z M 52 24 A 1 1 0 0 0 51 25 A 1 1 0 0 0 52 26 A 1 1 0 0 0 53 25 A 1 1 0 0 0 52 24 z M 58 24 A 1 1 0 0 0 57 25 A 1 1 0 0 0 58 26 A 1 1 0 0 0 59 25 A 1 1 0 0 0 58 24 z M 64 24 A 1 1 0 0 0 63 25 A 1 1 0 0 0 64 26 A 1 1 0 0 0 65 25 A 1 1 0 0 0 64 24 z M 54.791016 25.376953 L 36.925781 43.087891 L 27.880859 34.041016 L 22.222656 39.699219 L 36.919922 54.396484 L 60.447266 31.033203 L 59.738281 30.324219 L 54.791016 25.376953 z M 13 27 A 1 1 0 0 0 12 28 A 1 1 0 0 0 13 29 A 1 1 0 0 0 14 28 A 1 1 0 0 0 13 27 z M 19 27 A 1 1 0 0 0 18 28 A 1 1 0 0 0 19 29 A 1 1 0 0 0 20 28 A 1 1 0 0 0 19 27 z M 25 27 A 1 1 0 0 0 24 28 A 1 1 0 0 0 25 29 A 1 1 0 0 0 26 28 A 1 1 0 0 0 25 27 z M 31 27 A 1 1 0 0 0 30 28 A 1 1 0 0 0 31 29 A 1 1 0 0 0 32 28 A 1 1 0 0 0 31 27 z M 37 27 A 1 1 0 0 0 36 28 A 1 1 0 0 0 37 29 A 1 1 0 0 0 38 28 A 1 1 0 0 0 37 27 z M 43 27 A 1 1 0 0 0 42 28 A 1 1 0 0 0 43 29 A 1 1 0 0 0 44 28 A 1 1 0 0 0 43 27 z M 49 27 A 1 1 0 0 0 48 28 A 1 1 0 0 0 49 29 A 1 1 0 0 0 50 28 A 1 1 0 0 0 49 27 z M 61 27 A 1 1 0 0 0 60 28 A 1 1 0 0 0 61 29 A 1 1 0 0 0 62 28 A 1 1 0 0 0 61 27 z M 67 27 A 1 1 0 0 0 66 28 A 1 1 0 0 0 67 29 A 1 1 0 0 0 68 28 A 1 1 0 0 0 67 27 z M 54.785156 28.199219 L 57.615234 31.029297 L 36.925781 51.574219 L 25.050781 39.699219 L 27.880859 36.871094 L 36.919922 45.910156 L 54.785156 28.199219 z M 16 30 A 1 1 0 0 0 15 31 A 1 1 0 0 0 16 32 A 1 1 0 0 0 17 31 A 1 1 0 0 0 16 30 z M 22 30 A 1 1 0 0 0 21 31 A 1 1 0 0 0 22 32 A 1 1 0 0 0 23 31 A 1 1 0 0 0 22 30 z M 28 30 A 1 1 0 0 0 27 31 A 1 1 0 0 0 28 32 A 1 1 0 0 0 29 31 A 1 1 0 0 0 28 30 z M 34 30 A 1 1 0 0 0 33 31 A 1 1 0 0 0 34 32 A 1 1 0 0 0 35 31 A 1 1 0 0 0 34 30 z M 40 30 A 1 1 0 0 0 39 31 A 1 1 0 0 0 40 32 A 1 1 0 0 0 41 31 A 1 1 0 0 0 40 30 z M 46 30 A 1 1 0 0 0 45 31 A 1 1 0 0 0 46 32 A 1 1 0 0 0 47 31 A 1 1 0 0 0 46 30 z M 64 30 A 1 1 0 0 0 63 31 A 1 1 0 0 0 64 32 A 1 1 0 0 0 65 31 A 1 1 0 0 0 64 30 z M 13 33 A 1 1 0 0 0 12 34 A 1 1 0 0 0 13 35 A 1 1 0 0 0 14 34 A 1 1 0 0 0 13 33 z M 19 33 A 1 1 0 0 0 18 34 A 1 1 0 0 0 19 35 A 1 1 0 0 0 20 34 A 1 1 0 0 0 19 33 z M 25 33 A 1 1 0 0 0 24 34 A 1 1 0 0 0 25 35 A 1 1 0 0 0 26 34 A 1 1 0 0 0 25 33 z M 31 33 A 1 1 0 0 0 30 34 A 1 1 0 0 0 31 35 A 1 1 0 0 0 32 34 A 1 1 0 0 0 31 33 z M 37 33 A 1 1 0 0 0 36 34 A 1 1 0 0 0 37 35 A 1 1 0 0 0 38 34 A 1 1 0 0 0 37 33 z M 43 33 A 1 1 0 0 0 42 34 A 1 1 0 0 0 43 35 A 1 1 0 0 0 44 34 A 1 1 0 0 0 43 33 z M 61 33 A 1 1 0 0 0 60 34 A 1 1 0 0 0 61 35 A 1 1 0 0 0 62 34 A 1 1 0 0 0 61 33 z M 67 33 A 1 1 0 0 0 66 34 A 1 1 0 0 0 67 35 A 1 1 0 0 0 68 34 A 1 1 0 0 0 67 33 z M 16 36 A 1 1 0 0 0 15 37 A 1 1 0 0 0 16 38 A 1 1 0 0 0 17 37 A 1 1 0 0 0 16 36 z M 22 36 A 1 1 0 0 0 21 37 A 1 1 0 0 0 22 38 A 1 1 0 0 0 23 37 A 1 1 0 0 0 22 36 z M 34 36 A 1 1 0 0 0 33 37 A 1 1 0 0 0 34 38 A 1 1 0 0 0 35 37 A 1 1 0 0 0 34 36 z M 40 36 A 1 1 0 0 0 39 37 A 1 1 0 0 0 40 38 A 1 1 0 0 0 41 37 A 1 1 0 0 0 40 36 z M 58 36 A 1 1 0 0 0 57 37 A 1 1 0 0 0 58 38 A 1 1 0 0 0 59 37 A 1 1 0 0 0 58 36 z M 64 36 A 1 1 0 0 0 63 37 A 1 1 0 0 0 64 38 A 1 1 0 0 0 65 37 A 1 1 0 0 0 64 36 z M 13 39 A 1 1 0 0 0 12 40 A 1 1 0 0 0 13 41 A 1 1 0 0 0 14 40 A 1 1 0 0 0 13 39 z M 19 39 A 1 1 0 0 0 18 40 A 1 1 0 0 0 19 41 A 1 1 0 0 0 20 40 A 1 1 0 0 0 19 39 z M 37 39 A 1 1 0 0 0 36 40 A 1 1 0 0 0 37 41 A 1 1 0 0 0 38 40 A 1 1 0 0 0 37 39 z M 55 39 A 1 1 0 0 0 54 40 A 1 1 0 0 0 55 41 A 1 1 0 0 0 56 40 A 1 1 0 0 0 55 39 z M 61 39 A 1 1 0 0 0 60 40 A 1 1 0 0 0 61 41 A 1 1 0 0 0 62 40 A 1 1 0 0 0 61 39 z M 67 39 A 1 1 0 0 0 66 40 A 1 1 0 0 0 67 41 A 1 1 0 0 0 68 40 A 1 1 0 0 0 67 39 z M 16 42 A 1 1 0 0 0 15 43 A 1 1 0 0 0 16 44 A 1 1 0 0 0 17 43 A 1 1 0 0 0 16 42 z M 22 42 A 1 1 0 0 0 21 43 A 1 1 0 0 0 22 44 A 1 1 0 0 0 23 43 A 1 1 0 0 0 22 42 z M 52 42 A 1 1 0 0 0 51 43 A 1 1 0 0 0 52 44 A 1 1 0 0 0 53 43 A 1 1 0 0 0 52 42 z M 58 42 A 1 1 0 0 0 57 43 A 1 1 0 0 0 58 44 A 1 1 0 0 0 59 43 A 1 1 0 0 0 58 42 z M 64 42 A 1 1 0 0 0 63 43 A 1 1 0 0 0 64 44 A 1 1 0 0 0 65 43 A 1 1 0 0 0 64 42 z M 13 45 A 1 1 0 0 0 12 46 A 1 1 0 0 0 13 47 A 1 1 0 0 0 14 46 A 1 1 0 0 0 13 45 z M 19 45 A 1 1 0 0 0 18 46 A 1 1 0 0 0 19 47 A 1 1 0 0 0 20 46 A 1 1 0 0 0 19 45 z M 25 45 A 1 1 0 0 0 24 46 A 1 1 0 0 0 25 47 A 1 1 0 0 0 26 46 A 1 1 0 0 0 25 45 z M 49 45 A 1 1 0 0 0 48 46 A 1 1 0 0 0 49 47 A 1 1 0 0 0 50 46 A 1 1 0 0 0 49 45 z M 55 45 A 1 1 0 0 0 54 46 A 1 1 0 0 0 55 47 A 1 1 0 0 0 56 46 A 1 1 0 0 0 55 45 z M 61 45 A 1 1 0 0 0 60 46 A 1 1 0 0 0 61 47 A 1 1 0 0 0 62 46 A 1 1 0 0 0 61 45 z M 67 45 A 1 1 0 0 0 66 46 A 1 1 0 0 0 67 47 A 1 1 0 0 0 68 46 A 1 1 0 0 0 67 45 z M 16 48 A 1 1 0 0 0 15 49 A 1 1 0 0 0 16 50 A 1 1 0 0 0 17 49 A 1 1 0 0 0 16 48 z M 22 48 A 1 1 0 0 0 21 49 A 1 1 0 0 0 22 50 A 1 1 0 0 0 23 49 A 1 1 0 0 0 22 48 z M 28 48 A 1 1 0 0 0 27 49 A 1 1 0 0 0 28 50 A 1 1 0 0 0 29 49 A 1 1 0 0 0 28 48 z M 46 48 A 1 1 0 0 0 45 49 A 1 1 0 0 0 46 50 A 1 1 0 0 0 47 49 A 1 1 0 0 0 46 48 z M 52 48 A 1 1 0 0 0 51 49 A 1 1 0 0 0 52 50 A 1 1 0 0 0 53 49 A 1 1 0 0 0 52 48 z M 58 48 A 1 1 0 0 0 57 49 A 1 1 0 0 0 58 50 A 1 1 0 0 0 59 49 A 1 1 0 0 0 58 48 z M 64 48 A 1 1 0 0 0 63 49 A 1 1 0 0 0 64 50 A 1 1 0 0 0 65 49 A 1 1 0 0 0 64 48 z M 13 51 A 1 1 0 0 0 12 52 A 1 1 0 0 0 13 53 A 1 1 0 0 0 14 52 A 1 1 0 0 0 13 51 z M 19 51 A 1 1 0 0 0 18 52 A 1 1 0 0 0 19 53 A 1 1 0 0 0 20 52 A 1 1 0 0 0 19 51 z M 25 51 A 1 1 0 0 0 24 52 A 1 1 0 0 0 25 53 A 1 1 0 0 0 26 52 A 1 1 0 0 0 25 51 z M 31 51 A 1 1 0 0 0 30 52 A 1 1 0 0 0 31 53 A 1 1 0 0 0 32 52 A 1 1 0 0 0 31 51 z M 43 51 A 1 1 0 0 0 42 52 A 1 1 0 0 0 43 53 A 1 1 0 0 0 44 52 A 1 1 0 0 0 43 51 z M 49 51 A 1 1 0 0 0 48 52 A 1 1 0 0 0 49 53 A 1 1 0 0 0 50 52 A 1 1 0 0 0 49 51 z M 55 51 A 1 1 0 0 0 54 52 A 1 1 0 0 0 55 53 A 1 1 0 0 0 56 52 A 1 1 0 0 0 55 51 z M 61 51 A 1 1 0 0 0 60 52 A 1 1 0 0 0 61 53 A 1 1 0 0 0 62 52 A 1 1 0 0 0 61 51 z M 67 51 A 1 1 0 0 0 66 52 A 1 1 0 0 0 67 53 A 1 1 0 0 0 68 52 A 1 1 0 0 0 67 51 z M 16 54 A 1 1 0 0 0 15 55 A 1 1 0 0 0 16 56 A 1 1 0 0 0 17 55 A 1 1 0 0 0 16 54 z M 22 54 A 1 1 0 0 0 21 55 A 1 1 0 0 0 22 56 A 1 1 0 0 0 23 55 A 1 1 0 0 0 22 54 z M 28 54 A 1 1 0 0 0 27 55 A 1 1 0 0 0 28 56 A 1 1 0 0 0 29 55 A 1 1 0 0 0 28 54 z M 34 54 A 1 1 0 0 0 33 55 A 1 1 0 0 0 34 56 A 1 1 0 0 0 35 55 A 1 1 0 0 0 34 54 z M 40 54 A 1 1 0 0 0 39 55 A 1 1 0 0 0 40 56 A 1 1 0 0 0 41 55 A 1 1 0 0 0 40 54 z M 46 54 A 1 1 0 0 0 45 55 A 1 1 0 0 0 46 56 A 1 1 0 0 0 47 55 A 1 1 0 0 0 46 54 z M 52 54 A 1 1 0 0 0 51 55 A 1 1 0 0 0 52 56 A 1 1 0 0 0 53 55 A 1 1 0 0 0 52 54 z M 58 54 A 1 1 0 0 0 57 55 A 1 1 0 0 0 58 56 A 1 1 0 0 0 59 55 A 1 1 0 0 0 58 54 z M 64 54 A 1 1 0 0 0 63 55 A 1 1 0 0 0 64 56 A 1 1 0 0 0 65 55 A 1 1 0 0 0 64 54 z M 19 57 A 1 1 0 0 0 18 58 A 1 1 0 0 0 19 59 A 1 1 0 0 0 20 58 A 1 1 0 0 0 19 57 z M 25 57 A 1 1 0 0 0 24 58 A 1 1 0 0 0 25 59 A 1 1 0 0 0 26 58 A 1 1 0 0 0 25 57 z M 31 57 A 1 1 0 0 0 30 58 A 1 1 0 0 0 31 59 A 1 1 0 0 0 32 58 A 1 1 0 0 0 31 57 z M 37 57 A 1 1 0 0 0 36 58 A 1 1 0 0 0 37 59 A 1 1 0 0 0 38 58 A 1 1 0 0 0 37 57 z M 43 57 A 1 1 0 0 0 42 58 A 1 1 0 0 0 43 59 A 1 1 0 0 0 44 58 A 1 1 0 0 0 43 57 z M 49 57 A 1 1 0 0 0 48 58 A 1 1 0 0 0 49 59 A 1 1 0 0 0 50 58 A 1 1 0 0 0 49 57 z M 55 57 A 1 1 0 0 0 54 58 A 1 1 0 0 0 55 59 A 1 1 0 0 0 56 58 A 1 1 0 0 0 55 57 z M 61 57 A 1 1 0 0 0 60 58 A 1 1 0 0 0 61 59 A 1 1 0 0 0 62 58 A 1 1 0 0 0 61 57 z M 22 60 A 1 1 0 0 0 21 61 A 1 1 0 0 0 22 62 A 1 1 0 0 0 23 61 A 1 1 0 0 0 22 60 z M 28 60 A 1 1 0 0 0 27 61 A 1 1 0 0 0 28 62 A 1 1 0 0 0 29 61 A 1 1 0 0 0 28 60 z M 34 60 A 1 1 0 0 0 33 61 A 1 1 0 0 0 34 62 A 1 1 0 0 0 35 61 A 1 1 0 0 0 34 60 z M 40 60 A 1 1 0 0 0 39 61 A 1 1 0 0 0 40 62 A 1 1 0 0 0 41 61 A 1 1 0 0 0 40 60 z M 46 60 A 1 1 0 0 0 45 61 A 1 1 0 0 0 46 62 A 1 1 0 0 0 47 61 A 1 1 0 0 0 46 60 z M 52 60 A 1 1 0 0 0 51 61 A 1 1 0 0 0 52 62 A 1 1 0 0 0 53 61 A 1 1 0 0 0 52 60 z M 58 60 A 1 1 0 0 0 57 61 A 1 1 0 0 0 58 62 A 1 1 0 0 0 59 61 A 1 1 0 0 0 58 60 z M 25 63 A 1 1 0 0 0 24 64 A 1 1 0 0 0 25 65 A 1 1 0 0 0 26 64 A 1 1 0 0 0 25 63 z M 31 63 A 1 1 0 0 0 30 64 A 1 1 0 0 0 31 65 A 1 1 0 0 0 32 64 A 1 1 0 0 0 31 63 z M 37 63 A 1 1 0 0 0 36 64 A 1 1 0 0 0 37 65 A 1 1 0 0 0 38 64 A 1 1 0 0 0 37 63 z M 43 63 A 1 1 0 0 0 42 64 A 1 1 0 0 0 43 65 A 1 1 0 0 0 44 64 A 1 1 0 0 0 43 63 z M 49 63 A 1 1 0 0 0 48 64 A 1 1 0 0 0 49 65 A 1 1 0 0 0 50 64 A 1 1 0 0 0 49 63 z M 55 63 A 1 1 0 0 0 54 64 A 1 1 0 0 0 55 65 A 1 1 0 0 0 56 64 A 1 1 0 0 0 55 63 z M 28 66 A 1 1 0 0 0 27 67 A 1 1 0 0 0 28 68 A 1 1 0 0 0 29 67 A 1 1 0 0 0 28 66 z M 34 66 A 1 1 0 0 0 33 67 A 1 1 0 0 0 34 68 A 1 1 0 0 0 35 67 A 1 1 0 0 0 34 66 z M 40 66 A 1 1 0 0 0 39 67 A 1 1 0 0 0 40 68 A 1 1 0 0 0 41 67 A 1 1 0 0 0 40 66 z M 46 66 A 1 1 0 0 0 45 67 A 1 1 0 0 0 46 68 A 1 1 0 0 0 47 67 A 1 1 0 0 0 46 66 z M 52 66 A 1 1 0 0 0 51 67 A 1 1 0 0 0 52 68 A 1 1 0 0 0 53 67 A 1 1 0 0 0 52 66 z" /></svg>
												{myVote}
											</span></Card.Title>
											{/* <Card.Subtitle>Min Bid Price {extra} NEAR</Card.Subtitle> */}
											<Card.Text>
												{description} {owner_id}
											</Card.Text>

											<div>
												<Button variant="primary" style={{ backgroundColor: "#0072CE", float: "right" }} disabled={voteButtonDisabled}
													onClick={() => nftVote(account, token_id)}>
													Vote
												</Button>

												{/* { 
									 <>
										<div>
											<h4>Add Sale Conditions</h4>
											<input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
											{
												getTokenOptions(ft, setFT)
											}
											<button onClick={() => {
												if (!price.length) {
													return alert('Enter a price');
												}
												const newSaleConditions = {
													...saleConditions,
													[ft]: parseNearAmount(price)
												}
												setSaleConditions(newSaleConditions);
												setPrice('');
												setFT('near');
												handleSaleUpdate(account, token_id, newSaleConditions);
											}}>Add</button>
										</div>
										<div>
											<i style={{ fontSize: '0.75rem' }}>Note: price 0 means open offers</i>
										</div>
									</>
								 }  */}

											</div>


										</Card.Body>
									</Card>
									{/* {
							marketStoragePaid !== '0' ? <>
								<h4>Royalties</h4>
								{
									Object.keys(royalty).length > 0 ?
										Object.entries(royalty).map(([receiver, amount]) => <div key={receiver}>
											{receiver} - {amount / 100}%
										</div>)
										:
										<p>This token has no royalties.</p>
								}
								{
									Object.keys(sale_conditions).length > 0 && <>
										<h4>Current Sale Conditions</h4>
										{
											Object.entries(sale_conditions).map(([ft_token_id, price]) => <div className="margin-bottom" key={ft_token_id}>
												{price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
											</div>)
										}
									</>
								}
								{
									// saleConditions.length > 0 &&
									// 	<div>
									// 		<h4>Pending Sale Updates</h4>
									// 		{
									// 			saleConditions.map(({ price, ft_token_id }) => <div className="margin-bottom" key={ft_token_id}>
									// 				{price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
									// 			</div>)
									// 		}
									// 		<button className="pulse-button" onClick={() => handleSaleUpdate(account, token_id)}>Update Sale Conditions</button>
									// 	</div>
								}
								 { 
									accountId === owner_id && <>
										<div>
											<h4>Add Sale Conditions</h4>
											<input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
											{
												getTokenOptions(ft, setFT)
											}
											<button onClick={() => {
												if (!price.length) {
													return alert('Enter a price');
												}
												const newSaleConditions = {
													...saleConditions,
													[ft]: parseNearAmount(price)
												}
												setSaleConditions(newSaleConditions);
												setPrice('');
												setFT('near');
												handleSaleUpdate(account, token_id, newSaleConditions);
											}}>Add</button>
										</div>
										<div>
											<i style={{ fontSize: '0.75rem' }}>Note: price 0 means open offers</i>
										</div>
									</>
								 } 
								 {
									Object.keys(bids).length > 0 && <>
										<h4>Offers</h4>
										{
											Object.entries(bids).map(([ft_token_id, { owner_id, price }]) => <div className="offers" key={ft_token_id}>
												<div>
													{price === '0' ? 'open' : formatNearAmount(price, 4)} - {token2symbol[ft_token_id]}
												</div>
												<button onClick={() => handleAcceptOffer(token_id, ft_token_id)}>Accept</button>
											</div>)
										}
									</>
								}
							</>
								:
								<div className="center">
									<button onClick={() => handleRegisterStorage(account)}>Register with Market to Sell</button>
								</div>
						} */}
								</Col>)
						}
					</Row></Container>
				}
			</>
		}

	</>;
};

