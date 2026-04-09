import { expect } from "chai";
import hre from "hardhat";

describe("VotingSimple", function () {

  async function deployVotingFixture() {
    const { ethers } = await hre.network.connect();
    const [owner, voter1, voter2, outsider] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("VotingSimple");
    const voting = await Voting.deploy(["Alice", "Bob", "Charlie"]);
    return { voting, owner, voter1, voter2, outsider };
  }

  describe("Deploiement", function () {
    it("Doit initialiser les candidats avec 0 vote et definir le owner", async function () {
      const { voting, owner } = await deployVotingFixture();
      expect(await voting.owner()).to.equal(owner.address);
      expect(await voting.getCandidateCount()).to.equal(3n);
      const [name0, votes0] = await voting.getCandidate(0n);
      expect(name0).to.equal("Alice");
      expect(votes0).to.equal(0n);
      const [name2, votes2] = await voting.getCandidate(2n);
      expect(name2).to.equal("Charlie");
      expect(votes2).to.equal(0n);
    });
  });

  describe("Gestion des electeurs", function () {
    it("L admin peut ajouter un electeur", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await expect(voting.addVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
      expect(await voting.registeredVoters(voter1.address)).to.be.true;
    });

    it("Un non-admin ne peut pas ajouter un electeur", async function () {
      const { voting, voter1, voter2 } = await deployVotingFixture();
      await expect(
        voting.connect(voter1).addVoter(voter2.address)
      ).to.be.revertedWith("Pas admin");
    });

    it("Impossible d ajouter deux fois le meme electeur", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await expect(
        voting.addVoter(voter1.address)
      ).to.be.revertedWith("Deja inscrit");
    });
  });

  describe("Ouverture du vote", function () {
    it("L admin peut ouvrir le vote", async function () {
      const { voting } = await deployVotingFixture();
      await expect(voting.startVoting())
        .to.emit(voting, "VotingStarted");
      expect(await voting.votingOpen()).to.be.true;
    });

    it("Un non-admin ne peut pas ouvrir le vote", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await expect(
        voting.connect(voter1).startVoting()
      ).to.be.revertedWith("Pas admin");
    });
  });

  describe("Vote", function () {
    it("Un electeur inscrit peut voter", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.startVoting();
      await expect(voting.connect(voter1).vote(0n))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 0n);
      const [, votes] = await voting.getCandidate(0n);
      expect(votes).to.equal(1n);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("Un electeur ne peut voter qu une seule fois", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.startVoting();
      await voting.connect(voter1).vote(0n);
      await expect(
        voting.connect(voter1).vote(1n)
      ).to.be.revertedWith("Deja vote");
    });

    it("Un non-electeur ne peut pas voter", async function () {
      const { voting, outsider } = await deployVotingFixture();
      await voting.startVoting();
      await expect(
        voting.connect(outsider).vote(0n)
      ).to.be.revertedWith("Pas inscrit");
    });

    it("Impossible de voter si le vote est ferme", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await expect(
        voting.connect(voter1).vote(0n)
      ).to.be.revertedWith("Vote pas ouvert");
    });

    it("Impossible de voter pour un candidat inexistant", async function () {
      const { voting, voter1 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.startVoting();
      await expect(
        voting.connect(voter1).vote(99n)
      ).to.be.revertedWith("Candidat invalide");
    });
  });

  describe("Resultats", function () {
    it("getWinner retourne le bon candidat", async function () {
      const { voting, voter1, voter2 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startVoting();
      await voting.connect(voter1).vote(1n);
      await voting.connect(voter2).vote(1n);
      const [name, votes] = await voting.getWinner();
      expect(name).to.equal("Bob");
      expect(votes).to.equal(2n);
    });

    it("En cas d egalite le premier candidat est retourne", async function () {
      const { voting, voter1, voter2 } = await deployVotingFixture();
      await voting.addVoter(voter1.address);
      await voting.addVoter(voter2.address);
      await voting.startVoting();
      await voting.connect(voter1).vote(0n);
      await voting.connect(voter2).vote(1n);
      const [name] = await voting.getWinner();
      expect(name).to.equal("Alice");
    });
  });
});