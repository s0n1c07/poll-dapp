// App.js - Main application component
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import PollDAppABI from "./PollDAppABI.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CONTRACT_ADDRESS = "0x02320345798052943184A062138d54A2398CcFe4";

function App() {
  const [account, setAccount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contract, setContract] = useState(null);
  const [polls, setPolls] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setvoteLoading] = useState(false);
  const [addloading, setaddLoading] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [newPollDuration, setNewPollDuration] = useState(60);
  const [owner, setOwner] = useState("");
  const [voted, setvoted] = useState(false);

  async function connectWallet() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      setAccount(account);
      toast.success("Wallet connected successfully!");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const pollContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PollDAppABI,
        signer
      );
      setContract(pollContract);

      const ownerAddress = await pollContract.owner();
      setOwner(ownerAddress);

      await loadPolls(pollContract, account);
      await loadLeaderboard(pollContract);

      setaddLoading(false);
      return pollContract;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect to wallet.");
      setaddLoading(false);
      return null;
    }
  }

  async function resetPolls() {
    try {
      if (!contract) return;
      const tx = await contract.resetAllPolls();
      await tx.wait();
      toast.error("All polls reset.");
      await loadPolls(contract, account);
      await loadLeaderboard(contract);
    } catch (error) {
      console.error("Error resetting polls:", error);
    }
  }
  function disconnectWallet() {
    setAccount("");
    setContract(null);
    toast.info("Wallet disconnected.");
  }

  const loadPolls = async (pollContract, user) => {
    setLoading(true);
    try {
      const count = await pollContract.pollCount();
      const pollData = [];

      for (let i = 0; i < count; i++) {
        try {
          const [question, active, deadline, totalVotes, creator, deleted] =
            await pollContract.getPoll(i);
          if (deleted) continue;
          const options = await pollContract.getPollOptions(i);
          const results = await pollContract.getResults(i);
          const [voted, option] = await pollContract.getUserVote(i, user);

          pollData.push({
            id: i,
            question,
            options,
            voteCounts: results.map((v) => v.toNumber()),
            totalVotes: totalVotes.toNumber(),
            active,
            deadline: deadline.toNumber(),
            hasVoted: voted,
            userOption: voted ? option.toNumber() : null,
            creator,
          });
        } catch (err) {
          continue;
        }
      }
      setPolls(pollData.reverse());
    } catch (err) {
      console.error("Error loading polls:", err);
    }
    setLoading(false);
  };

  const loadLeaderboard = async (pollContract) => {
    setLoading(true);
    try {
      const count = await pollContract.pollCount();
      const leaderboardData = [];

      for (let i = 0; i < count; i++) {
        const [question, active, deadline, totalVotes, creator, deleted] =
          await pollContract.getPoll(i);
        if (deleted) continue;

        leaderboardData.push({
          id: i,
          question,
          totalVotes: totalVotes.toNumber(),
        });
      }

      leaderboardData.sort((a, b) => b.totalVotes - a.totalVotes); // Sort by votes descending
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    }
    setLoading(false);
  };

  async function createPoll(e) {
    e.preventDefault();
    try {
      const options = newPollOptions.filter((option) => option.trim() !== "");
      if (options.length < 2) {
        alert("You need at least 2 options for a poll");
        return;
      }
      if (newPollDuration <= 0) {
        toast.error("Please enter a valid duration");
        setaddLoading(false);
        return;
      }
      setaddLoading(true);
      const tx = await contract.createPoll(
        newPollQuestion,
        options,
        Number(newPollDuration)
      );
      await tx.wait();
      toast.success("Poll created successfully!");
      setNewPollQuestion("");
      setNewPollOptions(["", ""]);
      setNewPollDuration(60);

      await loadPolls(contract, account);
      setaddLoading(false);
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to connect to wallet.");
      setaddLoading(false);
    }
  }

  async function vote(pollId, optionIndex) {
    try {
      if (!contract) return;
      // setvoteLoading(true);
      const tx = await contract.vote(pollId, optionIndex);
      await tx.wait();
      await loadPolls(contract, account);
      // setvoteLoading(false);
      toast.success("Vote cast successfully!");
    } catch (error) {
      // setvoteLoading(false);
      toast.error("Error voting: " + error.message);
    }
  }

  async function deactivatePoll(pollId) {
    const tx = await contract.deactivatePoll(pollId);
    await tx.wait();
    toast.info("Poll deactivated.");
    await loadPolls(contract, account);
  }

  async function deletePoll(pollId) {
    const tx = await contract.deletePoll(pollId);
    await tx.wait();
    toast.warn("Poll deleted.");
    await loadPolls(contract, account);
  }

  async function editPollOptions(pollId, newOptions) {
    const tx = await contract.editOptions(pollId, newOptions);
    await tx.wait();
    await loadPolls(contract, account);
  }

  function addOption() {
    setNewPollOptions([...newPollOptions, ""]);
  }

  function removeOption(index) {
    if (newPollOptions.length <= 2) return;
    const updated = [...newPollOptions];
    updated.splice(index, 1);
    setNewPollOptions(updated);
  }

  function updateOption(index, value) {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  }
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  useEffect(() => {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      setaddLoading(false);
      return;
    }
    const initialize = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress().catch(() => null);

      if (userAddress) {
        setAccount(userAddress);
        const pollContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          PollDAppABI,
          signer
        );
        setContract(pollContract);
        const ownerAddress = await pollContract.owner();
        setOwner(ownerAddress);
        await loadPolls(pollContract, userAddress);
        await loadLeaderboard(pollContract);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    initialize();
    window.ethereum.on("accountsChanged", async (accounts) => {
      setAccount(accounts[0]);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const pollContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PollDAppABI,
        signer
      );
      setContract(pollContract);
      await loadPolls(pollContract, accounts[0]);
      await loadLeaderboard(pollContract);
    });
  }, []);

  return (
    <div className="App">
      <ToastContainer />
      <header className="App-header">
        {account && (
          <button onClick={disconnectWallet} className="disconnect-top-button">
            Disconnect
          </button>
        )}
        <h1>DeFi Poll DApp </h1>
        <p>
          Create and participate in polls on the blockchain{" "}
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </p>
        {/* <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button> */}

        <div className="top-buttons">
          {!account ? (
            <button onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <>
              <span className="wallet-info">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              {account === owner && (
                <button onClick={resetPolls}>Reset All Polls</button>
              )}
            </>
          )}
        </div>
      </header>
      <main className="main-layout">
        {/* Left Side: Create Poll */}
        <div className="left-panel">
          <section className="create-poll">
            <h2>Create a New Poll</h2>
            <form onSubmit={createPoll}>
              <div className="form-group">
                <label>Question:</label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  required
                  placeholder="Enter your poll question"
                />
              </div>

              <div className="form-group">
                <label>Duration (in seconds):</label>
                <input
                  type="number"
                  value={newPollDuration === 0 ? "" : newPollDuration}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setNewPollDuration(0); // internally track it as 0 but show blank
                    } else if (Number(value) >= 0) {
                      setNewPollDuration(Number(value));
                    }
                  }}
                  min="0"
                  placeholder="Poll duration"
                />
              </div>

              <div className="form-group">
                <label>Options:</label>
                {newPollOptions.map((option, index) => (
                  <div key={index} className="option-row">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-option"
                      onClick={() => removeOption(index)}
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-option"
                  onClick={addOption}
                >
                  + Add Option
                </button>
              </div>

              <button type="submit" className="create-button">
                <div className="button-content">
                  <span>Create Poll</span>
                  {addloading && <div className="spinner small"></div>}
                </div>
              </button>
            </form>
          </section>
          {/* </div> */}
          {/* <div className="left-panel"> */}
          <section className="leaderboard">
            <h2>Leaderboard</h2>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : leaderboard.length === 0 ? (
              <p>No polls available.</p>
            ) : (
              <div className="leaderboard-grid">
                {leaderboard.map((poll, index) => (
                  <div key={poll.id} className="leaderboard-card">
                    <h3
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {index + 1}. {poll.question}
                      </span>
                      <span
                        style={{
                          backgroundColor: "lightpink",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          fontSize: "0.8em",
                          color: "#333",
                        }}
                      >
                        {poll.totalVotes} votes
                      </span>
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        {/* Right Side: Polls + Leaderboard */}
        <div className="right-panel">
          <section className="polls">
            <h2>All Polls</h2>

            <input
              type="text"
              placeholder="Search polls by question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
            />
            {loading ? (
              <div className="loading-spinner"></div>
            ) : polls.length === 0 ? (
              <p>No polls available.</p>
            ) : (
              <div className="polls-grid">
                {polls
                  .filter((poll) =>
                    poll.question
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((poll) => (
                    <div
                      key={poll.id}
                      className={`poll-card ${
                        !poll.active || poll.deadline * 1000 < Date.now()
                          ? "expired"
                          : ""
                      }`}
                    >
                      <h3>
                        {poll.question}
                        {account === poll.creator && (
                          <span
                            style={{
                              fontSize: "0.7em",
                              color: "darkgreen",
                              opacity: 30,
                              marginLeft: "8px",
                            }}
                          >
                            (Created by you)
                          </span>
                        )}
                      </h3>

                      <p className="poll-meta">
                        Ends: {new Date(poll.deadline * 1000).toLocaleString()}
                      </p>
                      <div className="options">
                        {poll.options.map((option, idx) => (
                          <div key={idx} className="option">
                            <div className="option-info">
                              <span>{option}</span>
                              <span>{poll.voteCounts[idx]} votes</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress"
                                style={{
                                  width:
                                    poll.totalVotes > 0
                                      ? `${
                                          (poll.voteCounts[idx] /
                                            poll.totalVotes) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                            {!poll.hasVoted &&
                              poll.active &&
                              poll.deadline * 1000 > Date.now() && (
                                <button
                                  className="vote-button"
                                  onClick={() => {
                                    vote(poll.id, idx);
                                    // setvoted(idx);
                                  }}
                                >
                                  Vote{" "}
                                  {voteLoading && voted === idx && (
                                    <div className="spinner small"></div>
                                  )}
                                </button>
                              )}
                          </div>
                        ))}
                      </div>

                      {poll.hasVoted && (
                        <p className="voted-message">
                          You voted: {poll.options[poll.userOption]}
                        </p>
                      )}

                      {/* Admin buttons */}
                      {account === poll.creator && (
                        <div className="poll-actions">
                          {poll.active && poll.deadline * 1000 > Date.now() && (
                            <button
                              className="admin-action"
                              onClick={() => deactivatePoll(poll.id)}
                            >
                              Deactivate
                            </button>
                          )}
                          {!poll.active || poll.deadline * 1000 < Date.now() ? (
                            <button
                              className="admin-action"
                              onClick={() => deletePoll(poll.id)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* <section className="leaderboard"> */}

          {/* </section> */}
        </div>
      </main>
      <footer>
        <p>DeFi Poll DApp - Created for blockchain beginners</p>
      </footer>
    </div>
  );
}

export default App;
