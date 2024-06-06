import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [donationAmountInput, setDonationAmountInput] = useState("");
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [donationError, setDonationError] = useState("");
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [pin, setPin] = useState("");
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: "Save the Children", goal: ethers.utils.parseEther("100"), description: "Provide essential resources and support to children in need around the world." },
    { id: 2, name: "Clean Water Project", goal: ethers.utils.parseEther("150"), description: "Ensure access to clean and safe drinking water in underserved communities." },
    { id: 3, name: "Plant a Tree", goal: ethers.utils.parseEther("50"), description: "Help combat climate change by planting trees in deforested areas." },
    { id: 4, name: "Educate Every Child", goal: ethers.utils.parseEther("200"), description: "Support educational programs for children worldwide." },
    { id: 5, name: "Renewable Energy Initiative", goal: ethers.utils.parseEther("300"), description: "Promote the adoption of renewable energy sources for a sustainable future." }
  ]);
  const [donations, setDonations] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (account) => {
    if (account && account.length > 0) {
      console.log("Account connected: ", account[0]);
      setAccount(account[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    try {
      const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
      handleAccount(accounts);
      getATMContract();
    } catch (error) {
      console.error("Error connecting account:", error);
    }
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balance = await atm.getBalance();
      setBalance(ethers.utils.formatEther(balance));
    }
  };

  const donate = async () => {
    if (!atm || !ethers.utils.isAddress(account)) return;
    setDonationError("");

    try {
      if (!selectedCampaignId) {
        setDonationError("Please select a campaign to donate");
        return;
      }

      const selectedCampaign = campaigns.find(campaign => campaign.id === parseInt(selectedCampaignId));
      if (!selectedCampaign) {
        setDonationError("Invalid campaign selected");
        return;
      }

      const donationAmount = ethers.utils.parseEther(donationAmountInput);

      if (donationAmount.lt(ethers.utils.parseEther("1"))) {
        setDonationError("Donation amount must be at least 1 ETH");
        return;
      }

      const tx = await atm.deposit(donationAmount);
      await tx.wait();
      getBalance();
      setDonationAmountInput("");

      const newDonation = { id: selectedCampaign.id, name: selectedCampaign.name, amount: donationAmount };
      setDonations([...donations, newDonation]);

      addNotification(`Donated ${ethers.utils.formatEther(donationAmount)} ETH to ${selectedCampaign.name}`);
    } catch (error) {
      console.error("Error donating:", error);
      addNotification("Donation failed");
    }
  };

  const deposit = async () => {
    if (!atm || !ethers.utils.isAddress(account)) return;

    try {
      const depositAmount = ethers.utils.parseEther(depositAmountInput);

      const tx = await atm.deposit(depositAmount);
      await tx.wait();
      getBalance();
      setDepositAmountInput("");
      addNotification(`Deposited ${ethers.utils.formatEther(depositAmount)} ETH`);
    } catch (error) {
      console.error("Error depositing:", error);
      addNotification("Deposit failed");
    }
  };

  const withdraw = async () => {
    if (!atm || !ethers.utils.isAddress(account)) return;

    try {
      const withdrawAmount = ethers.utils.parseEther(withdrawAmountInput);

      const tx = await atm.withdraw(withdrawAmount);
      await tx.wait();
      getBalance();
      setWithdrawAmountInput("");
      addNotification(`Withdrawn ${ethers.utils.formatEther(withdrawAmount)} ETH`);
    } catch (error) {
      console.error("Error withdrawing:", error);
      addNotification("Withdrawal failed");
    }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const addNotification = (message) => {
    setNotifications([...notifications, message]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const showCampaignInfo = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      alert(`${campaign.name}\nGoal: ${ethers.utils.formatEther(campaign.goal)} ETH\nDescription: ${campaign.description}`);
    }
  };

  const handleLogin = () => {
    if (accountNumber && pin) {
      if (pin.length !== 4) {
        alert("PIN must be exactly 4 digits long");
        return;
      }
      setIsLoggedIn(true);
    } else {
      alert("Please enter both account number and PIN");
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Connect Account to Donate</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {isBalanceHidden ? "******" : `${balance} ETH`}</p>
        <button onClick={toggleBalanceVisibility}>
          {isBalanceHidden ? "Show Balance" : "Hide Balance"}
        </button>
        <br /> <br></br> <br></br>
        <input
          type="text"
          value={donationAmountInput}
          onChange={(e) => setDonationAmountInput(e.target.value)}
          placeholder="Enter donation amount"
        />
        <button onClick={donate}>Donate</button>
        {donationError && <p style={{ color: 'red' }}>{donationError}</p>}
        <br /> <br></br> <br></br>
        <input
          type="text"
          value={depositAmountInput}
          onChange={(e) => setDepositAmountInput(e.target.value)}
          placeholder="Enter deposit amount"
        />
        <button onClick={deposit}>Deposit</button>
        <br />
        <input
          type="text"
          value={withdrawAmountInput}
          onChange={(e) => setWithdrawAmountInput(e.target.value)}
          placeholder="Enter withdrawal amount"
        />
        <button onClick={withdraw}>Withdraw</button>
        <br />
        <div>
          <h2>Donation Campaigns</h2>
          <div style={{ marginBottom: '20px' }}>
            <select value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}>
              <option value="">Select Campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} - Goal: {ethers.utils.formatEther(campaign.goal)} ETH
                </option>
              ))}
            </select>
          </div>
          <div>
            {campaigns.map((campaign) => (
              <button key={campaign.id} onClick={() => showCampaignInfo(campaign.id)} style={{ marginRight: '10px' }}>
                Info about {campaign.name}
              </button>
            ))}
          </div>
        </div>
        <br />
        <div>
          <h2>Your Donations</h2>
          <ul>
            {donations.map((donation) => (
              <li key={donation.id}>{donation.name} - {ethers.utils.formatEther(donation.amount)} ETH</li>
            ))}
          </ul>
        </div>
        <br />
        <button onClick={clearNotifications}>Clear Recent Transactions</button>
        {notifications.length > 0 && (
          <div>
            <h2>Notifications</h2>
            <ul>
              {notifications.map((notification, index) => (
                <li key={index}>{notification}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Donation Platform!</h1>
      </header>
      <div className="atm-functions">
        {!isLoggedIn ? (
          <div>
            <h2>Login</h2>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account Number"
            />
            <br />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
            />
            <br />
            <button onClick={handleLogin}>Login</button>
          </div>
        ) : (
          initUser()
        )}
      </div>
      <style jsx>{`
        .container {
          text-align: center;
        }
        .atm-functions {
          margin-top: 20px;
        }
      `}</style>
    </main>
  );
}
