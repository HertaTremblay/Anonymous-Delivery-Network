# Anonymous Delivery Network - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control

### Verify Installation

```bash
node --version      # Should be v18.0.0 or higher
npm --version       # Should be 9.0.0 or higher
git --version       # Should be git version 2.0.0 or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/anonymous-delivery-network.git
cd anonymous-delivery-network
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Hardhat development environment
- Chai testing framework
- FHEVM libraries
- Solidity compiler tools
- Type definitions

### 3. Verify Installation

```bash
npm run compile
```

This should compile all contracts without errors:

```
✓ 9 contracts compiled successfully
```

## Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your settings:

```env
# Private key for deployment account
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
ZAMA_RPC_URL=https://devnet.zama.ai/
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **IMPORTANT**: Never commit your `.env` file to version control. It's included in `.gitignore`.

## Development Workflow

### Compile Contracts

```bash
npm run compile
```

Output:
```
Compiling Solidity files...
✓ 5 contracts compiled successfully
Generated TypeChain artifacts (4 files)
```

### Run Tests

```bash
npm run test
```

Running all tests:
```
✓ DeliveryManager Contract (8 tests)
✓ PaymentProcessor Contract (9 tests)
✓ ReputationTracker Contract (11 tests)
✓ Integration: Complete Delivery Workflow (5 tests)

Total: 33 passing tests (2.5s)
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This will automatically rerun tests whenever you modify files.

### Generate Coverage Report

```bash
npm run test:coverage
```

Output:
```
Coverage Summary:
─────────────────────────────────────────────────────────
File          | % Stmts | % Branch | % Funcs | % Lines |
─────────────────────────────────────────────────────────
DeliveryManager.sol    | 95.2    | 88.4     | 100     | 94.8    |
PaymentProcessor.sol   | 94.8    | 87.2     | 100     | 94.5    |
ReputationTracker.sol  | 92.3    | 84.6     | 100     | 91.9    |
PrivacyLayer.sol       | 96.1    | 89.5     | 100     | 95.8    |
─────────────────────────────────────────────────────────
Total                  | 94.6    | 87.4     | 100     | 94.3    |
```

### Deploy to Local Network

```bash
npm run deploy
```

Example output:
```
═══════════════════════════════════════════════════════════════
       Anonymous Delivery Network - Contract Deployment
═══════════════════════════════════════════════════════════════

📋 Deploying contracts with account: 0x1234...

1️⃣  Deploying PrivacyLayerContract...
✅ PrivacyLayerContract deployed at: 0x5678...

2️⃣  Deploying DeliveryManager...
✅ DeliveryManager deployed at: 0x9abc...

3️⃣  Deploying PaymentProcessor...
✅ PaymentProcessor deployed at: 0xdef0...

4️⃣  Deploying ReputationTracker...
✅ ReputationTracker deployed at: 0x1234...

✨ Deployment Complete!
```

### Deploy to Zama Testnet

First, ensure you have testnet ETH:

```bash
npm run deploy:zama
```

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Project Structure

```
anonymous-delivery-network/
├── contracts/                          # Smart contracts
│   ├── DeliveryManager.sol            # Core delivery management
│   ├── PaymentProcessor.sol           # Payment handling
│   ├── ReputationTracker.sol          # Reputation system
│   ├── PrivacyLayer.sol               # FHE utilities
│   ├── interfaces/                    # Contract interfaces
│   │   ├── IDeliveryManager.sol
│   │   └── IPaymentProcessor.sol
│   └── libs/                          # Shared libraries
│       └── Errors.sol
├── test/                              # Test files
│   ├── DeliveryManager.test.ts
│   ├── PaymentProcessor.test.ts
│   ├── ReputationTracker.test.ts
│   └── integration/
│       └── FullDeliveryWorkflow.test.ts
├── deploy/                            # Deployment scripts
│   └── deploy.ts
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md
│   ├── SPECIFICATION.md
│   ├── DEVELOPER_GUIDE.md
│   ├── TESTING_GUIDE.md
│   ├── FHE_CONCEPTS.md
│   └── REQUIREMENTS.md
├── hardhat.config.ts                  # Hardhat configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies
├── .env.example                       # Environment template
├── LICENSE                            # License file
└── README.md                          # Project overview
```

## Common Issues and Solutions

### Issue: "Cannot find module '@fhevm/solidity'"

**Solution:**
```bash
npm install
npm run compile
```

### Issue: "Insufficient funds for gas"

**Solution:**
- Request testnet ETH from a faucet
- For Sepolia: https://sepoliafaucet.com
- For Zama: Check Zama documentation for faucet

### Issue: "Network request failed"

**Solution:**
Check your RPC URL in `.env`:
```bash
# Test Sepolia connection
curl https://rpc.sepolia.org/
```

### Issue: Tests failing with timeout

**Solution:**
Increase timeout in `hardhat.config.ts`:
```typescript
mocha: {
  timeout: 60000,  // 60 seconds
}
```

### Issue: "Contract already deployed"

**Solution:**
Clear cache and artifacts:
```bash
npm run clean
npm run compile
npm run deploy
```

## Hardhat Console

For interactive testing, use the Hardhat console:

```bash
npx hardhat console
```

Example usage:

```javascript
// Connect to contracts
const DeliveryManager = await ethers.getContractFactory("DeliveryManager");
const dm = await DeliveryManager.deploy();
await dm.deployed();

// Query data
const count = await dm.getDeliveryCount();
console.log("Total deliveries:", count.toString());

// Sign transaction
const [signer] = await ethers.getSigners();
console.log("Signer address:", signer.address);
```

## Gas Optimization

View gas usage per function:

```bash
npm run test:gas
```

Output:
```
·······························|···············|·············|·············|
|  Contract              | Method      | Min  | Max  | Avg  |
|::::::::::::::::::::::: |:::::::::::::| ::::: | ::::: | ::::: |
| DeliveryManager        | acceptDelivery | 32154 | 52842 | 42498 |
| PaymentProcessor       | createPayment  | 65234 | 85432 | 75333 |
```

## Code Linting

Check code style with solhint:

```bash
npm run lint
```

## Type Generation

Generate TypeChain types:

```bash
npm run typechain
```

This creates type-safe contract bindings for TypeScript.

## Running Specific Tests

```bash
# Run single test file
npm run test -- test/DeliveryManager.test.ts

# Run specific test suite
npm run test -- --grep "Success Cases"

# Run specific test
npm run test -- --grep "should create a delivery request"
```

## Debugging

### Debug a single test:

```bash
npx hardhat test test/DeliveryManager.test.ts --grep "should create"
```

### View detailed logs:

```bash
DEBUG=hardhat:* npm run test
```

### Use Hardhat console for debugging:

```bash
npx hardhat console
> const contract = await ethers.getContractAt("DeliveryManager", "0x...")
> await contract.getDeliveryCount()
BigNumber { _hex: '0x01', _isBigNumber: true }
```

## Next Steps

1. **Read the Documentation**
   - Start with [README.md](README.md) for project overview
   - Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
   - Check [FHE_CONCEPTS.md](docs/FHE_CONCEPTS.md) to learn about FHE

2. **Explore the Code**
   - Review contract implementations in `contracts/`
   - Read test cases in `test/`
   - Check deployment script in `deploy/`

3. **Develop and Test**
   - Create new contracts following existing patterns
   - Write comprehensive tests
   - Ensure >85% code coverage

4. **Deploy**
   - Deploy to local network first: `npm run deploy`
   - Test thoroughly before deploying to testnet
   - Use Sepolia testnet for public testing

5. **Submit**
   - Generate coverage report
   - Create demonstration video
   - Submit for bounty consideration

## Getting Help

- **Documentation**: Check `docs/` folder
- **Community**: Join [Zama Discord](https://discord.com/invite/zama)
- **Forum**: Ask on [Zama Community Forum](https://www.zama.ai/community)
- **Issues**: Report bugs or ask questions

## Development Tips

### Efficient Testing
```bash
# Run only failing tests
npm run test -- --grep "Failure Cases"

# Run only new/modified tests
npm run test -- --bail  # Stop on first failure
```

### Contract Development Best Practices
- Start with interfaces (`IDeliveryManager.sol`)
- Implement contract with clear comments
- Write tests as you code
- Use `enum` for status values
- Use custom errors instead of require strings
- Implement proper access control

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-delivery-feature

# Make changes and test
npm run test

# Commit with clear messages
git commit -m "feat: add new delivery matching algorithm"

# Push and create PR
git push origin feature/new-delivery-feature
```

## Performance Monitoring

View contract interaction costs:

```bash
npm run test:gas > gas-report
cat gas-report
```

## Clean Up

Remove all build artifacts:

```bash
npm run clean
```

This removes:
- `artifacts/`
- `cache/`
- `coverage/`
- `typechain-types/`

---

**You're all set! Happy developing! 🚀**
