import { network } from "hardhat";

const { viem } = await network.connect();

const invoice = await viem.getContractAt(
  "InvoiceVerification",
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
);

await invoice.write.markAsPaid([1n]);

console.log("Invoice marked as paid!");

const data = await invoice.read.getInvoice([1n]);

console.log("Invoice status:", data.status);