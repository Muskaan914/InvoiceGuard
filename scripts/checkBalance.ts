import { network } from "hardhat";
import { formatEther } from "viem";

const { viem } = await network.connect();

const [walletClient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const address = walletClient.account.address;

const balance = await publicClient.getBalance({
  address,
});

console.log("Deployer address:", address);
console.log("Sepolia ETH balance:", formatEther(balance));