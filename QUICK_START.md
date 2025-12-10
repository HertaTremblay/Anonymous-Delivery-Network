# Quick Start Guide

Get started with Anonymous Delivery Network in 5 minutes!

## Installation (2 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/anonymous-delivery-network.git
cd anonymous-delivery-network

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Run Tests (2 minutes)

```bash
# Run all tests
npm run test

# Expected output:
# ✓ DeliveryManager Contract (8 tests)
# ✓ PaymentProcessor Contract (9 tests)
# ✓ ReputationTracker Contract (11 tests)
# ✓ Integration: Complete Delivery Workflow (5 tests)
# 33 passing tests
```

## Deploy Contracts (1 minute)

```bash
# Deploy to local network
npm run deploy

# This deploys:
# - PrivacyLayerContract
# - DeliveryManager
# - PaymentProcessor
# - ReputationTracker
```

## What's Next?

### Learn the Architecture
```bash
# Read architecture documentation
cat docs/ARCHITECTURE.md
```

### Understand FHE
```bash
# Learn Fully Homomorphic Encryption concepts
cat docs/FHE_CONCEPTS.md
```

### Deploy to Testnet
```bash
# Set up environment
cp .env.example .env

# Edit .env with your private key

# Deploy to Sepolia
npm run deploy:sepolia
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Key Contracts

### DeliveryManager
- Create encrypted delivery requests
- Accept deliveries with location matching
- Complete and track deliveries

**Example:**
```typescript
// Create delivery
const tx = await deliveryManager
  .connect(sender)
  .createDeliveryRequest(
    encryptedRecipient,
    recipientProof,
    encryptedPickup,
    pickupProof,
    encryptedDelivery,
    deliveryProof
  );
```

### PaymentProcessor
- Create encrypted payments
- Escrow management
- Payment completion and refunds

**Example:**
```typescript
// Create payment
const tx = await paymentProcessor
  .connect(payer)
  .createPayment(
    deliveryId,
    encryptedAmount,
    amountProof,
    payee.address,
    { value: ethers.parseEther("0.1") }
  );
```

### ReputationTracker
- Submit encrypted ratings
- Track reputation scores
- Calculate averages

**Example:**
```typescript
// Submit rating
const tx = await reputationTracker
  .connect(rater)
  .submitRating(
    deliveryId,
    ratedParticipant,
    encryptedScore,
    scoreProof,
    encryptedComment,
    commentProof
  );
```

## File Structure

```
contracts/              # Smart contracts
├── DeliveryManager.sol
├── PaymentProcessor.sol
├── ReputationTracker.sol
└── PrivacyLayer.sol

test/                  # Tests
├── DeliveryManager.test.ts
├── PaymentProcessor.test.ts
├── ReputationTracker.test.ts
└── integration/

docs/                  # Documentation
├── ARCHITECTURE.md
├── SPECIFICATION.md
├── FHE_CONCEPTS.md
└── ...

deploy/                # Deployment
└── deploy.ts
```

## Common Commands

```bash
# Compile
npm run compile

# Test
npm run test
npm run test:watch
npm run test:coverage

# Deploy
npm run deploy
npm run deploy:zama
npm run deploy:sepolia

# Quality
npm run lint
npm run clean

# Development
npm run typechain
```

## Useful Links

- **Full Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **FHE Concepts**: [FHE_CONCEPTS.md](FHE_CONCEPTS.md)
- **Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

## Need Help?

1. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for patterns and examples
2. Review test files for usage examples
3. Read contract comments for detailed explanations
4. Join [Zama Community](https://www.zama.ai/community)

## Next: Deep Dive

After running the quick start:

1. **Explore Contracts**
   ```bash
   code contracts/DeliveryManager.sol
   ```

2. **Run Tests in Watch Mode**
   ```bash
   npm run test:watch
   ```

3. **Check Coverage**
   ```bash
   npm run test:coverage
   ```

4. **Read Documentation**
   - Start with ARCHITECTURE.md
   - Learn FHE concepts
   - Review test examples

5. **Make Your First Change**
   - Add a new test
   - Modify a contract
   - Deploy and test

---

**Happy building! 🚀**
