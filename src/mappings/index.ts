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
import { provider, getTokenURI } from "../contract";
import * as erc1155 from "../abi/erc1155";
import * as erc721 from "../abi/erc721";
import { sanitizeIpfsUrl, api } from "./utils/metadata";

export async function saveTransfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  const timestamp = context.substrate.block.timestamp.toString();
  const txHash = context.txHash;
  const { from, to, tokenId } = decode721Transfer(context);
  const contractAddress = contractOf(context);
  const eventId = context.substrate.event.id;

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
  const contract = new ethers.Contract(contractAddress, erc721.abi, provider);
  let name = await contract.name();
  let symbol = await contract.symbol();
  let totalSupply = await contract.totalSupply();
  let contractURI = await contract.contractURI();
  if (contractData == null) {
    contractData = new ERC721Contract({
      id: contractAddress,
      address: contractAddress,
      name: name,
      symbol: symbol,
      totalSupply: totalSupply,
      decimals: 0,
      contractURI: contractURI,
      contractURIUpdated: BigInt(timestamp),
    });
  }
  else{
    contractData.name = name
    contractData.symbol = symbol
    contractData.totalSupply = totalSupply
    contractData.contractURI = contractURI
    contractData.contractURIUpdated = BigInt(timestamp)
  }

  let tokenURI: string = await getTokenURI(contract, tokenId.toString());

  let metadata = await get(context.store, Metadata, tokenId.toString());
  if (metadata == null) {
    const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
    metadata = new Metadata({
      id: tokenId.toHexString(),
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
    contractAddress + ":" + tokenId.toString()
  );
  if (token == null) {
    token = new ERC721Token({
      id: contractAddress + ":" + tokenId.toString(),
      numericId: BigInt(tokenId.toString()),
      uri: tokenURI,
      meta: metadata,
      contract: contractData,
    });
  }
  token.owner = currentOwner;

  const transfer = new ERC721Transfer({
    id: eventId,
    block: BigInt(blockNumber),
    timestamp: BigInt(timestamp),
    transactionHash: txHash,
    from: previousOwner,
    to: currentOwner,
    token,
  });

  await context.store.save(previousOwner);
  await context.store.save(currentOwner);
  await context.store.save(contractData);
  await context.store.save(metadata);
  await context.store.save(token);
  await context.store.save(transfer);
}

export async function saveSingleTransfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  const timestamp = context.substrate.block.timestamp.toString();
  const txHash = context.txHash;
  const { operator, from, to, id, value } = decode1155SingleTransfer(context);
  let amount = value;
  let tokenId = id;
  let tokenIdString = tokenId.toString();
  const contractAddress = contractOf(context);
  const eventId = context.substrate.event.id;

  let previousOwner = await get(context.store, ERC1155Owner, from);
  if (previousOwner == null) {
    previousOwner = new ERC1155Owner({ id: from.toLowerCase() });
  }

  let currentOwner = await get(context.store, ERC1155Owner, to);
  if (currentOwner == null) {
    currentOwner = new ERC1155Owner({ id: to.toLowerCase() });
  }

  let contractData = await get(context.store, ERC1155Contract, contractAddress);
  const contract = new ethers.Contract(contractAddress, erc1155.abi, provider);
  if (contractData == null) {
    let name = await contract.name();
    let symbol = await contract.symbol();
    contractData = new ERC1155Contract({
      id: contractAddress,
      name: name,
      symbol: symbol,
    });
  }

  let tokenURI: string = await getTokenURI(contract, tokenIdString);

  let metadata = await get(context.store, Metadata, tokenIdString);
  if (metadata == null) {
    const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
    metadata = new Metadata({
      id: tokenId.toHexString(),
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
    contractAddress + ":" + tokenIdString
  );
  if (token == null) {
    token = new ERC1155Token({
      id: contractAddress + ":" + tokenIdString,
      numericId: BigInt(tokenIdString),
      uri: tokenURI,
      meta: metadata,
      contract: contractData,
    });
  }

  let totalSupply = await contract.totalSupply(tokenId);
  token.totalSupply = totalSupply;

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

  let transfer = await get(context.store, ERC1155Transfer, eventId);
  if (transfer == null) {
    transfer = new ERC1155Transfer({
      id: eventId,
      block: BigInt(blockNumber),
      timestamp: BigInt(timestamp),
      transactionHash: txHash,
      from: previousOwner,
      to: currentOwner,
      token,
    });
  }

  await context.store.save(previousOwner);
  await context.store.save(currentOwner);
  await context.store.save(senderTokenOwner);
  await context.store.save(recipientTokenOwner);
  await context.store.save(contractData);
  await context.store.save(metadata);
  await context.store.save(token);
  await context.store.save(transfer);
}

export async function saveMultipleTransfers(context: Context): Promise<void> {
  const blockNumber = context.substrate.block.height.toString();
  const timestamp = context.substrate.block.timestamp.toString();
  const txHash = context.txHash;
  const { operator, from, to, ids, values } = decode1155MultiTransfer(context);
  let amounts = values;
  let tokenIds = ids;
  const contractAddress = contractOf(context);
  const eventId = context.substrate.event.id;

  let previousOwner = await get(context.store, ERC1155Owner, from);
  let currentOwner = await get(context.store, ERC1155Owner, to);

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

    let contractData = await get(context.store, ERC1155Contract, contractAddress);
    const contract = new ethers.Contract(
      contractAddress,
      erc1155.abi,
      provider
    );
    let name = await contract.name();
    let symbol = await contract.symbol();
    if (contractData == null) {
      contractData = new ERC1155Contract({
        id: contractAddress,
        name: name,
        symbol: symbol,
      });
    }

    let tokenURI: string = await getTokenURI(contract, tokenIdString);

    let metadata = await get(context.store, Metadata, tokenIdString);
    if (metadata == null) {
      const { status, data } = await api.get(sanitizeIpfsUrl(tokenURI));
      metadata = new Metadata({
        id: tokenId.toHexString(),
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
      contractAddress + ":" + tokenIdString
    );
    if (token == null) {
      token = new ERC1155Token({
        id: contractAddress + ":" + tokenIdString,
        numericId: BigInt(tokenIdString),
        uri: tokenURI,
        meta: metadata,
        contract: contractData,
      });
    }

    let totalSupply = await contract.totalSupply(tokenId);
    token.totalSupply = totalSupply;

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

    let transfer = await get(context.store, ERC1155Transfer, eventId);
    if (transfer == null) {
      transfer = new ERC1155Transfer({
        id: eventId,
        block: BigInt(blockNumber),
        timestamp: BigInt(timestamp),
        transactionHash: txHash,
        from: previousOwner,
        to: currentOwner,
        token,
      });
    }

    await context.store.save(previousOwner);
    await context.store.save(currentOwner);
    await context.store.save(senderTokenOwner);
    await context.store.save(recipientTokenOwner);
    await context.store.save(contractData);
    await context.store.save(metadata);
    await context.store.save(token);
    await context.store.save(transfer);
  }
}

export async function mainFrame(ctx: Context): Promise<void> {
  const transfer = decode721Transfer(ctx);
  await saveTransfers(ctx);
}

export async function singleMainFrame(ctx: Context): Promise<void> {
  const transfer = decode1155SingleTransfer(ctx);
  await saveSingleTransfers(ctx);
}

export async function mutliMainFrame(ctx: Context): Promise<void> {
  const transfer = decode1155MultiTransfer(ctx);
  await saveMultipleTransfers(ctx);
}
