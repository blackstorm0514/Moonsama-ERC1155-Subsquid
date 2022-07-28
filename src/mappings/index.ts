import { get } from "./utils/entity";
import {
  decode1155MultiTransfer,
  decode1155SingleTransfer,
  decode721Transfer,
} from "./utils/evm";
import { attributeFrom, Context } from "./utils/types";
import { bigintOf, contractOf } from "./utils/extract";
import { ethers } from "ethers";
import {
  ERC1155Token,
  ERC1155Owner,
  ERC1155Contract,
  ERC1155Transfer,
  ERC1155TokenOwner,
  Metadata,
  Attribute,
  ERC721Owner,
  ERC721Token,
  ERC721Transfer,
  ERC721Contract,
} from "../model";
import {
  provider,
  getTokenURI,
  getURI,
  getERC1155TotalSupply,
} from "../contract";
import * as erc1155 from "../abi/erc1155";
import * as erc721 from "../abi/erc721";
import { sanitizeIpfsUrl, api } from "./utils/metadata";

export async function saveERC721Transfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  let timestamp = BigInt(context.substrate.block.timestamp.toString());
  timestamp /= BigInt(1000);
  const txHash = context.txHash;
  const { from, to, tokenId } = decode721Transfer(context);
  const contractAddress = contractOf(context);
  const tokenIdString = tokenId.toString();
  const indexInBlock = context.substrate.event.indexInBlock;
  let transferId = txHash.concat("-".concat(indexInBlock.toString()));
  let metadatId = contractAddress + "-" + tokenIdString;
  const contract = new ethers.Contract(contractAddress, erc721.abi, provider);
  let name = await contract.name();
  let symbol = await contract.symbol();
  let totalSupply = await contract.totalSupply();
  let contractURI = await contract.contractURI();

  let previousOwner = await get(context.store, ERC721Owner, from);
  if (previousOwner == null) {
    previousOwner = new ERC721Owner({ id: from.toLowerCase(), balance: 0n });
  }

  let currentOwner = await get(context.store, ERC721Owner, to);
  if (currentOwner == null) {
    currentOwner = new ERC721Owner({ id: to.toLowerCase(), balance: 0n });
  }

  if (
    previousOwner.balance != null &&
    previousOwner.balance > BigInt(0) &&
    previousOwner.id != "0x0000000000000000000000000000000000000000"
  ) {
    previousOwner.balance = previousOwner.balance - BigInt(1);
  }

  if (currentOwner.balance != null) {
    currentOwner.balance = currentOwner.balance + BigInt(1);
  }

  let contractData = await get(context.store, ERC721Contract, contractAddress);
  if (contractData == null) {
    contractData = new ERC721Contract({
      id: contractAddress,
      address: contractAddress,
      name: name,
      symbol: symbol,
      totalSupply: totalSupply,
      decimals: 0,
      contractURI: contractURI,
      contractURIUpdated: timestamp,
    });
  } else {
    contractData.name = name;
    contractData.symbol = symbol;
    contractData.totalSupply = totalSupply;
    contractData.contractURI = contractURI;
    contractData.contractURIUpdated = timestamp;
  }

  let tokenURI: string = await getTokenURI(contract, tokenIdString);
  let metadata = await get(context.store, Metadata, metadatId);
  if (metadata == null) {
    const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
    metadata = new Metadata({
      id: metadatId,
      description: data.description || "",
      name: data.name || contractData.name,
      image: data.image,
      animationUrl: data.animation_url,
      attributes: data.attributes?.map(attributeFrom) || [],
    });
  }

  let token = await get(
    context.store,
    ERC721Token,
    metadatId
  );
  if (token == null) {
    token = new ERC721Token({
      id: metadatId,
      numericId: BigInt(tokenIdString),
      uri: tokenURI,
      meta: metadata,
      contract: contractData,
    });
  }
  token.owner = currentOwner;

  let transfer = await get(context.store, ERC721Transfer, transferId);
  if (transfer == null) {
    transfer = new ERC721Transfer({
      id: transferId,
      block: BigInt(blockNumber),
      timestamp: timestamp,
      transactionHash: txHash,
      from: previousOwner,
      to: currentOwner,
      token,
    });
  }

  await context.store.save(previousOwner);
  await context.store.save(currentOwner);
  await context.store.save(contractData);
  await context.store.save(metadata);
  await context.store.save(token);
  await context.store.save(transfer);
  console.log("ERC721Transfer", transfer)
}

export async function saveERC1155SingleTransfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  let timestamp = BigInt(context.substrate.block.timestamp.toString());
  timestamp /= BigInt(1000);
  const txHash = context.txHash;
  const { from, to, id, value } = decode1155SingleTransfer(context);
  let amount = value;
  let tokenId = id;
  let tokenIdString = tokenId.toString();
  const contractAddress = contractOf(context);
  const indexInBlock = context.substrate.event.indexInBlock;
  let transferId = txHash.concat('-'.concat(tokenIdString)).concat('-'.concat(indexInBlock.toString()));
  let metadatId = contractAddress + "-" + tokenIdString;
  const contract = new ethers.Contract(contractAddress, erc1155.abi, provider);
  let name = await contract.name();
  let symbol = await contract.symbol();
  let contractURI = await contract.contractURI();

  let previousOwner = await get(context.store, ERC1155Owner, from);
  if (previousOwner == null) {
    previousOwner = new ERC1155Owner({ id: from.toLowerCase() });
  }

  let currentOwner = await get(context.store, ERC1155Owner, to);
  if (currentOwner == null) {
    currentOwner = new ERC1155Owner({ id: to.toLowerCase() });
  }

  let contractData = await get(context.store, ERC1155Contract, contractAddress);
  if (contractData == null) {
    contractData = new ERC1155Contract({
      id: contractAddress,
      address: contractAddress,
      name: name,
      symbol: symbol,
      totalSupply: BigInt(0),
      decimals: 0,
      contractURI: contractURI,
      contractURIUpdated: timestamp,
    });
  } else {
    let contractTotalSupply = BigInt(tokenIdString) > contractData.totalSupply ? BigInt(tokenIdString) : contractData.totalSupply
    contractData.name = name;
    contractData.symbol = symbol;
    contractData.totalSupply = contractTotalSupply;
    contractData.contractURI = contractURI;
    contractData.contractURIUpdated = timestamp;
  }

  let tokenURI: string = await getURI(contract, tokenIdString);
  let metadata = await get(context.store, Metadata, metadatId);
  if (metadata == null) {
    const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
    metadata = new Metadata({
      id: metadatId,
      description: data.description || "",
      name: data.name || contractData.name,
      image: data.image,
      animationUrl: data.animation_url,
      attributes: data.attributes?.map(attributeFrom) || [],
    });
  }

  let token = await get(
    context.store,
    ERC1155Token,
    metadatId
  );
  if (token == null) {
    token = new ERC1155Token({
      id: metadatId,
      numericId: BigInt(tokenIdString),
      uri: tokenURI,
      meta: metadata,
      contract: contractData,
    });
  }

  let totalSupply = await getERC1155TotalSupply(contract, tokenIdString);
  token.totalSupply = bigintOf(totalSupply);

  let senderTokenOwnerId = from.concat("-").concat(tokenIdString);
  let senderTokenOwner = await get(
    context.store,
    ERC1155TokenOwner,
    senderTokenOwnerId
  );
  if (senderTokenOwner == null) {
    senderTokenOwner = new ERC1155TokenOwner({
      id: senderTokenOwnerId,
      balance: 0n,
    });
  }
  senderTokenOwner.owner = previousOwner;
  senderTokenOwner.token = token;

  // if we mint tokens, we don't mark it
  // total minted ever can be caluclated by totalSupply + burned amount
  if (previousOwner.id != "0x0000000000000000000000000000000000000000") {
    senderTokenOwner.balance = senderTokenOwner.balance - bigintOf(amount);
  }

  let recipientTokenOwnerId = to.concat("-").concat(tokenIdString);
  let recipientTokenOwner = await get(
    context.store,
    ERC1155TokenOwner,
    recipientTokenOwnerId
  );
  if (recipientTokenOwner == null) {
    recipientTokenOwner = new ERC1155TokenOwner({
      id: recipientTokenOwnerId,
      balance: 0n,
    });
  }

  recipientTokenOwner.owner = currentOwner;
  recipientTokenOwner.token = token;

  // in case of 0x0000000000000000000000000000000000000000 it's the burned amount
  recipientTokenOwner.balance = recipientTokenOwner.balance + bigintOf(amount);

  let transfer = await get(context.store, ERC1155Transfer, transferId);
  if (transfer == null) {
    transfer = new ERC1155Transfer({
      id: transferId,
      block: BigInt(blockNumber),
      timestamp: timestamp,
      transactionHash: txHash,
      from: previousOwner,
      to: currentOwner,
      token,
    });
  }

  await context.store.save(previousOwner);
  await context.store.save(currentOwner);
  await context.store.save(contractData);
  await context.store.save(metadata);
  await context.store.save(token);
  await context.store.save(transfer);
  await context.store.save(senderTokenOwner);
  await context.store.save(recipientTokenOwner);
  console.log("transfer1", contractData);
}

export async function saveERC1155MultipleTransfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  let timestamp = BigInt(context.substrate.block.timestamp.toString());
  timestamp /= BigInt(1000);
  const txHash = context.txHash;
  const { from, to, ids, values } = decode1155MultiTransfer(context);
  let amounts = values;
  let tokenIds = ids;
  const contractAddress = contractOf(context);
  const indexInBlock = context.substrate.event.indexInBlock;

  let previousOwner = await get(context.store, ERC1155Owner, from);
  let currentOwner = await get(context.store, ERC1155Owner, to);

  const contract = new ethers.Contract(contractAddress, erc1155.abi, provider);
  let name = await contract.name();
  let symbol = await contract.symbol();
  let contractURI = await contract.contractURI();

  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i];
    let tokenIdString = tokenId.toString();
    let amount = amounts[i];

    if (previousOwner == null) {
      previousOwner = new ERC1155Owner({ id: from.toLowerCase() });
    }
    if (currentOwner == null) {
      currentOwner = new ERC1155Owner({ id: to.toLowerCase() });
    }

    let contractData = await get(
      context.store,
      ERC1155Contract,
      contractAddress
    );
    if (contractData == null) {
      contractData = new ERC1155Contract({
        id: contractAddress,
        address: contractAddress,
        name: name,
        symbol: symbol,
        totalSupply: BigInt(1),
        decimals: 0,
        contractURI: contractURI,
        contractURIUpdated: timestamp,
      });
    } else {
      let contractTotalSupply = BigInt(tokenIdString) > contractData.totalSupply ? BigInt(tokenIdString) : contractData.totalSupply
      contractData.name = name;
      contractData.symbol = symbol;
      contractData.totalSupply = contractTotalSupply;
      contractData.contractURI = contractURI;
      contractData.contractURIUpdated = timestamp;
    }
  

    let metadatId = contractAddress + "-" + tokenIdString;
    let tokenURI: string = await getURI(contract, tokenIdString);
    let metadata = await get(context.store, Metadata, metadatId);
    if (metadata == null) {
      const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
      metadata = new Metadata({
        id: metadatId,
        description: data.description || "",
        name: data.name || contractData.name,
        image: data.image,
        animationUrl: data.animation_url,
        attributes: data.attributes?.map(attributeFrom) || [],
      });
    }

    let token = await get(
      context.store,
      ERC1155Token,
      metadatId
    );
    if (token == null) {
      token = new ERC1155Token({
        id: metadatId,
        numericId: BigInt(tokenIdString),
        uri: tokenURI,
        meta: metadata,
        contract: contractData,
      });
    }
    let totalSupply = await getERC1155TotalSupply(contract, tokenIdString);
    token.totalSupply = bigintOf(totalSupply);

    let transferId = txHash.concat('-'.concat(tokenIdString)).concat('-'.concat(indexInBlock.toString()));
    let transfer = await get(context.store, ERC1155Transfer, transferId);
    if (transfer == null) {
      transfer = new ERC1155Transfer({
        id: transferId,
        block: BigInt(blockNumber),
        timestamp: timestamp,
        transactionHash: txHash,
        from: previousOwner,
        to: currentOwner,
        token,
      });
    }

    let senderTokenOwnerId = from.concat("-").concat(tokenIdString);
    let senderTokenOwner = await get(
      context.store,
      ERC1155TokenOwner,
      senderTokenOwnerId
    );
    if (senderTokenOwner == null) {
      senderTokenOwner = new ERC1155TokenOwner({
        id: senderTokenOwnerId,
        balance: 0n,
      });
    }
    senderTokenOwner.owner = previousOwner;
    senderTokenOwner.token = token;
    // if we mint tokens, we don't mark it
    // total minted ever can be caluclated by totalSupply + burned amount
    if (previousOwner.id != "0x0000000000000000000000000000000000000000") {
      senderTokenOwner.balance = senderTokenOwner.balance - bigintOf(amount);
    }

    let recipientTokenOwnerId = to.concat("-").concat(tokenIdString);
    let recipientTokenOwner = await get(
      context.store,
      ERC1155TokenOwner,
      recipientTokenOwnerId
    );
    if (recipientTokenOwner == null) {
      recipientTokenOwner = new ERC1155TokenOwner({
        id: recipientTokenOwnerId,
        balance: 0n,
      });
    }

    recipientTokenOwner.owner = currentOwner;
    recipientTokenOwner.token = token;

    // in case of 0x0000000000000000000000000000000000000000 it's the burned amount
    recipientTokenOwner.balance =
      recipientTokenOwner.balance + bigintOf(amount);

    await context.store.save(previousOwner);
    await context.store.save(currentOwner);
    await context.store.save(contractData);
    await context.store.save(metadata);
    await context.store.save(token);
    await context.store.save(transfer);
    await context.store.save(senderTokenOwner);
    await context.store.save(recipientTokenOwner);
    console.log("transfer2", contractData);
  }
}