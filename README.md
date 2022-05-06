
# Terra NFT Snapshot

  

A simple tool to snapshot the holders of a Terra NFT collection.

  

## What It Does

  

This tool will query each token ID individually in order to determine the current holder. An output file will be written containing every ID checked, as well as a seperate spreadsheet containing the unique holders.

  

## Setup

Copy the .env.sample file to .env.

Set the required variables:

**SKIPCONTRACTS**: true/false
	-true will skip any contracts holding the nft. This includes marketplace settlement contracts, multi-sigs, etc.
	
**RPCURL**: Terra RPC url for querying the chain. The default dev one of https://lcd.terra.dev is included, however it will apply a 100ms delay between queries. 

**SNAPSHOTFOLDER**: Folder of where the snapshots will be written. Defaults to ./snapshots

**NFTCONTRACT**: Contract address to query. Defaults to the Anarchists NFT contract

**NUMTOKENS**: Total number of tokens in the collection / number to query. As the Anarchists contract has 2500 NFTs, the default here is also 2500.
  
Run it:
```
npm install

node snapshot.js
```

  

## Limitations
Currently this requires NFT contracts that have sequential IDs. Some contracts use randomized IDs and this snapshot tool will not support it.

If there is demand, I can update this to have an option to first query all the available IDs before cycling through them to pull the owners.