import { useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  keccak256,
  toHex,
} from "viem";

import "./App.css";
import { contractAddress, contractABI } from "./contract";
import { supabase } from "./supabaseClient";

// ================= BLOCKCHAIN =================

const chain = {
  id: 31337,
  name: "Hardhat Localhost",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
};

const client = createPublicClient({
  chain,
  transport: http("http://127.0.0.1:8545"),
});

// ================= APP =================

function App() {
  // ---------- Blockchain State ----------

  const [totalInvoices, setTotalInvoices] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [amount, setAmount] = useState("");

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("All");

  const [activePage, setActivePage] = useState("dashboard");
  const [appName, setAppName] = useState("InvoiceGuard");
  const [walletAddress, setWalletAddress] = useState("");

  const statusNames = [
    "Pending",
    "Approved",
    "Rejected",
    "Paid",
  ];

  // ---------- Authentication State ----------

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // ================= AUTHENTICATION =================

  // Restore Supabase session
  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setLoginError(error.message);
      }

      if (data?.session) {
        setIsLoggedIn(true);
        setUserEmail(data.session.user?.email || "");
      }

      setAuthChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user?.email || "");
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
      }

      setAuthChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
    }
  };

  // Email and password login
  async function handleLogin(e) {
    e.preventDefault();

    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password");
      return;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data?.session) {
      setIsLoggedIn(true);
      setUserEmail(data.user?.email || loginEmail);
    }
  }


  // Logout
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    setIsLoggedIn(false);
    setUserEmail("");
    setLoginEmail("");
    setLoginPassword("");
    setActivePage("dashboard");
  }

  // ================= BLOCKCHAIN FUNCTIONS =================

  // Connect MetaMask wallet
  async function connectWallet() {
    if (!window.ethereum) {
      setError("Please install MetaMask.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWalletAddress(accounts[0]);
      setError("Wallet connected successfully!");
    } catch (err) {
      setError("Wallet connection cancelled.");
    }
  }

  // Load all invoices
  async function loadBlockchainData() {
    try {
      setError("");

      const count = await client.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "invoiceCount",
      });

      const total = Number(count);
      setTotalInvoices(total);

      const allInvoices = [];

      for (let i = 1; i <= total; i++) {
        const data = await client.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: "getInvoice",
          args: [BigInt(i)],
        });

        allInvoices.push(data);
      }

      setInvoices(allInvoices);
    } catch (err) {
      console.error("Blockchain Error:", err);
      setError(err.shortMessage || err.message);
    }
  }

  // Load blockchain data after login
  useEffect(() => {
    if (isLoggedIn) {
      loadBlockchainData();
    }
  }, [isLoggedIn]);

  // Update invoice status
  async function updateInvoiceStatus(functionName, invoiceId) {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }

    try {
      setError("Confirm transaction in MetaMask...");

      const walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum),
      });

      const [account] = await walletClient.requestAddresses();

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName,
        args: [BigInt(invoiceId)],
        account,
      });

      setError("Waiting for confirmation...");

      await client.waitForTransactionReceipt({ hash });

      setError("Invoice status updated successfully!");

      await loadBlockchainData();
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.message);
    }
  }

  // Create invoice
  async function handleContinue() {
    if (!invoiceNumber || !supplierName || !amount) {
      setError("Please fill in all fields");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }

    try {
      setError("Connecting wallet...");

      const walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum),
      });

      const [account] = await walletClient.requestAddresses();

      const invoiceHash = keccak256(
        toHex(`${invoiceNumber}-${supplierName}-${amount}`)
      );

      setError("Confirm the transaction in MetaMask...");

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "createInvoice",
        args: [
          invoiceNumber.trim(),
          supplierName.trim(),
          BigInt(amount),
          invoiceHash,
        ],
        account,
      });

      setError("Waiting for blockchain confirmation...");

      await client.waitForTransactionReceipt({ hash });

      setError("Invoice saved successfully!");

      setInvoiceNumber("");
      setSupplierName("");
      setAmount("");
      setShowForm(false);

      await loadBlockchainData();
    } catch (err) {
      console.error("Transaction Error:", err);
      setError(err.shortMessage || err.message);
    }
  }

  // ================= COUNTS =================

  const approvedCount = invoices.filter(
    (inv) => Number(inv.status) === 1
  ).length;

  const pendingCount = invoices.filter(
    (inv) => Number(inv.status) === 0
  ).length;

  const rejectedCount = invoices.filter(
    (inv) => Number(inv.status) === 2
  ).length;

  // ================= COMPONENTS =================

  // Login page
  const loginPage = (
    <div className="auth-page">
      <div className="auth-card">
        <h1>◈ {appName}</h1>

        <p>Secure Supplier Invoice Management</p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          {loginError && (
            <p className="login-error">{loginError}</p>
          )}

          <button type="submit">Login</button>
        </form>

        <div className="divider">OR</div>

        <button
          type="button"
          className="google-login-btn"
          onClick={handleGoogleLogin}
        >
          🌐 Continue with Google
        </button>

        <small>Blockchain-powered invoice verification</small>
      </div>
    </div>
  );

  // Create invoice form
  const invoiceForm = showForm && (
    <div className="panel invoice-form">
      <h3>Create New Invoice</h3>

      <input
        type="text"
        placeholder="Invoice Number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
      />

      <input
        type="text"
        placeholder="Supplier Name"
        value={supplierName}
        onChange={(e) => setSupplierName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="invoice-actions">
        <button onClick={handleContinue}>
          Continue
        </button>

        <button onClick={() => setShowForm(false)}>
          Cancel
        </button>
      </div>
    </div>
  );


  // Invoice list
  const invoiceList =
    invoices.length > 0 ? (
      invoices.map((inv) => (
        <div className="invoice" key={inv.id.toString()}>
          <div>
            <strong>{inv.invoiceNumber}</strong>

            <p>
              {inv.supplierName} • ₹
              {Number(inv.amount).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <span className="badge paid">
              {statusNames[Number(inv.status)]}
            </span>

            {Number(inv.status) === 0 && (
              <div className="invoice-actions">
                <button
                  onClick={() =>
                    updateInvoiceStatus(
                      "approveInvoice",
                      inv.id
                    )
                  }
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    updateInvoiceStatus(
                      "rejectInvoice",
                      inv.id
                    )
                  }
                >
                  Reject
                </button>
              </div>
            )}

            {Number(inv.status) === 1 && (
              <button
                onClick={() =>
                  updateInvoiceStatus(
                    "markAsPaid",
                    inv.id
                  )
                }
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      ))
    ) : (
      <p>No invoices found.</p>
    );

  // ================= INVOICES PAGE =================

  const filteredInvoices = invoices.filter((inv) => {
    const query = invoiceSearch.trim().toLowerCase();

    const matchesSearch =
      query === "" ||
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.supplierName.toLowerCase().includes(query);

    const status = statusNames[Number(inv.status)];

    const matchesFilter =
      invoiceFilter === "All" ||
      status === invoiceFilter;

    return matchesSearch && matchesFilter;
  });

  const invoicesPage = (
    <div className="page">
      <header>
        <div>
          <h1>Invoices</h1>
          <p>Manage and review all supplier invoices.</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Create Invoice"}
        </button>
      </header>

      {invoiceForm}

      {error && <p className="green">{error}</p>}

      <div className="panel invoice-toolbar">
        <input
          type="text"
          placeholder="Search invoice or supplier..."
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
        />

        <select
          value={invoiceFilter}
          onChange={(e) => setInvoiceFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      <div className="panel invoice-table-panel">
        <h3>All Invoices</h3>

        <div className="invoice-table">
          <div className="invoice-table-header">
            <span>Invoice</span>
            <span>Supplier</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((inv) => (
              <div
                className="invoice-table-row"
                key={inv.id.toString()}
              >
                <strong>{inv.invoiceNumber}</strong>

                <span>{inv.supplierName}</span>

                <span>
                  ₹{Number(inv.amount).toLocaleString("en-IN")}
                </span>

                <span className="badge paid">
                  {statusNames[Number(inv.status)]}
                </span>

                <div className="table-actions">
                  {Number(inv.status) === 0 && (
                    <>
                      <button
                        onClick={() =>
                          updateInvoiceStatus(
                            "approveInvoice",
                            inv.id
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateInvoiceStatus(
                            "rejectInvoice",
                            inv.id
                          )
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {Number(inv.status) === 1 && (
                    <button
                      onClick={() =>
                        updateInvoiceStatus(
                          "markAsPaid",
                          inv.id
                        )
                      }
                    >
                      Mark Paid
                    </button>
                  )}

                  {Number(inv.status) === 2 && (
                    <span className="muted">Rejected</span>
                  )}

                  {Number(inv.status) === 3 && (
                    <span className="muted">Completed</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="empty-message">
              No invoices found.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // ================= SETTINGS PAGE =================

  const settingsPage = (
    <div className="page">

      <header>
        <div>
          <h1>Settings</h1>
          <p>Manage your account, wallet and blockchain information.</p>
        </div>
      </header>

      <div className="settings-grid">

        {/* ACCOUNT INFORMATION */}

        <div className="panel settings-card">
          <h3>👤 Account Information</h3>

          <label>Application Name</label>

          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />

          <label>Login Email</label>

          <input
            type="text"
            value={userEmail || "Not available"}
            readOnly
          />

          <label>Account Role</label>

          <input
            type="text"
            value="Administrator"
            readOnly
          />

          <div className="info-status">
            <span className="status-dot"></span>
            Account Active
          </div>
        </div>


        {/* WALLET INFORMATION */}

        <div className="panel settings-card">
          <h3>🦊 Wallet Information</h3>

          <label>Wallet Provider</label>

          <input
            type="text"
            value="MetaMask"
            readOnly
          />

          <label>Wallet Address</label>

          <input
            type="text"
            value={
              walletAddress
                ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`
                : "Wallet not connected"
            }
            readOnly
          />

          <label>Wallet Network</label>

          <input
            type="text"
            value="Hardhat Localhost"
            readOnly
          />

          <button onClick={connectWallet}>
            🦊 Connect Wallet
          </button>

          {walletAddress && (
            <p className="green">● Wallet Connected</p>
          )}
        </div>


        {/* BLOCKCHAIN INFORMATION */}

        <div className="panel settings-card">
          <h3>⛓️ Blockchain Information</h3>

          <label>Network</label>

          <input
            type="text"
            value="Hardhat Localhost"
            readOnly
          />

          <label>Chain ID</label>

          <input
            type="text"
            value="31337"
            readOnly
          />

          <label>Smart Contract</label>

          <input
            type="text"
            value={`${contractAddress.slice(0, 12)}...`}
            readOnly
          />

          <div className="info-status">
            <span className="status-dot"></span>
            Blockchain Connected
          </div>
        </div>


        {/* PROJECT INFORMATION */}

        <div className="panel settings-card">
          <h3>🛡️ About InvoiceGuard</h3>

          <div className="project-info">
            <p>
              <strong>Project Name:</strong>
              Supplier Invoice Fraud Prevention
            </p>

            <p>
              <strong>Platform:</strong>
              Blockchain Application
            </p>

            <p>
              <strong>Frontend:</strong>
              React + Vite
            </p>

            <p>
              <strong>Blockchain:</strong>
              Ethereum-compatible network
            </p>

            <p>
              <strong>Smart Contract:</strong>
              Solidity
            </p>

            <p>
              <strong>Wallet:</strong>
              MetaMask
            </p>
          </div>
        </div>


        {/* SECURITY INFORMATION */}

        <div className="panel settings-card">
          <h3>🔐 Security & Verification</h3>

          <div className="security-item">
            <span>Invoice Hashing</span>
            <span className="badge approved">Enabled</span>
          </div>

          <div className="security-item">
            <span>Duplicate Invoice Detection</span>
            <span className="badge approved">Enabled</span>
          </div>

          <div className="security-item">
            <span>Blockchain Records</span>
            <span className="badge approved">Active</span>
          </div>

          <div className="security-item">
            <span>Network Status</span>
            <span className="badge approved">Connected</span>
          </div>
        </div>


        {/* APPLICATION SETTINGS */}

        <div className="panel settings-card">
          <h3>⚙️ Application Preferences</h3>

          <label>Currency</label>

          <select defaultValue="INR">
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
          </select>

          <label>Verification Method</label>

          <select defaultValue="blockchain">
            <option value="blockchain">
              Blockchain Verification
            </option>

            <option value="manual">
              Manual Verification
            </option>
          </select>

          <button
            onClick={() =>
              setError("Settings saved successfully!")
            }
          >
            Save Preferences
          </button>
        </div>

      </div>

      {error && <p className="green">{error}</p>}

    </div>
  );

  // ================= DASHBOARD PAGE =================

  const dashboardPage = (
    <>
      <header>
        <div>
          <h1>Dashboard</h1>
          <p>Monitor supplier invoices and blockchain records.</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Create Invoice"}
        </button>
      </header>

      {/* CREATE INVOICE FORM */}

      {showForm && invoiceForm}

      {/* ERROR / SUCCESS MESSAGE */}

      {error && <p className="green">{error}</p>}

      {/* STATISTICS */}

      <section className="stats-grid">

        <div className="stats-card">
          <h3>Total Invoices</h3>
          <strong>{totalInvoices}</strong>
          <small>Blockchain records</small>
        </div>

        <div className="stats-card">
          <h3>Approved</h3>
          <strong>{approvedCount}</strong>
          <small className="green">Verified invoices</small>
        </div>

        <div className="stats-card">
          <h3>Pending</h3>
          <strong>{pendingCount}</strong>
          <small>Awaiting review</small>
        </div>

        <div className="stats-card">
          <h3>Fraud Alerts</h3>
          <strong>{rejectedCount}</strong>
          <small className="green">Rejected invoices</small>
        </div>

      </section>

      {/* MAIN CONTENT */}

      <section className="content-grid">

        {/* RECENT INVOICES */}

        <div className="panel">
          <h3>Recent Invoices</h3>

          {invoiceList}
        </div>

        {/* BLOCKCHAIN STATUS */}

        <div className="panel">
          <h3>Blockchain Status</h3>

          <div className="blockchain-status">

            <div className="status-icon">
              ✓
            </div>

            <div>
              <strong>Network Connected</strong>
              <p>Hardhat Localhost</p>
              <small>Chain ID: 31337</small>
            </div>

          </div>

          <div className="hash">

            <span>Contract Address</span>

            <p>
              {contractAddress.slice(0, 8)}...
              {contractAddress.slice(-6)}
            </p>

          </div>

        </div>

      </section>
    </>
  );

  // ================= RENDER =================

  if (authChecking) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return loginPage;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>◈ {appName}</h2>

        <nav>
          <p
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => {
              setActivePage("dashboard");
              setShowForm(false);
            }}
          >
            ▦ Dashboard
          </p>

          <p
            className={activePage === "invoices" ? "active" : ""}
            onClick={() => {
              setActivePage("invoices");
              setShowForm(false);
            }}
          >
            ▤ Invoices
          </p>

          <p
            className={activePage === "settings" ? "active" : ""}
            onClick={() => {
              setActivePage("settings");
              setShowForm(false);
            }}
          >
            ⚙ Settings
          </p>
        </nav>

        <div className="network">
          <span></span>
          Local Blockchain
          <small>Connected</small>
        </div>

        <div className="sidebar-user">
          {userEmail && <small>{userEmail}</small>}

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            ⎋ Logout
          </button>
        </div>
      </aside>

      <main className="main">
        {activePage === "invoices"
          ? invoicesPage
          : activePage === "settings"
          ? settingsPage
          : dashboardPage}
      </main>
    </div>
  );
}

export default App;