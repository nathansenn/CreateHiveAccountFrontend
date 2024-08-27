import React, { useState } from 'react';
import { getAddress, signMessage } from 'sats-connect';

function App() {
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);
  const [serverResponse, setServerResponse] = useState(null);

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    try {
      const walletAddresses = await getWalletAddress();

      console.log('Wallet Addresses:', walletAddresses);

      if (walletAddresses && walletAddresses.length > 0) {
        const bitcoinAddress = walletAddresses[0].address;
        const messageToSign = `Hive:${username}`;

        const signedMessageResponse = await signMessageFromWallet(messageToSign, bitcoinAddress);

        setWalletAddress(bitcoinAddress);
        setSignedMessage(signedMessageResponse);

        console.log('Bitcoin Address:', bitcoinAddress);
        console.log('Signed Message:', signedMessageResponse);

        // Send data to the server
        const response = await sendToServer(username, bitcoinAddress, messageToSign, signedMessageResponse);
        setServerResponse(response);

      } else {
        throw new Error('No addresses found in the response.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setServerResponse(`Error: ${error.message}`);
    }
  };

  const getWalletAddress = () => {
    return new Promise((resolve, reject) => {
      const getAddressOptions = {
        payload: {
          purposes: ['payment'],
          message: 'Address for creating Hive account',
          network: {
            type: 'Mainnet'
          },
        },
        onFinish: (response) => {
          console.log('onFinish response:', response);
          resolve(response.addresses);
        },
        onCancel: () => reject(new Error('Request canceled')),
      };

      getAddress(getAddressOptions);
    });
  };

  const signMessageFromWallet = (message, address) => {
    return new Promise((resolve, reject) => {
      const signMessageOptions = {
        payload: {
          network: {
            type: 'Mainnet',
          },
          address: address,
          message: message,
        },
        onFinish: (response) => {
          console.log('Signature response:', response);
          resolve(response);
        },
        onCancel: () => reject(new Error('Signing canceled')),
      };

      signMessage(signMessageOptions);
    });
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
        <h1>Create Hive Account</h1>
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
          <button type="submit">Create</button>
        </form>

        {walletAddress && (
            <div>
              <h3>Wallet Address:</h3>
              <p>{walletAddress}</p>
            </div>
        )}

        {signedMessage && (
            <div>
              <h3>Signed Message:</h3>
              <p>{JSON.stringify(signedMessage)}</p>
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
