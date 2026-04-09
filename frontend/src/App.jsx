import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from './constants/contract';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isVoter, setIsVoter] = useState(false);
  const [voted, setVoted] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [voterInput, setVoterInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus('MetaMask non detecte');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        setStatus('Passer MetaMask sur le reseau Sepolia');
        return;
      }
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setAccount(addr);
      setContract(c);
      await loadData(c, addr);
    } catch (err) {
      setStatus('Connexion refusee');
    }
  }

  async function loadData(c, addr) {
    try {
      const ownerAddr = await c.owner();
      setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
      setIsVoter(await c.registeredVoters(addr));
      setVoted(await c.hasVoted(addr));
      setVotingOpen(await c.votingOpen());

      const count = await c.getCandidateCount();
      const list = [];
      for (let i = 0; i < count; i++) {
        const [name, votes] = await c.getCandidate(i);
        list.push({ id: i, name, votes: Number(votes) });
      }
      setCandidates(list);
    } catch (err) {
      setStatus('Erreur chargement donnees');
    }
  }

  async function handleAddVoter() {
    if (!voterInput) return;
    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.addVoter(voterInput);
      await tx.wait();
      setStatus('Electeur ajoute');
      setVoterInput('');
      await loadData(contract, account);
    } catch (err) {
      setStatus(err.reason || 'Erreur transaction');
    }
    setLoading(false);
  }

  async function handleStartVoting() {
    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.startVoting();
      await tx.wait();
      setStatus('Vote ouvert');
      await loadData(contract, account);
    } catch (err) {
      setStatus(err.reason || 'Erreur transaction');
    }
    setLoading(false);
  }

  async function handleEndVoting() {
    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.endVoting();
      await tx.wait();
      setStatus('Vote ferme');
      await loadData(contract, account);
    } catch (err) {
      setStatus(err.reason || 'Erreur transaction');
    }
    setLoading(false);
  }

  async function handleVote(candidateId) {
    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.vote(candidateId);
      await tx.wait();
      setStatus('Vote enregistre');
      await loadData(contract, account);
    } catch (err) {
      setStatus(err.reason || 'Erreur transaction');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!contract || !account) return;
    const refresh = () => loadData(contract, account);
    contract.on('Voted', refresh);
    contract.on('VoterRegistered', refresh);
    contract.on('VotingStarted', refresh);
    contract.on('VotingEnded', refresh);
    return () => contract.removeAllListeners();
  }, [contract, account]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  if (!account) {
    return (
      <div className="app">
        <h1>vote</h1>
        <button onClick={connectWallet}>Connecter le MetaMask</button>
        {status && <p className="msg">{status}</p>}
      </div>
    );
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="app">
      <h1>vote</h1>
      <p className="account">
        Connecte : {account.slice(0, 6)}...{account.slice(-4)}
      </p>
      <p className={votingOpen ? 'tag open' : 'tag closed'}>
        {votingOpen ? 'Vote ouvert' : 'Vote ferme'}
      </p>
      {isOwner && <span className="badge">ADMIN</span>}
      {isVoter && <span className="badge green">ELECTEUR</span>}

      {status && <p className="msg">{status}</p>}

      {isOwner && (
        <div className="panel">
          <h2>Administration</h2>
          <div className="row">
            <input
              type="text"
              placeholder="0x..."
              value={voterInput}
              onChange={e => setVoterInput(e.target.value)}
            />
            <button onClick={handleAddVoter} disabled={loading}>
              Ajouter electeur
            </button>
          </div>
          {!votingOpen && (
            <button onClick={handleStartVoting} disabled={loading}>
              Ouvrir le vote
            </button>
          )}
          {votingOpen && (
            <button onClick={handleEndVoting} disabled={loading}>
              Fermer le vote
            </button>
          )}
        </div>
      )}

      <div className="panel">
        <h2>Resultats</h2>
        {candidates.map(c => (
          <div key={c.id} className="candidate">
            <span className="cname">{c.name}</span>
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{
                  width: totalVotes > 0
                    ? `${(c.votes / totalVotes) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <span className="count">{c.votes}</span>
            {isVoter && votingOpen && !voted && (
              <button onClick={() => handleVote(c.id)} disabled={loading}>
                Voter
              </button>
            )}
          </div>
        ))}
      </div>

      {isVoter && voted && (
        <p className="done">Vous avez deja vote</p>
      )}
    </div>
  );
}

export default App;