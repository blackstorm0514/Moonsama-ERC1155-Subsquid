import { assertNotNull, Store } from "@subsquid/substrate-evm-processor"
import { Contract, ethers } from "ethers"
import * as erc721 from "./abi/erc721"
import * as erc1155 from "./abi/erc1155"
// import { CollectionEntity, CollectionType } from "./model"
// import { Contracts, ContractsMap } from "./processable"
import { contractHasGraph, tokenUriOf as tokenMetaOf } from './mappings/utils/graph'
 
export const CHAIN_NODE = "wss://public-rpc.pinknode.io/moonriver"
export const HTTP_NODE = "https://moonriver.api.onfinality.io/public"

export const provider = new ethers.providers.StaticJsonRpcProvider(HTTP_NODE, {
  chainId: 1285,
  name: 'moonriver'
})

export async function getTokenURI(contract: ethers.Contract, tokenId: string): Promise<string> {
  return retry(async () => timeout(contract.tokenURI(tokenId)));
}

async function timeout<T>(res: Promise<T>, seconds = 200): Promise<T> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout|undefined = setTimeout(() => {
      timer = undefined;
      reject(new Error(`Request timed out in ${seconds} seconds`));
    }, seconds * 1000);

    res
      .finally(() => {
        if (timer != null) {
          clearTimeout(timer);
        }
      })
      .then(resolve, reject);
  });
}

async function retry<T>(promiseFn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i+=1) {
    try {
      return await promiseFn();
    } catch (err) {
      console.log(err);
    }
  }
  throw new Error(`Error after ${attempts} attempts`);
}
