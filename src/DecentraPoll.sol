// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentraPoll {
    address public owner;

    struct Poll {
        string question;
        string[] options;
        uint256 deadline;
        bool active;
        uint256[] voteCounts;
        uint256 totalVotes;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes;
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

    function createPoll(
        string memory question,
        string[] memory options,
        uint256 duration
    ) public {
        require(options.length >= 2, "At least 2 options required");

        // push a new, empty Poll struct
        polls.push();
        Poll storage newPoll = polls[polls.length - 1];

        newPoll.creator = msg.sender;
        newPoll.question = question;
        newPoll.options = options;
        newPoll.deadline = block.timestamp + duration;
        newPoll.active = true;
        newPoll.voteCounts = new uint256[](options.length);
        // ← no hasVoted initialization here!
        // clear any leftover “voted” flag or stored vote from prior polls
        newPoll.hasVoted[msg.sender] = false;
        newPoll.votes[msg.sender] = 0;
    }

    function getPoll(uint256 index)
        public
        view
        returns (
            string memory,
            bool,
            uint256,
            uint256,
            address,
            bool
        )
    {
        Poll storage p = polls[index];
        return (
            p.question,
            p.active,
            p.deadline,
            p.totalVotes,
            p.creator,
            p.deleted
        );
    }

    function getPollOptions(uint256 index)
        public
        view
        returns (string[] memory)
    {
        return polls[index].options;
    }

    function getResults(uint256 index) public view returns (uint256[] memory) {
        return polls[index].voteCounts;
    }

    function getUserVote(uint256 index, address user)
        public
        view
        returns (bool, uint256)
    {
        Poll storage p = polls[index];
        if (p.hasVoted[user]) {
            return (true, p.votes[user]);
        }
        return (false, 0);
    }

    function vote(uint256 index, uint256 option) public {
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

    function deactivatePoll(uint256 _pollId) public {
        require(
            msg.sender == polls[_pollId].creator,
            "Only creator can deactivate"
        );
        polls[_pollId].active = false;
    }

    function deletePoll(uint256 _pollId) public {
        require(
            msg.sender == polls[_pollId].creator,
            "Only creator can delete"
        );
        polls[_pollId].deleted = true;
    }

    function resetAllPolls() public onlyOwner {
        delete polls;
    }

    function editOptions(uint256 index, string[] memory newOptions)
        public
        onlyOwner
    {
        require(newOptions.length >= 2, "At least 2 options required");
        Poll storage p = polls[index];
        p.options = newOptions;
        p.voteCounts = new uint256[](newOptions.length);
        p.totalVotes = 0;
    }

    function pollCount() public view returns (uint256) {
        return polls.length;
    }

    function hasVoted(uint256 pollId, address user) public view returns (bool) {
        return polls[pollId].hasVoted[user];
    }
}
