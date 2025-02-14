import React, {useEffect, useState} from 'react';
import * as nearAPI from 'near-api-js';
import { handleMint, nftApprove, nftTransfer } from '../state/actions';
import { 
	isAccountTaken,
	networkId,
} from '../utils/near-utils';

const {
	KeyPair,
} = nearAPI;

export const Contract = ({ near, update, account }) => {
	if (!account) return <p>Please connect your NEAR Wallet</p>;

	const [media, setMedia] = useState('');
	const [validMedia, setValidMedia] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [minBidAmount, setMinBidAmount] = useState('');

	const [royalties, setRoyalties] = useState({});
	const [royalty, setRoyalty] = useState([]);
	const [receiver, setReceiver] = useState([]);

	return <>
		<h4>Mint Something</h4>
		<input className="full-width" placeholder="Image Link" value={media} onChange={(e) => setMedia(e.target.value)} />
		<img crossOrigin="anonymous" height="400" src={media} onLoad={() => setValidMedia(true)} onError={() => setValidMedia(true)} />
		
		{ !validMedia && <p>Image link is invalid.</p> }

		<input className="full-width" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
		<input className="full-width" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
		<input className="full-width" placeholder="MinBidAmount" value={minBidAmount} onChange={(e) => setMinBidAmount(e.target.value.toString())} />
		
		{/* <h4>Royalties</h4>
		{
			Object.keys(royalties).length > 0 ? 
				Object.entries(royalties).map(([receiver, royalty]) => <div key={receiver}>
					{receiver} - {royalty} % <button onClick={() => {
						delete royalties[receiver];
						setRoyalties(Object.assign({}, royalties));
					}}>❌</button>
				</div>)
				:
				<p>No royalties added yet.</p>
		}
		<input className="full-width" placeholder="Account ID" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
		<input type="number" className="full-width" placeholder="Percentage" value={royalty} onChange={(e) => setRoyalty(e.target.value)} />
		<button onClick={async () => {
			const exists = await isAccountTaken(receiver);
			if (!exists) return alert(`Account: ${receiver} does not exist on ${networkId ==='default' ? 'testnet' : 'mainnet'}.`);
			setRoyalties(Object.assign({}, royalties, {
				[receiver]: royalty
			}));
		}}>Add Royalty</button>

		<div className="line"></div> */}

		<button onClick={() => handleMint(account, royalties, media, validMedia, title, description, minBidAmount)}>Mint</button>
	</>;
};

