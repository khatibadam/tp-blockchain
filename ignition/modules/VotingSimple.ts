import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VotingSimpleModule = buildModule("VotingSimpleModule", (m) => {
  const voting = m.contract("VotingSimple", [["Alice", "Bob", "Charlie"]]);
  return { voting };
});

export default VotingSimpleModule;