import { lookupArchive } from "@subsquid/archive-registry"
import {
  SubstrateEvmProcessor
} from "@subsquid/substrate-evm-processor"
import { CHAIN_NODE } from "./contract"
import * as mappings from './mappings'
import { multiTransferFilter, singleTransferFilter, transferFilter } from './mappings/utils/evm'
import { Contracts } from './processable'

const startBlockNumber = 1241477 
const processor = new SubstrateEvmProcessor("moonriver-substrate");

processor.setBatchSize(500);
processor.setDataSource({
  chain: CHAIN_NODE,
  archive: lookupArchive("moonriver")[0].url,
});
processor.setBlockRange({ from: startBlockNumber })
processor.setTypesBundle("moonbeam");

// processor.addEvmLogHandler(Contracts.Moonsama, transferFilter, mappings.saveERC721Transfers);
// processor.addEvmLogHandler(Contracts.Pondsama, transferFilter, mappings.saveERC721Transfers);
processor.addEvmLogHandler(Contracts.Plot, transferFilter, mappings.saveERC721Transfers);

// // processor.addEvmLogHandler(Contracts.Blvck, transferFilter, mappings.mainFrame); // TODO: handle separately

// processor.addEvmLogHandler(Contracts.Moonx, singleTransferFilter, mappings.saveERC1155SingleTransfers);
// processor.addEvmLogHandler(Contracts.Factory, singleTransferFilter, mappings.saveERC1155SingleTransfers);
// processor.addEvmLogHandler(Contracts.Art, singleTransferFilter, mappings.saveERC1155SingleTransfers);
// processor.addEvmLogHandler(Contracts.Box, singleTransferFilter, mappings.saveERC1155SingleTransfers);
// processor.addEvmLogHandler(Contracts.Embassy, singleTransferFilter, mappings.saveERC1155SingleTransfers);

// processor.addEvmLogHandler(Contracts.Moonx, multiTransferFilter, mappings.saveERC1155MultipleTransfers);
// processor.addEvmLogHandler(Contracts.Factory, multiTransferFilter, mappings.saveERC1155MultipleTransfers);
// processor.addEvmLogHandler(Contracts.Art, multiTransferFilter, mappings.saveERC1155MultipleTransfers);
// processor.addEvmLogHandler(Contracts.Box, multiTransferFilter, mappings.saveERC1155MultipleTransfers);
// processor.addEvmLogHandler(Contracts.Embassy, multiTransferFilter, mappings.saveERC1155MultipleTransfers);

processor.run();
