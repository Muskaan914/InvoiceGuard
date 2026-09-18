
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const InvoiceModule = buildModule("InvoiceModule", (m) => {
  const invoice = m.contract("InvoiceVerification");

  return { invoice };
});

export default InvoiceModule;