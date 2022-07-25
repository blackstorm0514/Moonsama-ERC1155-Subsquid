import { create, get, getOrCreate } from "./utils/entity";
import {
  decode1155MultiTransfer,
  decode1155SingleTransfer,
  RealTransferEvent,
} from "./utils/evm";
import logger, { logError, transferDebug } from "./utils/logger";
import { attributeFrom, Context } from "./utils/types";
import { bigintOf, contractOf } from "./utils/extract";
import { ethers } from "ethers";
import {
  Token,
  Owner,
  Contract,
  Transfer,
  TokenOwner,
  Metadata,
  Attribute,
} from "../model";
import { provider, getTokenURI } from "../contract";
import * as erc1155 from "../abi/erc1155";
import { sanitizeIpfsUrl, api } from "./utils/metadata";

// async function handleMetadata(
//   id: string,
//   store: Store
// ): Promise<Optional<Metadata>> {
//   const meta = await get<Metadata>(store, Metadata, id)
//   if (meta) {
//     return meta
//   }

//   const metadata = await fetchMetadata<TokenMetadata>({ metadata: id })
//   if (isEmpty(metadata)) {
//     return null
//   }

//   const partial: Partial<Metadata> = {
//     id,
//     description: metadata.description || '',
//     image: metadata.image,
//     animationUrl: metadata.animation_url,
//     attributes: metadata.attributes?.map(attributeFrom) || [],
//     name: metadata.name || '',
//   }

//   const final = create<Metadata>(Metadata, id, partial)
//   await store.save(final)
//   return final
// }

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

  let previousOwner = await get(context.store, Owner, from);
  if (previousOwner == null) {
    previousOwner = new Owner({ id: from.toLowerCase() });
  }

  let currentOwner = await get(context.store, Owner, to);
  if (currentOwner == null) {
    currentOwner = new Owner({ id: to.toLowerCase() });
  }

  let contractData = await get(context.store, Contract, contractAddress);
  const contract = new ethers.Contract(contractAddress, erc1155.abi, provider);
  if (contractData == null) {
    let name = await contract.name();
    let symbol = await contract.symbol();
    contractData = new Contract({
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
    Token,
    contractAddress + ":" + tokenIdString
  );
  if (token == null) {
    token = new Token({
      id: contractAddress + ":" + tokenIdString,
      numericId: BigInt(tokenIdString),
      uri: tokenURI,
      meta: metadata,
      contract: contractData,
    });
  }

  let senderTokenOwnerId = from.concat("-").concat(tokenIdString);
  let senderTokenOwner = await get(
    context.store,
    TokenOwner,
    senderTokenOwnerId
  );
  if (senderTokenOwner == null) {
    senderTokenOwner = new TokenOwner({
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
    TokenOwner,
    recipientTokenOwnerId
  );
  if (recipientTokenOwner == null) {
    recipientTokenOwner = new TokenOwner({
      id: recipientTokenOwnerId,
      balance: 0n,
    });
  }

  recipientTokenOwner.owner = currentOwner;
  recipientTokenOwner.token = token;

  // in case of 0x0000000000000000000000000000000000000000 it's the burned amount
  recipientTokenOwner.balance = recipientTokenOwner.balance + bigintOf(amount);

  let transfer = await get(context.store, Transfer, eventId);
  if (transfer == null) {
    transfer = new Transfer({
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

  let previousOwner = await get(context.store, Owner, from);
  let currentOwner = await get(context.store, Owner, to);

  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i];
    let tokenIdString = tokenId.toString();
    let amount = amounts[i];

    if (previousOwner == null) {
      previousOwner = new Owner({ id: from.toLowerCase() });
    }
    if (currentOwner == null) {
      currentOwner = new Owner({ id: to.toLowerCase() });
    }

    let contractData = await get(context.store, Contract, contractAddress);
    const contract = new ethers.Contract(
      contractAddress,
      erc1155.abi,
      provider
    );
    if (contractData == null) {
      let name = await contract.name();
      let symbol = await contract.symbol();
      contractData = new Contract({
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
      Token,
      contractAddress + ":" + tokenIdString
    );
    if (token == null) {
      token = new Token({
        id: contractAddress + ":" + tokenIdString,
        numericId: BigInt(tokenIdString),
        uri: tokenURI,
        meta: metadata,
        contract: contractData,
      });
    }

    let senderTokenOwnerId = from.concat("-").concat(tokenIdString);
    let senderTokenOwner = await get(
      context.store,
      TokenOwner,
      senderTokenOwnerId
    );
    if (senderTokenOwner == null) {
      senderTokenOwner = new TokenOwner({
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
      TokenOwner,
      recipientTokenOwnerId
    );
    if (recipientTokenOwner == null) {
      recipientTokenOwner = new TokenOwner({
        id: recipientTokenOwnerId,
        balance: 0n,
      });
    }

    recipientTokenOwner.owner = currentOwner;
    recipientTokenOwner.token = token;

    // in case of 0x0000000000000000000000000000000000000000 it's the burned amount
    recipientTokenOwner.balance =
      recipientTokenOwner.balance + bigintOf(amount);

    let transfer = await get(context.store, Transfer, eventId);
    if (transfer == null) {
      transfer = new Transfer({
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

export async function singleMainFrame(ctx: Context): Promise<void> {
  const transfer = decode1155SingleTransfer(ctx);
  await saveSingleTransfers(ctx);
}

export async function mutliMainFrame(ctx: Context): Promise<void> {
  const transfer = decode1155MultiTransfer(ctx);
  await saveMultipleTransfers(ctx);
}
