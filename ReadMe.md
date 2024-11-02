## Smart Contract

### Introduction

The smart contract is designed to manage token deposits, withdrawals, and the distribution of WIN tokens on the Ethereum blockchain.

### Setup and Deployment

1. **`cd contracts`**: 
2. **Copy and Configure `.env`**: 
   Copy the example environment file and configure it with your details:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with the following variables:
   ```env
   ADDRESS=<your_address>
   PRIVATE_KEY=<your_private_key>
   RPC_URL=<rpc_url> # e.g., http://127.0.0.1:8545/
   ETHER_SCAN_KEY=<ether_scan_api_key>
   COIN_MARKET_CAP_API_KEY=<coin_market_cap_api_key>
   REPORT_GAS=true
   ```

3. **Install Dependencies**:
   ```bash
   npm i -f
   ```

4. **Run Tests**:
   Open a new terminal session and run all tests with gas snapshot:
   ```bash
   npm run test-snapshot
   ```
5. **Check Test Coverage**:
   View the test coverage report at contracts/coverage/index.html use live server extension to view it:
   ```bash
   npm run coverage ""
   ```

6. **Run Local Node**:
   ```bash
   npm run node
   ```

7. **Run Setup**:
   Initialize the contract setup by approving tokens and use 2nd hardhat account for testing the app:
   ```bash
   npm run setup
   ```

8. **For new yield**:
   For new yield:
   ```bash
   npm run yield
   ```

## Frontend

### Introduction

The frontend application, built with NextJs, handles smart contract interactions, listens for events, and provides API endpoints for various operations.

### Setup

1. **`cd app`**: 
2. **Install Dependencies**:
   ```bash
   npm i
   ```
3. **Run the app**:
   ```bash
   npm run dev
   ```
4. **Access the app**:
   [port 3000](http://localhost:3000)
