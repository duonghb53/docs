---
id: omnibridge-js
title: OmniBridge JS Example
sidebar_label: OmniBridge JS Example
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


The [OmniBridge JS SDK](https://github.com/Near-One/bridge-sdk-js/) currently provides a split interface for cross-chain transfers:

- `omniTransfer`: A unified interface for initiating transfers from any supported chain
- Chain-specific clients: Required for finalizing transfers on destination chains

:::info
Providing a single interface that handles the complete transfer lifecycle is planned in future versions. For now, you'll need to use both `omniTransfer` and chain-specific clients as shown below.
:::


## Transfer Lifecycle

A cross-chain transfer involves multiple steps across different chains:
1. Get Fee Estimation
2. Transfer Initiation
3. Status Monitoring
4. Transfer Finalization

### Get Fee Estimation

To get a gas fee estimate for the transfer, call the `getFee()` method:

```typescript
// Get fee estimate for transfer
const fee = await api.getFee(
  sender, // OmniAddress
  recipient, // OmniAddress
  tokenAddr // Token address
);

console.log(`Native fee: ${fee.native_token_fee}`);
console.log(`Token fee: ${fee.transferred_token_fee}`);
console.log(`USD fee: ${fee.usd_fee}`);
```

### Transfer Initiation

To start the transfer on the source chain, create a transfer message and use the `omniTransfer()` method:

```typescript
const transfer = {
  tokenAddress: omniAddress(ChainKind.Near, "origin.near"),
  amount: BigInt("1000"),
  fee: BigInt("0"),
  nativeFee: BigInt("1"),
  recipient: omniAddress(ChainKind.Eth, "0x123..."),
};

const result = await omniTransfer(wallet, transfer);
// Returns: { txId: string, nonce: bigint }
```

:::tip SDK types

#### Transfer Messages

Transfer messages represent cross-chain token transfers:

```typescript
interface OmniTransferMessage {
  tokenAddress: OmniAddress; // Source token address
  amount: bigint; // Amount to transfer
  fee: bigint; // Token fee
  nativeFee: bigint; // Gas fee in native token
  recipient: OmniAddress; // Destination address
}
```

#### Addresses

All addresses in the SDK use the `OmniAddress` format, which includes the chain prefix:

```typescript
type OmniAddress =
  | `eth:${string}` // Ethereum addresses
  | `near:${string}` // NEAR accounts
  | `sol:${string}` // Solana public keys
  | `arb:${string}` // Arbitrum addresses
  | `base:${string}`; // Base addresses

// Helper function to create addresses
const addr = omniAddress(ChainKind.Near, "account.near");
```

:::


<details>
<summary>Error Handling</summary>

To handle possible errors from a `omniTransfer()` call, you can do:

```typescript
try {
  const result = await omniTransfer(wallet, transfer);
} catch (error) {
  if (error.message.includes("Insufficient balance")) {
    // Handle insufficient funds
  } else if (error.message.includes("Invalid token")) {
    // Handle invalid token
  } else if (error.message.includes("Transfer failed")) {
    // Handle failed transfer
  } else if (error.message.includes("Signature verification failed")) {
    // Handle signature issues
  }
}
```
</details>

### Status Monitoring

Track the transfer status using `OmniBridgeAPI` and the `getTransferStatus()` method:

```typescript
const api = new OmniBridgeAPI("testnet");
const status = await api.getTransferStatus(chain, nonce);
// Status can be: "pending" | "ready_for_finalize" | "completed" | "failed"
```

:::info
The transfer status result can be:
- `pending`: transaction is pending
- `ready_for_finalize`: transaction is ready to be finalized
- `completed`: transaction is completed
- `failed`: transaction has failed
:::

### Transfer Finalization

When status is `ready_for_finalize`, use chain-specific clients to complete the transfer:

<Tabs groupId="finalize">
<TabItem value="evm" label="Ethereum">

To finalize an Ethereum/EVM transaction:

```typescript
// Finalize on Ethereum/EVM chains
const evmClient = getClient(ChainKind.Eth, ethWallet);
await evmClient.finalizeTransfer(transferMessage, signature);
```

</TabItem>
<TabItem value="near" label="NEAR">

To finalize a NEAR transaction:

```js
// Finalize on NEAR
const nearClient = getClient(ChainKind.Near, nearAccount);
await nearClient.finalizeTransfer(
  token,
  recipientAccount,
  storageDeposit,
  sourceChain,
  vaa // Optional Wormhole VAA
);
```

</TabItem>
<TabItem value="solana" label="Solana">
  
To finalize a Solana transaction:

```js
// Finalize on Solana
const solClient = getClient(ChainKind.Sol, provider);
await solClient.finalizeTransfer(transferMessage, signature);
```

</TabItem>
</Tabs>

## Example

Here's a complete example that initiates a transfer on NEAR and sends USDC to the Ethereum blockchain:

```typescript
import {
  omniTransfer,
  ChainKind,
  omniAddress,
  OmniBridgeAPI,
  getClient,
} from "omni-bridge-sdk";
import { connect } from "near-api-js";

// Setup NEAR account (source)
const near = await connect({
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
});
const account = await near.account("sender.near");

// Setup Ethereum wallet (destination)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const ethWallet = provider.getSigner();

// 1. Get fee estimate
const api = new OmniBridgeAPI("testnet");
const fee = await api.getFee(
  omniAddress(ChainKind.Near, account.accountId),
  omniAddress(ChainKind.Eth, await ethWallet.getAddress()),
  "usdc.near"
);

// 2. Create and initiate transfer
const transfer = {
  tokenAddress: omniAddress(ChainKind.Near, "usdc.near"),
  amount: BigInt("1000000"), // 1 USDC (6 decimals)
  fee: BigInt(fee.transferred_token_fee || 0),
  nativeFee: BigInt(fee.native_token_fee),
  recipient: omniAddress(ChainKind.Eth, await ethWallet.getAddress()),
};

// Initiate transfer on source chain
try {
  const result = await omniTransfer(wallet, transfer);
  console.log(`Transfer initiated with txId: ${result.txId}`);
} catch (error) {
  if (error.message.includes("Insufficient balance")) {
    // Handle insufficient funds
  } else if (error.message.includes("Invalid token")) {
    // Handle invalid token
  } else if (error.message.includes("Transfer failed")) {
    // Handle failed transfer
  } else if (error.message.includes("Signature verification failed")) {
    // Handle signature issues
  }
}

// 3. Monitor status
let status;
do {
  status = await api.getTransferStatus(ChainKind.Near, result.nonce);
  console.log(`Status: ${status}`);

  if (status === "ready_for_finalize") {
    // 4. Finalize transfer on destination chain
    const ethClient = getClient(ChainKind.Eth, ethWallet);
    await ethClient.finalizeTransfer(transferMessage, signature);
    break;
  }

  await new Promise((r) => setTimeout(r, 2000));
} while (status === "pending");
```

:::note

The [OmniBridge JS SDK](https://github.com/Near-One/bridge-sdk-js/) is in an early alpha development stage, and should be considered **highly unstable**. The API surface is subject to frequent and breaking changes without notice. Please check the [GitHub repository](https://github.com/Near-One/bridge-sdk-js/) for the latest information.

:::
