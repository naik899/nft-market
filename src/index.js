import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './state/app.js';
import {initContract} from '../auctionHouse/src/utils'

window.nearInitPromise = initContract()
  .then(() => {
    ReactDOM.render(
		<AppProvider>
			<App />
		</AppProvider>,
		document.getElementById('root')
	)
  })
  .catch(console.error)
