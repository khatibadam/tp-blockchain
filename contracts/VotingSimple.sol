// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VotingSimple {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    bool public votingOpen;
    Candidate[] public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;

    event VoterRegistered(address indexed voter);
    event VotingStarted();
    event VotingEnded();
    event Voted(address indexed voter, uint256 indexed candidateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Pas admin");
        _;
    }

    modifier onlyVoter() {
        require(registeredVoters[msg.sender], "Pas inscrit");
        _;
    }

    modifier votingIsOpen() {
        require(votingOpen, "Vote pas ouvert");
        _;
    }

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate(_candidateNames[i], 0));
        }
    }

    function addVoter(address _voter) external onlyOwner {
        require(!registeredVoters[_voter], "Deja inscrit");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function startVoting() external onlyOwner {
        require(!votingOpen, "Deja ouvert");
        votingOpen = true;
        emit VotingStarted();
    }

    function endVoting() external onlyOwner {
        require(votingOpen, "Deja ferme");
        votingOpen = false;
        emit VotingEnded();
    }

    function vote(uint256 _candidateId) external onlyVoter votingIsOpen {
        require(!hasVoted[msg.sender], "Deja vote");
        require(_candidateId < candidates.length, "Candidat invalide");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
        emit Voted(msg.sender, _candidateId);
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _id)
        external
        view
        returns (string memory name, uint256 voteCount)
    {
        require(_id < candidates.length, "Candidat invalide");
        return (candidates[_id].name, candidates[_id].voteCount);
    }

    function getWinner()
        external
        view
        returns (string memory name, uint256 voteCount)
    {
        require(candidates.length > 0, "Pas de candidats");
        uint256 winningCount = 0;
        uint256 winningIndex = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningCount) {
                winningCount = candidates[i].voteCount;
                winningIndex = i;
            }
        }
        return (candidates[winningIndex].name, candidates[winningIndex].voteCount);
    }
}