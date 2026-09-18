
export const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Keep your FULL deployed address here

export const contractABI = [
  {
    inputs: [],
    name: "invoiceCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_invoiceNumber", type: "string" },
      { internalType: "string", name: "_supplierName", type: "string" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "bytes32", name: "_invoiceHash", type: "bytes32" },
    ],
    name: "createInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "getInvoice",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "invoiceNumber", type: "string" },
          { name: "supplierName", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "invoiceHash", type: "bytes32" },
          { name: "status", type: "uint8" },
          { name: "createdBy", type: "address" },
        ],
        internalType: "struct InvoiceVerification.Invoice",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "approveInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "rejectInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "markAsPaid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
  type: "function",
  name: "approveInvoice",
  stateMutability: "nonpayable",
  inputs: [
    {
      name: "_id",
      type: "uint256",
      internalType: "uint256",
    },
  ],
  outputs: [],
},

{
  type: "function",
  name: "rejectInvoice",
  stateMutability: "nonpayable",
  inputs: [
    {
      name: "_id",
      type: "uint256",
      internalType: "uint256",
    },
  ],
  outputs: [],
},

{
  type: "function",
  name: "markAsPaid",
  stateMutability: "nonpayable",
  inputs: [
    {
      name: "_id",
      type: "uint256",
      internalType: "uint256",
    },
  ],
  outputs: [],
},
];