
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract InvoiceVerification {
    enum InvoiceStatus {
        Pending,
        Approved,
        Rejected,
        Paid
    }

    struct Invoice {
        uint256 id;
        string invoiceNumber;
        string supplierName;
        uint256 amount;
        bytes32 invoiceHash;
        InvoiceStatus status;
        address createdBy;
    }

    uint256 public invoiceCount;

    mapping(uint256 => Invoice) public invoices;
    mapping(bytes32 => bool) public hashExists;

    event InvoiceCreated(
        uint256 id,
        string invoiceNumber,
        string supplierName,
        uint256 amount,
        bytes32 invoiceHash
    );

    event InvoiceStatusUpdated(
        uint256 id,
        InvoiceStatus status
    );

    function createInvoice(
        string memory _invoiceNumber,
        string memory _supplierName,
        uint256 _amount,
        bytes32 _invoiceHash
    ) public {
        require(!hashExists[_invoiceHash], "Duplicate invoice detected");

        invoiceCount++;

        invoices[invoiceCount] = Invoice(
            invoiceCount,
            _invoiceNumber,
            _supplierName,
            _amount,
            _invoiceHash,
            InvoiceStatus.Pending,
            msg.sender
        );

        hashExists[_invoiceHash] = true;

        emit InvoiceCreated(
            invoiceCount,
            _invoiceNumber,
            _supplierName,
            _amount,
            _invoiceHash
        );
    }

    function getInvoice(
        uint256 _id
    ) public view returns (Invoice memory) {
        require(_id > 0 && _id <= invoiceCount, "Invoice not found");

        return invoices[_id];
    }

    function approveInvoice(uint256 _id) public {
        require(_id > 0 && _id <= invoiceCount, "Invoice not found");
        require(
            invoices[_id].status == InvoiceStatus.Pending,
            "Invoice not pending"
        );

        invoices[_id].status = InvoiceStatus.Approved;

        emit InvoiceStatusUpdated(
            _id,
            InvoiceStatus.Approved
        );
    }

    function rejectInvoice(uint256 _id) public {
        require(_id > 0 && _id <= invoiceCount, "Invoice not found");
        require(
            invoices[_id].status == InvoiceStatus.Pending,
            "Invoice not pending"
        );

        invoices[_id].status = InvoiceStatus.Rejected;

        emit InvoiceStatusUpdated(
            _id,
            InvoiceStatus.Rejected
        );
    }

    function markAsPaid(uint256 _id) public {
        require(_id > 0 && _id <= invoiceCount, "Invoice not found");
        require(
            invoices[_id].status == InvoiceStatus.Approved,
            "Invoice must be approved first"
        );

        invoices[_id].status = InvoiceStatus.Paid;

        emit InvoiceStatusUpdated(
            _id,
            InvoiceStatus.Paid
        );
    }
}