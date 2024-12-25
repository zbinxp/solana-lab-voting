import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";

const IDL = require('../target/idl/voting.json');
const votingAddress = new PublicKey("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");
import { Voting } from '../target/types/voting';

describe('voting', () => {
  let context;
  let provider;
  let votingProgram:Program<Voting>;

  beforeAll(async() => {
    // 1. setup the test environment
    context = await startAnchor("",[{name:"voting", programId: votingAddress}],[]);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(
        IDL,
        provider
    );
  });
  
  it('Initialize Poll', async () => {
    
    //2. send transaction to initialize a poll
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1845019264),
      "what's your favorite color?",
    ).rpc();
    // 3. verify the poll
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("what's your favorite color?");
  });

  it("init candidates", async () => {
    await votingProgram.methods.intializeCandidate(
      "Blue",
      new BN(1),
    ).rpc();
    await votingProgram.methods.intializeCandidate(
      "Red",
      new BN(1),
    ).rpc();

    const [blueAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("Blue"),new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );
    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);
    expect(blueCandidate.candidateName).toEqual("Blue");

    const [redAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("Red"),new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );
    const redCandidate = await votingProgram.account.candidate.fetch(redAddress);
    expect(redCandidate.candidateName).toEqual("Red");

    // verify poll.candidate_count
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    expect(poll.candidateCount.toNumber()).toEqual(2);
  });

  it("vote", async () => {
    // vote for 'Blue'
    await votingProgram.methods.vote(
      "Blue",
      new BN(1),
    ).rpc();
    
    const [blueAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("Blue"),new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );
    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);
    expect(blueCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
