# Anonymous Delivery Network - Developer Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Understanding of Solidity smart contracts
- Familiarity with Hardhat development environment
- Basic knowledge of FHE concepts (can learn in this project)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd anonymous-delivery

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test
```

### Project Structure

```
anonymous-delivery/
├── contracts/               # Solidity smart contracts
│   ├── DeliveryManager.sol
│   ├── PaymentProcessor.sol
│   ├── ReputationTracker.sol
│   ├── PrivacyLayer.sol
│   ├── interfaces/         # Contract interfaces
│   │   ├── IDeliveryManager.sol
│   │   └── IPaymentProcessor.sol
│   └── libs/              # Shared utilities
│       └── Errors.sol
├── test/                   # Test files (TypeScript)
│   ├── DeliveryManager.test.ts
│   ├── PaymentProcessor.test.ts
│   ├── ReputationTracker.test.ts
│   └── integration/
│       └── FullDeliveryWorkflow.test.ts
├── deploy/
│   └── deploy.ts          # Deployment scripts
├── docs/                   # Generated documentation
├── hardhat.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Development Workflow

### 1. Writing Contracts

#### Best Practices

**✅ DO: Use FHE Types**
```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PaymentExample is ZamaEthereumConfig {
    euint32 private totalAmount;  // ✅ Use FHE types for sensitive data

    function processPayment(
        externalEuint32 paymentAmount,
        bytes calldata proof
    ) external {
        // ✅ Convert external encrypted value
        euint32 amount = FHE.fromExternal(paymentAmount, proof);

        // ✅ Set up permissions
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);

        // Perform encrypted operations
        totalAmount = FHE.add(totalAmount, amount);
    }
}
```

**❌ DON'T: Forget Permission Setup**
```solidity
// ❌ WRONG - Missing FHE.allowThis()
function processPayment(
    externalEuint32 paymentAmount,
    bytes calldata proof
) external {
    euint32 amount = FHE.fromExternal(paymentAmount, proof);

    // ❌ Missing FHE.allowThis(amount) - will cause errors
    FHE.allow(amount, msg.sender);

    totalAmount = FHE.add(totalAmount, amount);
}
```

**✅ DO: Include Clear Comments**
```solidity
/// @notice Process a payment with encrypted amount
/// @dev The payment amount remains encrypted throughout processing
/// @param paymentAmount External encrypted payment amount (bound to msg.sender)
/// @param proof ZK proof verifying correct encryption and signer
function processPayment(
    externalEuint32 paymentAmount,
    bytes calldata proof
) external {
    // Convert external encrypted value to internal encrypted value
    euint32 amount = FHE.fromExternal(paymentAmount, proof);

    // Grant contract permission to operate on encrypted value
    FHE.allowThis(amount);

    // Grant user permission to decrypt the value
    FHE.allow(amount, msg.sender);

    // Perform encrypted arithmetic
    totalAmount = FHE.add(totalAmount, amount);
}
```

#### Common Patterns

**Pattern 1: Receiving and Storing Encrypted Values**
```solidity
mapping(bytes32 => euint32) private encryptedAmounts;

function storeEncryptedAmount(
    bytes32 id,
    externalEuint32 amount,
    bytes calldata proof
) external {
    // Convert external to internal encrypted value
    euint32 internalAmount = FHE.fromExternal(amount, proof);

    // Set up permissions
    FHE.allowThis(internalAmount);
    FHE.allow(internalAmount, msg.sender);

    // Store encrypted value
    encryptedAmounts[id] = internalAmount;
}
```

**Pattern 2: Operating on Encrypted Values**
```solidity
function addEncryptedAmounts(
    euint32 amount1,
    euint32 amount2
) internal pure returns (euint32) {
    // Perform arithmetic on encrypted values
    return FHE.add(amount1, amount2);
}
```

**Pattern 3: Conditional Logic on Encrypted Values**
```solidity
function processIfAboveThreshold(
    euint32 amount,
    euint32 threshold
) internal returns (euint32) {
    // ✅ Use FHE comparison
    ebool condition = FHE.le(threshold, amount);

    // ✅ Conditional value selection
    return FHE.cmux(condition, amount, euint32.wrap(0));
}
```

### 2. Writing Tests

#### Test Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { FhevmInstance } from "hardhat-fhev";

describe("PaymentProcessor", () => {
  let paymentProcessor: PaymentProcessor;
  let alice: any;
  let bob: any;
  let fhevm: FhevmInstance;

  beforeEach(async () => {
    // Get signers
    [alice, bob] = await ethers.getSigners();

    // Get FHEVM instance
    fhevm = await getFhevmInstance();

    // Deploy contract
    const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
    paymentProcessor = await PaymentProcessor.deploy();
  });

  describe("✅ Success Cases", () => {
    it("should process encrypted payment successfully", async () => {
      // Create encrypted input
      const encryptedAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );

      encryptedAmount.add32(1000);  // 1000 wei
      const { handles, inputProof } = await encryptedAmount.encrypt();

      // Execute transaction
      const tx = await paymentProcessor
        .connect(alice)
        .processPayment(handles[0], inputProof);

      expect(tx).to.emit(paymentProcessor, "PaymentProcessed");
    });

    it("should handle multiple payments correctly", async () => {
      // Test with multiple participants
      const amountAlice = 500;
      const amountBob = 300;

      // Process Alice's payment
      const encAlice = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encAlice.add32(amountAlice);
      const { handles: handlesA, inputProof: proofA } = await encAlice.encrypt();

      await paymentProcessor.connect(alice).processPayment(handlesA[0], proofA);

      // Process Bob's payment
      const encBob = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        bob.address
      );
      encBob.add32(amountBob);
      const { handles: handlesB, inputProof: proofB } = await encBob.encrypt();

      await paymentProcessor.connect(bob).processPayment(handlesB[0], proofB);

      // Verify both payments recorded
      expect(await paymentProcessor.getPaymentCount()).to.equal(2);
    });
  });

  describe("❌ Anti-Patterns / Failure Cases", () => {
    it("should reject invalid input proof", async () => {
      // ❌ Wrong signer - proof doesn't match sender
      const encryptedAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encryptedAmount.add32(1000);
      const { handles, inputProof } = await encryptedAmount.encrypt();

      // Try to use Bob's account to process Alice's encrypted input
      await expect(
        paymentProcessor.connect(bob).processPayment(handles[0], inputProof)
      ).to.be.revertedWith("InvalidProof");
    });

    it("should handle exceeded gas limits gracefully", async () => {
      // Test with large value that might cause issues
      const encryptedAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encryptedAmount.add32(ethers.MaxUint256);
      const { handles, inputProof } = await encryptedAmount.encrypt();

      // Should fail appropriately
      await expect(
        paymentProcessor.connect(alice).processPayment(handles[0], inputProof)
      ).to.be.reverted;
    });
  });

  describe("🔐 Permission Handling", () => {
    it("should grant correct permissions", async () => {
      // Verify contract has permission
      const encryptedAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encryptedAmount.add32(1000);
      const { handles, inputProof } = await encryptedAmount.encrypt();

      const tx = await paymentProcessor
        .connect(alice)
        .processPayment(handles[0], inputProof);

      // Contract should have processed without permission errors
      expect(tx).to.not.be.reverted;
    });

    it("should only allow authorized users to decrypt", async () => {
      // Store encrypted amount
      const encryptedAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encryptedAmount.add32(1000);
      const { handles, inputProof } = await encryptedAmount.encrypt();

      const storageTx = await paymentProcessor
        .connect(alice)
        .storePayment(handles[0], inputProof);

      // Only Alice (the encrypting user) should be able to decrypt
      const decrypted = await paymentProcessor
        .connect(alice)
        .getDecryptedPayment();

      expect(decrypted).to.equal(1000);

      // Bob cannot decrypt
      await expect(
        paymentProcessor.connect(bob).getDecryptedPayment()
      ).to.be.reverted;
    });
  });

  describe("📊 Integration Tests", () => {
    it("should handle complete payment workflow", async () => {
      // 1. Create payment
      let encAmount = await fhevm.createEncryptedInput(
        paymentProcessor.address,
        alice.address
      );
      encAmount.add32(1000);
      let { handles, inputProof } = await encAmount.encrypt();

      await paymentProcessor.connect(alice).createPayment(handles[0], inputProof);

      // 2. Move to escrow
      const paymentId = await paymentProcessor.getPaymentId(0);
      await paymentProcessor.connect(alice).escrowPayment(paymentId);

      // 3. Complete payment
      await paymentProcessor.connect(alice).completePayment(paymentId);

      // 4. Verify status
      const status = await paymentProcessor.getPaymentStatus(paymentId);
      expect(status).to.equal("COMPLETED");
    });
  });
});
```

#### Test Best Practices

**✅ DO: Use Descriptive Test Names**
```typescript
// ✅ GOOD
it("should process encrypted payment successfully", async () => {
  // test code
});

it("should reject invalid input proof from wrong signer", async () => {
  // test code
});

// ❌ BAD
it("test1", async () => {
  // test code
});

it("should work", async () => {
  // test code
});
```

**✅ DO: Test Both Success and Failure Cases**
```typescript
describe("PaymentProcessor", () => {
  describe("✅ Success Cases", () => {
    it("should process payment", async () => { /* ... */ });
  });

  describe("❌ Failure Cases", () => {
    it("should reject invalid proof", async () => { /* ... */ });
  });
});
```

**✅ DO: Include Edge Cases**
```typescript
it("should handle maximum value correctly", async () => {
  const maxValue = ethers.MaxUint256;
  // test with maximum value
});

it("should handle zero amount correctly", async () => {
  // test with zero
});
```

### 3. Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- test/PaymentProcessor.test.ts

# Run with coverage report
npm run test:coverage

# Run with detailed output
npm run test -- --verbose

# Run on specific network
npm run test -- --network sepolia
```

## FHE-Specific Development

### Understanding Encrypted Types

```typescript
// FHE Types Available
euint8    // Encrypted unsigned 8-bit integer
euint16   // Encrypted unsigned 16-bit integer
euint32   // Encrypted unsigned 32-bit integer (most common)
euint64   // Encrypted unsigned 64-bit integer
euint128  // Encrypted unsigned 128-bit integer
euint256  // Encrypted unsigned 256-bit integer
ebool     // Encrypted boolean
```

### Creating Encrypted Inputs

```typescript
const fhevm = await getFhevmInstance();

// Create encrypted input for this contract and user
const encrypted = await fhevm.createEncryptedInput(
  contractAddress,
  userAddress
);

// Add values to encrypt
encrypted.add32(1000);           // Add 32-bit value
encrypted.add64(50000);          // Add 64-bit value
encrypted.addBool(true);         // Add boolean

// Encrypt and get handles + proof
const { handles, inputProof } = await encrypted.encrypt();

// Pass to contract
await contract.function(handles[0], inputProof);
```

### Working with Encrypted Values in Contracts

```solidity
// Receiving encrypted values
function processEncrypted(
    externalEuint32 value,
    bytes calldata proof
) external {
    // Convert to internal encrypted type
    euint32 internalValue = FHE.fromExternal(value, proof);

    // Set up permissions
    FHE.allowThis(internalValue);      // Contract can operate on it
    FHE.allow(internalValue, msg.sender); // User can decrypt it

    // Use in operations
    euint32 doubled = FHE.add(internalValue, internalValue);

    // Store for later
    storedValues[msg.sender] = doubled;
}
```

### Common FHE Operations

```solidity
// Arithmetic
euint32 sum = FHE.add(a, b);
euint32 difference = FHE.sub(a, b);
euint32 product = FHE.mul(a, b);
euint32 quotient = FHE.div(a, b);
euint32 remainder = FHE.rem(a, b);

// Comparisons (return ebool)
ebool equal = FHE.eq(a, b);
ebool notEqual = FHE.ne(a, b);
ebool lessThan = FHE.lt(a, b);
ebool lessEqual = FHE.le(a, b);
ebool greaterThan = FHE.gt(a, b);
ebool greaterEqual = FHE.ge(a, b);

// Logical operations
ebool andResult = FHE.and(bool1, bool2);
ebool orResult = FHE.or(bool1, bool2);
ebool xorResult = FHE.xor(bool1, bool2);
ebool notResult = FHE.not(bool1);

// Conditional operations
euint32 result = FHE.cmux(condition, valueIfTrue, valueIfFalse);

// Bit operations
euint32 shifted = FHE.shl(value, shiftAmount);
euint32 rightShifted = FHE.shr(value, shiftAmount);
```

## Debugging FHE Issues

### Common Problems and Solutions

**Problem: "Invalid proof" error**
```
Error: Invalid proof - proof doesn't match encrypted value

Solution:
- Ensure the user address matches when creating encrypted input
- Verify same signer is used for encryption and contract call
- Check that proof format is correct
```

**Problem: "Missing FHE.allowThis()" permission error**
```
Error: Contract doesn't have permission to use encrypted value

Solution:
// ✅ Always call FHE.allowThis() for contract operations
function processValue(euint32 value) internal {
    FHE.allowThis(value);  // Add this line
    result = FHE.add(value, other);
}
```

**Problem: "Handle expired" error**
```
Error: Handle reference no longer valid

Solution:
- Don't rely on handles after long delays
- Store encrypted values as euint types, not handles
- Regenerate handles if needed for decryption
```

### Debug Techniques

```typescript
// 1. Add console logging in tests
console.log("Created handles:", handles);
console.log("Input proof length:", inputProof.length);

// 2. Check contract state
const storedValue = await contract.getStoredValue(key);
console.log("Stored value type:", storedValue);

// 3. Test with small values first
const smallValue = 1;  // Start here
encrypted.add32(smallValue);

// 4. Verify transaction events
const tx = await contract.function(...);
const receipt = await tx.wait();
console.log("Events:", receipt.logs);

// 5. Test permissions separately
FHE.allowThis(value);
// Test contract access works

FHE.allow(value, user);
// Test user access works
```

## Building and Deploying

### Compile Contracts

```bash
npm run compile
```

### Generate Type Files

```bash
# Automatically generated after compile
npm run typechain
```

### Deploy to Testnet

```bash
# Deploy to Zama testnet
npm run deploy

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### Verify Contract

```bash
# Verify on block explorer after deployment
npx hardhat verify --network sepolia \
  0x<CONTRACT_ADDRESS> \
  "param1" "param2"
```

## Documentation Generation

### Auto-Generate Docs

```bash
# Generate docs for a contract
npm run docs:generate PaymentProcessor

# Generate all docs
npm run docs:generate:all

# Generate GitBook-compatible docs
npm run docs:gitbook
```

### Document Your Code

Use JSDoc/TSDoc comments:

```solidity
/// @title Payment Processor Contract
/// @notice Handles all payment operations with FHE
/// @dev Inherits from ZamaEthereumConfig for FHEVM support
contract PaymentProcessor is ZamaEthereumConfig {

    /// @notice Process a payment with encrypted amount
    /// @dev The amount remains encrypted throughout
    /// @param encryptedAmount External encrypted amount from user
    /// @param proof ZK proof verifying encryption correctness
    /// @return success True if payment processed successfully
    function processPayment(
        externalEuint32 encryptedAmount,
        bytes calldata proof
    ) external returns (bool success) {
        // Implementation
    }
}
```

## Best Practices Checklist

Before submitting code:

### Code Quality
- [ ] All functions have clear names
- [ ] All functions documented with JSDoc/TSDoc
- [ ] Complex logic has explanatory comments
- [ ] No unused variables or imports
- [ ] Consistent naming conventions

### FHE-Specific
- [ ] All encrypted types properly declared
- [ ] Input proofs validated
- [ ] FHE.allowThis() called before operations
- [ ] FHE.allow() called for user access
- [ ] No plaintext sensitive data exposure

### Testing
- [ ] >85% code coverage
- [ ] Success cases tested
- [ ] Failure cases tested
- [ ] Edge cases covered
- [ ] Integration tests included
- [ ] Tests well-documented

### Security
- [ ] Input validation present
- [ ] No overflow/underflow issues
- [ ] Proper permission checks
- [ ] Error messages are helpful

### Documentation
- [ ] README updated
- [ ] Architecture explained
- [ ] Usage examples provided
- [ ] Common pitfalls documented
- [ ] Deployment instructions clear

---

**Happy Building with Privacy!**
