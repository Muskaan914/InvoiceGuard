
export const contractAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

export const contractABI = [
  {
    inputs: [],
    name: "invoiceCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "string",
        name: "_invoiceNumber",
        type: "string",
      },
      {
        internalType: "string",
        name: "_supplierName",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_invoiceHash",
        type: "bytes32",
      },
    ],
    name: "createInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "getInvoice",
    outputs: [
      {
        components: [
          {
            name: "id",
            type: "uint256",
          },
          {
            name: "invoiceNumber",
            type: "string",
          },
          {
            name: "supplierName",
            type: "string",
          },
          {
            name: "amount",
            type: "uint256",
          },
          {
            name: "invoiceHash",
            type: "bytes32",
          },
          {
            name: "status",
            type: "uint8",
          },
          {
            name: "createdBy",
            type: "address",
          },
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
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "approveInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "rejectInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "markAsPaid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];