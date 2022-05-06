require('dotenv').config();
var terrajs = require("@terra-money/terra.js");
const { ValAddresses } = require('@terra-money/terra.proto/cosmos/staking/v1beta1/staking');
var fs = require("fs");
const DEFAULTRPC = "https://lcd.terra.dev";
const terra = new terrajs.LCDClient({
    URL: process.env.RPCURL || DEFAULTRPC,
    chainID: 'columbus-5',
});

console.log("RPC URL : " + process.env.RPCURL);
const SKIPCONTRACTS = process.env.SKIPCONTRACTS || false; //if true, NFTs held by contracts will not be included. (Marketplace settlement contracts, Multi-Sig wallets, etc)
const SNAPFOLDER = process.env.SNAPSHOTFOLDER || "snapshots";
const numTokens = process.env.NUMTOKENS || null;
const nftContract = process.env.NFTCONTRACT || null;

if (!numTokens || !nftContract){
    console.log("Missing token count or contract address. Please set the environment variables.");
    process.exit(0);
}

var waitDelay = 0; //If using the default public RPC, a wait delay is attached to avoid rate limits. 
if (terra.config.URL == DEFAULTRPC) {
    console.log("Using public RPC, rate limit added.");
    waitDelay = 100;
}


const d = new Date();
var snapshotTime = d.toLocaleDateString() + `-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;

const snapshotFile = "./snapshots/snapshot-" + snapshotTime + ".json";
console.log("Saving To: " + snapshotFile);
var snapshot = { contract: nftContract, startTime: null, endTime: null, startBlock: null, endBlock: null, unique: null, holders: [] };
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
var contractAddresses = [];

async function checkIfContract(address) {
    var foundAddress = contractAddresses.find(x => x.address == address);
    if (foundAddress) {
        return foundAddress.isContract;
    }
    try {
        var contractInfo = await terra.wasm.contractInfo(address);
        contractAddresses.push({ address: address, isContract: true });
        return true;
    } catch (err) {
        contractAddresses.push({ address: address, isContract: false });
        return false;
    }
}

async function main() {
    if (!fs.existsSync(SNAPFOLDER)) {
        fs.mkdirSync(SNAPFOLDER);
    }

    var uniqueHolders = [];
    console.log("Snapshot Started...");
    var blockInfo = await terra.tendermint.blockInfo();
    snapshot.startTime = blockInfo.block.header.time;
    snapshot.startBlock = blockInfo.block.header.height;

    for (var i = 1; i <= numTokens; i++) {
        var tokenID = i;
        var resp = await terra.wasm.contractQuery(nftContract, { owner_of: { token_id: tokenID.toString() } });
        var owner = resp.owner;
        if (SKIPCONTRACTS) {
            if (await checkIfContract(owner)) {
                console.log(tokenID + " - Skipping contract: " + owner);
                continue;
            }
        }
        var token = {
            id: tokenID,
            owner: owner
        }
        snapshot.holders.push(token);
        if (!uniqueHolders.includes(owner)) {
            uniqueHolders.push(owner);
        }
        console.log(tokenID + " - Owner: " + owner);
        await sleep(waitDelay);
    }
    blockInfo = await terra.tendermint.blockInfo();
    snapshot.endTime = blockInfo.block.header.time;
    snapshot.endBlock = blockInfo.block.header.height;
    snapshot.unique = uniqueHolders.length;
    console.log("Unique Holders: " + uniqueHolders.length);
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot));
    console.log("Snapshot Complete. Written to: " + snapshotFile);

    var csv = "";
    for (var i = 0; i < uniqueHolders.length; i++) {
        csv += uniqueHolders[i] + "\n";
    }
    fs.writeFileSync("./snapshots/snapshot-" + snapshotTime + "-Unique.csv", csv);
}
main();