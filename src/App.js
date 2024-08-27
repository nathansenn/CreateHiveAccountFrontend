import React, { useState } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

function App() {
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  const [serverResponse, setServerResponse] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setStatus('Initializing...');

    try {
      // Step 1: Enable the extension
      const extensions = await web3Enable('Hive Account Creation');
      if (extensions.length === 0) {
        throw new Error('No extension installed, or the user did not accept the authorization');
      }

      setStatus('Waiting for account connection...');

      // Step 2: Wait for accounts to be connected
      const account = await waitForAccounts();
      const address = account.address;
      setWalletAddress(address);

      setStatus('Account connected. Signing message...');

      // Step 3: Sign the message
      const messageToSign = `Hive:${username}`;
      const signature = await signMessageFromWallet(messageToSign, address);
      setSignedMessage(signature);

      setStatus('Message signed. Sending to server...');

      // Step 4: Send to server
      const response = await sendToServer(username, address, messageToSign, signature);
      setServerResponse(response);

      setStatus('Account creation process completed.');

    } catch (error) {
      console.error('An error occurred:', error);
      setServerResponse(`Error: ${error.message}`);
      setStatus('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const waitForAccounts = async (timeout = 60000, interval = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const accounts = await web3Accounts();
      if (accounts.length > 0) {
        return accounts[0];
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timed out waiting for account connection');
  };

  const signMessageFromWallet = async (message, address) => {
    const injector = await web3FromAddress(address);
    const signRaw = injector?.signer?.signRaw;

    if (signRaw) {
      const { signature } = await signRaw({
        address: address,
        data: message,
        type: 'bytes'
      });

      return signature;
    } else {
      throw new Error('Signing is not supported by the extension');
    }
  };

  const sendToServer = async (username, address, message, signature) => {
    try {
      const response = await fetch('http://localhost:3000/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          address,
          message,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending data to server:', error);
      throw error;
    }
  };

  return (
      <div className="App">
        <h1>Create Hive Account (Polkadot)</h1>
        <form onSubmit={handleCreateAccount}>
          <label>
            Username:
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
          </label>
          <button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        {status && <p>{status}</p>}

        {walletAddress && (
            <div>
              <h3>Connected Wallet Address:</h3>
              <p>{walletAddress}</p>
            </div>
        )}

        {signedMessage && (
            <div>
              <h3>Signed Message:</h3>
              <p>{signedMessage}</p>
            </div>
        )}

        {serverResponse && (
            <div>
              <h3>Server Response:</h3>
              <p>{JSON.stringify(serverResponse)}</p>
            </div>
        )}
      </div>
  );
}

export default App;
