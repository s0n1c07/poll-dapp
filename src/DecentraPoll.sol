// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentraPoll {
    address public owner;

    struct Poll {
        string question;
        string[] options;
        uint deadline;
        bool active;
        uint[] voteCounts;
        uint totalVotes;
        mapping(address => bool) hasVoted;
        mapping(address => uint) votes;
        address creator;
        bool deleted;
    }

    Poll[] private polls;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createPoll(string memory question, string[] memory options, uint duration) public {
    require(options.length >= 2, "At least 2 options required");

    Poll storage newPoll = polls.push();
    newPoll.creator = msg.sender; // Track who created the poll
    newPoll.question = question;
    newPoll.options = options;
    newPoll.deadline = block.timestamp + duration;
    newPoll.active = true;
    newPoll.voteCounts = new uint[](options.length);
}


    function getPoll(uint index) public view returns (string memory, bool, uint, uint,address,bool) {
        Poll storage p = polls[index];
        return (p.question, p.active, p.deadline, p.totalVotes,p.creator, p.deleted);
    }

    function getPollOptions(uint index) public view returns (string[] memory) {
        return polls[index].options;
    }

    function getResults(uint index) public view returns (uint[] memory) {
        return polls[index].voteCounts;
    }

    function getUserVote(uint index, address user) public view returns (bool, uint) {
        Poll storage p = polls[index];
        if (p.hasVoted[user]) {
            return (true, p.votes[user]);
        }
        return (false, 0);
    }

    function vote(uint index, uint option) public {
        Poll storage p = polls[index];
        require(p.active, "Poll inactive");
        require(block.timestamp <= p.deadline, "Poll ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        require(option < p.options.length, "Invalid option");

        p.voteCounts[option]++;
        p.totalVotes++;
        p.hasVoted[msg.sender] = true;
        p.votes[msg.sender] = option;
    }

    function deactivatePoll(uint _pollId) public {
        require(msg.sender == polls[_pollId].creator, "Only creator can deactivate");
        polls[_pollId].active = false;
    }

    function deletePoll(uint _pollId) public {
        require(msg.sender == polls[_pollId].creator, "Only creator can delete");
        polls[_pollId].deleted = true;
    }



    function resetAllPolls() public onlyOwner {
        delete polls;
    }

    function editOptions(uint index, string[] memory newOptions) public onlyOwner {
        require(newOptions.length >= 2, "At least 2 options required");
        Poll storage p = polls[index];
        p.options = newOptions;
        p.voteCounts = new uint[](newOptions.length);
        p.totalVotes = 0;
    }

    function pollCount() public view returns (uint) {
        return polls.length;
    }
}
