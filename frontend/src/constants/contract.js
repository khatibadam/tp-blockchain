export const CONTRACT_ADDRESS = "0x0E54789f23bdc5fb7973a410a50992FedFd26825";

export const ABI = [
  "function owner() view returns (address)",
  "function votingOpen() view returns (bool)",
  "function registeredVoters(address) view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function getCandidateCount() view returns (uint256)",
  "function getCandidate(uint256) view returns (string, uint256)",
  "function getWinner() view returns (string, uint256)",
  "function addVoter(address)",
  "function startVoting()",
  "function endVoting()",
  "function vote(uint256)",
  "event VoterRegistered(address indexed voter)",
  "event VotingStarted()",
  "event VotingEnded()",
  "event Voted(address indexed voter, uint256 indexed candidateId)"
];