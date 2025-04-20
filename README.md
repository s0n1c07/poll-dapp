# DeFi Poll DApp

A decentralized application (DApp) that allows users to create and participate in blockchain-based polls. Built with **Solidity**, **React**, and **ethers.js**, this DApp ensures transparency, user ownership, and an interactive UI.

## Features

### Smart Contract (Solidity)
- **Poll Expiry**: Each poll now includes an expiry time after which voting is disabled.
- **Owner-Only Control**: The `resetAllPolls()` function is restricted to the contract owner.
- **Poll Deactivation**: Specific polls can be deactivated by the owner.
- **Poll Deletion**: Owners can delete polls from the blockchain.
- **Events**: Emits an event when a poll is closed for tracking and UI updates.

### Frontend (React + Ethers.js)
- **Created Time Display**: Shows how long ago a poll was created (e.g., "2 hours ago").
- **Loading Spinner**: Indicates when data is being fetched for All Polls and Leaderboard.
- **Vote Feedback**: After voting, the user sees their selected vote.
- **Vote Button Control**: Automatically disables the vote button if the user has already voted.
- **Dark/Light Mode**: Toggle between light and dark themes.
- **Toast Notifications**: Provides real-time feedback (e.g., "Vote cast successfully!").
- **User Tagging**: Polls created by the user are labeled as “Created by you.”
- **Search Filter**: Easily find polls using the keyword-based search bar.
- **Leaderboard**: Polls are ranked on a leaderboard based on the number of votes they receive.

## Tech Stack
- **Smart Contract**: Solidity
- **Frontend**: React, ethers.js
- **Styling**: TailwindCSS
- **Notifications**: React Toastify

## Getting Started

### Prerequisites
- Node.js & npm
- MetaMask or any Web3 wallet

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/defi-poll-dapp.git
cd defi-poll-dapp

# Install dependencies
npm install

# Run the frontend
npm run dev
```
