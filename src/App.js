import React, { useContext, useEffect, useState } from 'react';

import { appStore, onAppMount } from './state/app';

import { Wallet } from './components/Wallet';
import { Contract } from './components/Contract';
import { Gallery } from './components/Gallery';

import Avatar from 'url:./img/avatar.jpg';
import NearLogo from 'url:./img/near_icon.svg';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Toast, ToastContainer } from 'react-bootstrap';
import './App.scss';

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const { app, views, app: { tab, snack }, near, wallet, contractAccount, account, loading } = state;

	const [profile, setProfile] = useState(false);

	const onMount = () => {
		dispatch(onAppMount());
	};
	useEffect(onMount, []);

	// alert("Hello World!");
	const signedIn = ((wallet && wallet.signedIn));

	if (profile && !signedIn) {
		setProfile(false);
	}

	const stage = localStorage.getItem("stage");

	return <>
		{loading && <div className="loading">
			<img src={NearLogo} />
		</div>
		}
		{
			snack &&
			<div className="snack">
				{snack}
			</div>
		}

		<div className="background"></div>

		<div id="menu">
			<div>
				<img style={{ opacity: signedIn ? 1 : 0.25 }, { height: "80px" }, { width: "120px" }} src="https://s3.ap-south-1.amazonaws.com/emartshop.in/near_logo.png" crossOrigin="anonymous"
					onClick={() => setProfile(!profile)}
				/>
			</div>
			<div>
				{!signedIn ? <Wallet {...{ wallet }} /> : account.accountId}
			</div>
			{
				profile && signedIn && <div id="profile">
					<div>
						{
							wallet && wallet.signedIn && <Wallet {...{ wallet, account, update, dispatch, handleClose: () => setProfile(false) }} />
						}
					</div>
				</div>
			}
		</div>


		{
			signedIn && <div id="tabs">
				<div onClick={() => update('app.tab', 1)} style={{ background: tab === 1 ? '#fed' : '' }}>Market</div>
				<div onClick={() => update('app.tab', 2)} style={{ background: tab === 2 ? '#fed' : '' }}>Auction House</div>
				<div onClick={() => update('app.tab', 3)} style={{ background: tab === 3 ? '#fed' : '' }}>Mint</div>
			</div>
		}

		{

			window.location.href.includes("transactionHashes") && stage === "mint" &&
			<ToastContainer className="p-3" position='top-center'>
				<Toast>
					<Toast.Header>

						<strong className="me-auto">Stage</strong>

					</Toast.Header>
					<Toast.Body>Minted. Inside Approval now</Toast.Body>
				</Toast>
			</ToastContainer>
		}

		{signedIn && tab === 3 &&
			<div id="contract">
				{
					signedIn &&
					<Contract {...{ near, update, wallet, account }} />
				}
			</div>
		}
		<div id="gallery">
			<Gallery {...{ app, views, update, loading, contractAccount, account, dispatch }} />
		</div>
	</>;
};

export default App;
