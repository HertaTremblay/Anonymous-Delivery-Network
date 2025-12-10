# Anonymous Delivery Network - Testing Guide

## Testing Overview

This guide covers comprehensive testing strategies for the Anonymous Delivery Network, including FHE-specific testing patterns, integration testing, and best practices for privacy-preserving smart contracts.

## Test Structure

### Organization by Feature

```
test/
├── unit/
│   ├── DeliveryManager.test.ts      # Core delivery operations
│   ├── PaymentProcessor.test.ts     # Payment handling
│   ├── ReputationTracker.test.ts    # Reputation system
│   └── PrivacyLayer.test.ts         # Utility functions
├── integration/
│   ├── FullDeliveryWorkflow.test.ts # End-to-end delivery
│   ├── PaymentFlow.test.ts          # Payment lifecycle
│   └── ReputationFlow.test.ts       # Reputation updates
└── security/
    ├── PermissionTests.test.ts      # FHE permissions
    └── PrivacyTests.test.ts         # Privacy guarantees
```

## Unit Testing

### Basic Test Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { FhevmInstance } from "hardhat-fhevm";

describe("Feature: [Feature Name]", () => {
  let contract: ContractName;
  let fhevm: FhevmInstance;
  let owner: any;
  let user: any;

  before(async () => {
    // Setup called once for all tests
    [owner, user] = await ethers.getSigners();
    fhevm = await getFhevmInstance();
  });

  beforeEach(async () => {
    // Fresh state for each test
    const ContractFactory = await ethers.getContractFactory("ContractName");
    contract = await ContractFactory.deploy();
  });

  describe("✅ Success Cases", () => {
    it("should perform operation correctly", async () => {
      // Arrange
      const input = 1000;

      // Act
      const result = await contract.operation(input);

      // Assert
      expect(result).to.equal(expectedResult);
    });
  });

  describe("❌ Failure Cases", () => {
    it("should reject invalid input", async () => {
      const invalidInput = -1;

      await expect(
        contract.operation(invalidInput)
      ).to.be.revertedWith("InvalidInput");
    });
  });
});
```

### Testing Encrypted Operations

```typescript
describe("Encrypted Operations", () => {
  it("should add encrypted values correctly", async () => {
    // Create encrypted inputs
    const enc1 = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    enc1.add32(100);
    const { handles: h1, inputProof: p1 } = await enc1.encrypt();

    const enc2 = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    enc2.add32(200);
    const { handles: h2, inputProof: p2 } = await enc2.encrypt();

    // Execute operation
    const tx = await contract
      .connect(owner)
      .addEncrypted(h1[0], p1, h2[0], p2);

    // Verify event or result
    expect(tx).to.emit(contract, "OperationCompleted");
  });

  it("should maintain encryption throughout operation", async () => {
    // Create encrypted value
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(500);
    const { handles, inputProof } = await encrypted.encrypt();

    // Store encrypted value
    await contract.connect(owner).storeValue(handles[0], inputProof);

    // Retrieve encrypted value (still encrypted)
    const storedHandle = await contract.getStoredHandle();

    // Can only decrypt with proper permissions
    const decrypted = await contract
      .connect(owner)
      .decryptValue(storedHandle);

    expect(decrypted).to.equal(500);
  });
});
```

### Testing FHE Permissions

```typescript
describe("FHE Permissions", () => {
  it("should grant contract permission with allowThis()", async () => {
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(1000);
    const { handles, inputProof } = await encrypted.encrypt();

    // Function that uses FHE.allowThis() internally
    const tx = await contract
      .connect(owner)
      .operateOnValue(handles[0], inputProof);

    // Should not revert with permission errors
    expect(tx).to.not.be.reverted;
  });

  it("should deny operations without allowThis()", async () => {
    // This tests a contract with missing FHE.allowThis()
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(1000);
    const { handles, inputProof } = await encrypted.encrypt();

    // Should revert with permission error
    await expect(
      contractWithoutPermissions.connect(owner)
        .operateOnValue(handles[0], inputProof)
    ).to.be.reverted;
  });

  it("should grant user permission with allow()", async () => {
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(1000);
    const { handles, inputProof } = await encrypted.encrypt();

    // Store value with permission
    await contract
      .connect(owner)
      .storeValueWithPermission(handles[0], inputProof);

    // Owner can decrypt
    const decrypted = await contract
      .connect(owner)
      .decryptPermissionedValue();

    expect(decrypted).to.equal(1000);

    // Other user cannot decrypt
    await expect(
      contract.connect(user).decryptPermissionedValue()
    ).to.be.reverted;
  });
});
```

## Integration Testing

### Full Workflow Tests

```typescript
describe("Integration: Complete Delivery Workflow", () => {
  let deliveryManager: DeliveryManager;
  let paymentProcessor: PaymentProcessor;
  let reputationTracker: ReputationTracker;
  let sender: any;
  let courier: any;
  let recipient: any;
  let fhevm: FhevmInstance;

  beforeEach(async () => {
    [sender, courier, recipient] = await ethers.getSigners();
    fhevm = await getFhevmInstance();

    // Deploy contracts
    const DMFactory = await ethers.getContractFactory("DeliveryManager");
    deliveryManager = await DMFactory.deploy();

    const PPFactory = await ethers.getContractFactory("PaymentProcessor");
    paymentProcessor = await PPFactory.deploy();

    const RTFactory = await ethers.getContractFactory("ReputationTracker");
    reputationTracker = await RTFactory.deploy();
  });

  it("should complete full delivery workflow", async () => {
    // Step 1: Sender creates delivery request with encrypted data
    const encRecipient = await fhevm.createEncryptedInput(
      deliveryManager.address,
      sender.address
    );
    encRecipient.add64(ethers.id("recipient_address_hash"));
    const { handles: h1, inputProof: p1 } = await encRecipient.encrypt();

    const encPickup = await fhevm.createEncryptedInput(
      deliveryManager.address,
      sender.address
    );
    encPickup.add64(40.7128); // latitude as number
    const { handles: h2, inputProof: p2 } = await encPickup.encrypt();

    const encDelivery = await fhevm.createEncryptedInput(
      deliveryManager.address,
      sender.address
    );
    encDelivery.add64(40.7589); // different location
    const { handles: h3, inputProof: p3 } = await encDelivery.encrypt();

    const createTx = await deliveryManager
      .connect(sender)
      .createDeliveryRequest(
        h1[0], p1,  // recipient
        h2[0], p2,  // pickup location
        h3[0], p3   // delivery location
      );

    const receipt = await createTx.wait();
    const deliveryRequestedEvent = receipt.events.find(
      (e: any) => e.event === "DeliveryRequested"
    );
    const requestId = deliveryRequestedEvent.args.requestId;

    // Step 2: Courier accepts delivery based on location
    const encCourierLoc = await fhevm.createEncryptedInput(
      deliveryManager.address,
      courier.address
    );
    encCourierLoc.add64(40.7200); // Close to pickup location
    const { handles: h4, inputProof: p4 } = await encCourierLoc.encrypt();

    const acceptTx = await deliveryManager
      .connect(courier)
      .acceptDelivery(requestId, h4[0], p4);

    expect(acceptTx).to.emit(deliveryManager, "DeliveryAccepted");

    // Step 3: Process payment
    const encAmount = await fhevm.createEncryptedInput(
      paymentProcessor.address,
      sender.address
    );
    encAmount.add32(5000); // $50 in cents
    const { handles: h5, inputProof: p5 } = await encAmount.encrypt();

    const paymentTx = await paymentProcessor
      .connect(sender)
      .createPayment(requestId, h5[0], p5, courier.address, {
        value: ethers.parseEther("0.1"),
      });

    const paymentReceipt = await paymentTx.wait();
    const paymentEvent = paymentReceipt.events.find(
      (e: any) => e.event === "PaymentCreated"
    );
    const paymentId = paymentEvent.args.paymentId;

    // Step 4: Move payment to escrow
    await paymentProcessor.connect(sender).escrowPayment(paymentId);

    // Step 5: Complete delivery
    const completeTx = await deliveryManager
      .connect(courier)
      .completeDelivery(requestId);

    expect(completeTx).to.emit(deliveryManager, "DeliveryCompleted");

    // Step 6: Release payment
    await paymentProcessor.connect(sender).releasePayment(paymentId);

    // Step 7: Rate delivery
    const encRating = await fhevm.createEncryptedInput(
      reputationTracker.address,
      sender.address
    );
    encRating.add8(5); // 5-star rating
    const { handles: h6, inputProof: p6 } = await encRating.encrypt();

    const rateTx = await reputationTracker
      .connect(sender)
      .submitRating(requestId, courier.address, h6[0], p6);

    expect(rateTx).to.emit(reputationTracker, "RatingSubmitted");

    // Verify final state
    const finalStatus = await deliveryManager.getDeliveryStatus(requestId);
    expect(finalStatus).to.equal("COMPLETED");
  });
});
```

### Multi-User Scenarios

```typescript
describe("Integration: Multi-User Scenarios", () => {
  it("should handle multiple concurrent deliveries", async () => {
    const [sender1, sender2, courier1, courier2] =
      await ethers.getSigners();

    // Create delivery requests from multiple senders
    const req1 = createDeliveryRequest(sender1, courier1);
    const req2 = createDeliveryRequest(sender2, courier2);

    // Both deliveries processed in parallel
    await Promise.all([
      deliveryManager.connect(sender1).createDeliveryRequest(...req1),
      deliveryManager.connect(sender2).createDeliveryRequest(...req2),
    ]);

    expect(await deliveryManager.getDeliveryCount()).to.equal(2);
  });

  it("should maintain privacy across users", async () => {
    const [sender1, sender2] = await ethers.getSigners();

    // Sender1 creates delivery
    const enc1 = await createEncryptedDelivery(sender1);
    const req1 = await deliveryManager
      .connect(sender1)
      .createDeliveryRequest(...enc1);

    // Sender2 creates delivery
    const enc2 = await createEncryptedDelivery(sender2);
    const req2 = await deliveryManager
      .connect(sender2)
      .createDeliveryRequest(...enc2);

    // Sender2 cannot access Sender1's encrypted data
    const delivery1 = await deliveryManager.getDelivery(req1.deliveryId);

    // Data is encrypted
    expect(delivery1.recipientAddress).to.not.equal(delivery1.recipientAddress);
  });
});
```

## Security Testing

### Permission and Access Control

```typescript
describe("Security: Permission Management", () => {
  it("should prevent unauthorized decryption", async () => {
    const [owner, unauthorized] = await ethers.getSigners();

    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(12345);
    const { handles, inputProof } = await encrypted.encrypt();

    // Owner stores value with permission
    await contract.connect(owner).storeValue(handles[0], inputProof);

    // Unauthorized user cannot decrypt
    await expect(
      contract.connect(unauthorized).getDecryptedValue()
    ).to.be.revertedWith("UnauthorizedDecryption");
  });

  it("should prevent permission escalation", async () => {
    const [owner, attacker] = await ethers.getSigners();

    // Attacker cannot grant themselves permission
    const handle = await createEncryptedValue(owner);

    await expect(
      contract.connect(attacker).grantPermission(handle, attacker.address)
    ).to.be.reverted;
  });
});
```

### Privacy Verification

```typescript
describe("Security: Privacy Guarantees", () => {
  it("should never expose plaintext sensitive data", async () => {
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(99999); // Sensitive amount
    const { handles, inputProof } = await encrypted.encrypt();

    await contract.connect(owner).processPayment(handles[0], inputProof);

    // Check that sensitive data is not in logs or state
    const storage = await ethers.provider.getStorageAt(
      contract.address,
      ethers.id("sensitiveValue")
    );

    // Should not equal plaintext value
    expect(storage).to.not.equal(99999);
  });

  it("should isolate encrypted values per user-contract pair", async () => {
    const [user1, user2] = await ethers.getSigners();

    // User1 encrypts a value
    const enc1 = await fhevm.createEncryptedInput(
      contract.address,
      user1.address
    );
    enc1.add32(1000);
    const { handles: h1, inputProof: p1 } = await enc1.encrypt();

    // User2 encrypts same plaintext value
    const enc2 = await fhevm.createEncryptedInput(
      contract.address,
      user2.address
    );
    enc2.add32(1000);
    const { handles: h2, inputProof: p2 } = await enc2.encrypt();

    // Handles should be different (different encryption contexts)
    expect(h1[0]).to.not.equal(h2[0]);

    // Contract can use both independently
    await contract.connect(user1).storeValue(h1[0], p1);
    await contract.connect(user2).storeValue(h2[0], p2);

    // Each user can only decrypt their own value
    const val1 = await contract.connect(user1).getDecryptedValue();
    const val2 = await contract.connect(user2).getDecryptedValue();

    expect(val1).to.equal(1000);
    expect(val2).to.equal(1000);
  });
});
```

## Test Coverage Requirements

### Minimum Coverage Targets

```
Statements: >85%
Branches: >80%
Functions: >85%
Lines: >85%
```

### Coverage Report Generation

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# Generate LCOV format for CI/CD
npm run test:coverage -- --reporter=lcov
```

### Coverage Analysis Script

```typescript
// scripts/check-coverage.ts
import { exec } from "child_process";

const REQUIRED_COVERAGE = {
  lines: 85,
  statements: 85,
  functions: 85,
  branches: 80,
};

async function checkCoverage() {
  // Run tests with coverage
  // Parse output
  // Compare with requirements
  // Report missing coverage areas
}
```

## Test Execution

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- test/DeliveryManager.test.ts

# Run specific test suite
npm run test -- --grep "Success Cases"

# Run with detailed output
npm run test -- --reporter spec

# Run with timeout override
npm run test -- --timeout 10000

# Run in parallel (Hardhat parallel mode)
npm run test -- --parallel
```

### Continuous Testing

```bash
# Watch mode - re-run on file changes
npm run test:watch

# Test on every git commit
npm run test:pre-commit
```

## Error Message Testing

### Validating Error Messages

```typescript
describe("Error Messages", () => {
  it("should provide helpful error messages", async () => {
    const encrypted = await fhevm.createEncryptedInput(
      contract.address,
      owner.address
    );
    encrypted.add32(0);
    const { handles, inputProof } = await encrypted.encrypt();

    await expect(
      contract.connect(owner).divideByValue(handles[0], inputProof)
    )
      .to.be.revertedWithCustomError(contract, "DivisionByZero")
      .withArgs();
  });

  it("should explain permission failures", async () => {
    const [owner, unauthorized] = await ethers.getSigners();

    await expect(
      contract.connect(unauthorized).accessProtectedValue()
    ).to.be.revertedWithCustomError(contract, "UnauthorizedAccess")
      .withArgs(unauthorized.address);
  });
});
```

## Test Data Management

### Creating Fixture Functions

```typescript
async function createEncryptedPayment(user: any, amount: number) {
  const encrypted = await fhevm.createEncryptedInput(
    contract.address,
    user.address
  );
  encrypted.add32(amount);
  return await encrypted.encrypt();
}

async function createDeliveryRequest(
  sender: any,
  recipient: string,
  location: number
) {
  const encRecipient = await fhevm.createEncryptedInput(
    contract.address,
    sender.address
  );
  encRecipient.add64(ethers.id(recipient));
  const { handles: h1, inputProof: p1 } = await encRecipient.encrypt();

  const encLocation = await fhevm.createEncryptedInput(
    contract.address,
    sender.address
  );
  encLocation.add64(location);
  const { handles: h2, inputProof: p2 } = await encLocation.encrypt();

  return { handles: [h1, h2], proofs: [p1, p2] };
}

// Usage
it("should process payment", async () => {
  const { handles, proofs } = await createEncryptedPayment(owner, 5000);
  await contract.connect(owner).processPayment(handles[0], proofs[0]);
});
```

## Performance Testing

### Measuring Gas Usage

```typescript
describe("Performance: Gas Usage", () => {
  it("should use reasonable gas for payment processing", async () => {
    const { handles, inputProof } = await createEncryptedPayment(owner, 5000);

    const tx = await contract
      .connect(owner)
      .processPayment(handles[0], inputProof);
    const receipt = await tx.wait();

    // Gas usage should be within acceptable range
    expect(receipt.gasUsed).to.be.lt(500000); // Example limit
    console.log(`Gas used: ${receipt.gasUsed}`);
  });
});
```

### Transaction Time Measurements

```typescript
async function measureTransactionTime(
  fn: () => Promise<any>
): Promise<number> {
  const startTime = Date.now();
  await fn();
  return Date.now() - startTime;
}

it("should complete delivery quickly", async () => {
  const time = await measureTransactionTime(async () => {
    await deliveryManager.connect(courier).completeDelivery(requestId);
  });

  expect(time).to.be.lt(5000); // Should complete in < 5 seconds
});
```

---

**Comprehensive Testing Ensures Reliable Privacy**
