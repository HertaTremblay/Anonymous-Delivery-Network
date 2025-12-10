# Anonymous Delivery Network - FHE Concepts Guide

## Introduction to Fully Homomorphic Encryption (FHE)

Fully Homomorphic Encryption is a revolutionary cryptographic technology that allows computation to be performed on encrypted data without first decrypting it. This is the foundation of the Anonymous Delivery Network's privacy guarantees.

### What is FHE?

**Traditional Encryption Workflow:**
```
Plaintext → Encrypt → Encrypted Data → Decrypt → Plaintext
(Cannot compute on encrypted data)
```

**FHE Workflow:**
```
Plaintext → Encrypt → Encrypted Data → Compute → Encrypted Result → Decrypt → Result
(Can compute directly on encrypted data)
```

### Why FHE Matters for Delivery

In a traditional delivery system:
- Addresses must be plaintext to route packages
- Couriers see sensitive recipient information
- Payment amounts visible on blockchain

With FHE:
- Addresses stay encrypted throughout the process
- Routing logic works on encrypted addresses
- Couriers never see sensitive information
- Payment amounts hidden from public view

## FHEVM Architecture

The FHEVM (Fully Homomorphic Encryption Virtual Machine) by Zama implements FHE within Ethereum smart contracts.

### Key Components

```
┌─────────────────────────────────────┐
│    Smart Contract (Solidity)        │
│  (Computes on encrypted data)       │
└──────────────┬──────────────────────┘
               │
               ├─ Encrypted Values (euint32, euint64)
               ├─ Operations (FHE.add, FHE.sub, etc.)
               └─ Permissions (FHE.allow, FHE.allowThis)
               │
┌──────────────▼──────────────────────┐
│     FHEVM Execution Engine          │
│  (Performs encrypted computation)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Decryption Relayer (Zama)        │
│  (Returns decrypted results safely) │
└─────────────────────────────────────┘
```

## Encrypted Data Types

FHEVM provides several encrypted data types for different value ranges:

### Integer Types

```solidity
euint8    // Encrypted 8-bit unsigned integer (0-255)
euint16   // Encrypted 16-bit unsigned integer (0-65,535)
euint32   // Encrypted 32-bit unsigned integer (0-4,294,967,295)
euint64   // Encrypted 64-bit unsigned integer (up to 2^64-1)
euint128  // Encrypted 128-bit unsigned integer
euint256  // Encrypted 256-bit unsigned integer
```

### Boolean Type

```solidity
ebool     // Encrypted boolean (true/false)
```

### Type Selection Guide

```solidity
// Addresses (typically encoded as uint64)
euint64 encryptedAddress;

// Payment amounts (cents or satoshis)
euint32 encryptedAmount;  // Good for amounts up to ~$42M

// Locations (latitude/longitude encoded)
euint64 encryptedLocation;

// Ratings (1-5 scale)
euint8 encryptedRating;
```

## Encryption Binding

One of the most important FHE concepts for the delivery platform:

### The Binding Context

Each encrypted value is bound to a **[contract, user]** pair:

```
Encrypted Value = Encrypt(plaintext, contract_address, user_address)
```

### Why Binding Matters

```typescript
// ✅ CORRECT: Alice encrypts for DeliveryManager with her address
const enc = await fhevm.createEncryptedInput(
  deliveryManager.address,
  alice.address
);
enc.add32(1000);
const { handles, inputProof } = await enc.encrypt();

// DeliveryManager can operate on value
await deliveryManager.connect(alice).processPayment(handles[0], inputProof);

// ❌ WRONG: Bob tries to use Alice's encrypted value
await deliveryManager.connect(bob).processPayment(handles[0], inputProof);
// Fails because proof doesn't match Bob's address
```

### Isolation Between Users

```typescript
// Alice's encrypted value
const encA = await fhevm.createEncryptedInput(
  contract.address,
  alice.address
);
encA.add64(ethers.id("secret_1"));
const { handles: hA } = await encA.encrypt();

// Bob's encrypted value
const encB = await fhevm.createEncryptedInput(
  contract.address,
  bob.address
);
encB.add64(ethers.id("secret_2"));
const { handles: hB } = await encB.encrypt();

// Alice's handle cannot be used by Bob
// Ensures complete privacy isolation
```

## Input Proofs

Input proofs are Zero-Knowledge Proofs that verify:
1. The value was encrypted correctly
2. The signer matches the encrypted user address
3. The binding context matches the target contract

### Proof Generation

```typescript
const encrypted = await fhevm.createEncryptedInput(
  contractAddress,
  userAddress
);
encrypted.add32(sensitiveValue);

// Returns both handles and proof
const { handles, inputProof } = await encrypted.encrypt();

// inputProof is a ZK proof that verifies:
// - This value was encrypted by userAddress
// - For this specific contract
// - The value is what was encrypted
```

### Proof Verification in Contract

```solidity
function processPayment(
    externalEuint32 amount,
    bytes calldata proof
) external {
    // ✅ Proof is automatically verified by FHEVM
    // If proof is invalid or doesn't match msg.sender, this fails
    euint32 internalAmount = FHE.fromExternal(amount, proof);

    // If we reach here, proof was valid
    // msg.sender is the original encrypter
    // amount is correctly encrypted

    // Proceed safely
    totalAmount = FHE.add(totalAmount, internalAmount);
}
```

## Permission System

FHE permissions control who can access encrypted values. Two types:

### Contract Permissions (FHE.allowThis())

Grants the contract itself permission to operate on encrypted values:

```solidity
function storeValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);

    // ✅ Grant contract permission
    FHE.allowThis(encrypted);  // Contract can now use this value

    // Now contract can compute with it
    euint32 doubled = FHE.add(encrypted, encrypted);
    storedValue = doubled;
}
```

**Without FHE.allowThis():**
```solidity
// ❌ WRONG - Missing FHE.allowThis()
function storeValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);

    // Missing: FHE.allowThis(encrypted);

    euint32 doubled = FHE.add(encrypted, encrypted);  // Fails!
    // Error: Contract doesn't have permission
}
```

### User Permissions (FHE.allow())

Grants a user (address) permission to decrypt a value:

```solidity
function storeForDecryption(
    externalEuint32 value,
    bytes calldata proof
) external {
    euint32 encrypted = FHE.fromExternal(value, proof);

    // ✅ Grant contract permission
    FHE.allowThis(encrypted);

    // ✅ Grant user permission to decrypt
    FHE.allow(encrypted, msg.sender);

    storedValue = encrypted;
}

function getDecryptedValue() external view returns (uint32) {
    // ✅ User has permission (from FHE.allow)
    // Only msg.sender can decrypt - other users get error
    return FHE.decrypt(storedValue);
}
```

## FHE Operations

### Arithmetic Operations

```solidity
// Addition
euint32 sum = FHE.add(a, b);

// Subtraction
euint32 difference = FHE.sub(a, b);

// Multiplication
euint32 product = FHE.mul(a, b);

// Division
euint32 quotient = FHE.div(a, b);

// Remainder
euint32 remainder = FHE.rem(a, b);

// Example: Calculate fee on encrypted amount
euint32 amount = 10000;           // 100.00 in cents
euint32 feePercent = 2;           // 2% fee
euint32 fee = FHE.div(
    FHE.mul(amount, feePercent),
    100
);
euint32 netAmount = FHE.sub(amount, fee);
```

### Comparison Operations

Return `ebool` (encrypted boolean):

```solidity
// Equality
ebool equal = FHE.eq(a, b);

// Not equal
ebool notEqual = FHE.ne(a, b);

// Less than
ebool lessThan = FHE.lt(a, b);

// Less than or equal
ebool lessOrEqual = FHE.le(a, b);

// Greater than
ebool greaterThan = FHE.gt(a, b);

// Greater than or equal
ebool greaterOrEqual = FHE.ge(a, b);

// Example: Check if amount exceeds limit (on encrypted data)
euint32 amount = encryptedPaymentAmount;
euint32 limit = 50000;  // $500 limit

ebool exceedsLimit = FHE.gt(amount, limit);
```

### Logical Operations

```solidity
// AND - both must be true
ebool result = FHE.and(cond1, cond2);

// OR - either can be true
ebool result = FHE.or(cond1, cond2);

// XOR - exactly one true
ebool result = FHE.xor(cond1, cond2);

// NOT - negate condition
ebool result = FHE.not(condition);

// Example: Verify multiple conditions encrypted
ebool hasPermission = FHE.and(
    FHE.ge(reputation, minimumReputation),
    FHE.le(amountRequested, dailyLimit)
);
```

### Conditional Operations

```solidity
// cmux: Conditional select (encrypted if-then-else)
euint32 result = FHE.cmux(
    condition,
    valueIfTrue,
    valueIfFalse
);

// Example: Route payment based on encrypted condition
euint32 paymentAmount = encryptedAmount;
euint32 courierFee = 500;      // $5 for standard delivery
euint32 expeditedFee = 1500;   // $15 for expedited

ebool isExpedited = FHE.gt(priorityLevel, STANDARD);

euint32 fee = FHE.cmux(
    isExpedited,
    expeditedFee,
    courierFee
);
// Fee is calculated without revealing priority level
```

### Bitwise Operations

```solidity
// Left shift
euint32 shifted = FHE.shl(value, shiftAmount);

// Right shift
euint32 shifted = FHE.shr(value, shiftAmount);

// These are useful for scaling without revealing magnitude
```

## Handle Management

Handles are temporary references to encrypted values:

```typescript
// Creating a handle
const encrypted = await fhevm.createEncryptedInput(...);
encrypted.add32(sensitiveValue);
const { handles, inputProof } = await encrypted.encrypt();
// handles[0] is a handle reference

// Using a handle in contract
await contract.function(handles[0], inputProof);

// Handles are temporary - they represent encrypted values
// The actual encrypted data remains hidden
```

### Handle Lifecycle

```
1. Handle Created
   └─ Represents encrypted value, used in transaction

2. Transaction Executed
   └─ Contract stores actual encrypted value (euint type)

3. Handle Becomes Historical
   └─ Original handle reference is for that transaction only

4. To Use Later
   └─ Retrieve stored euint value from contract state
   └─ Use that for further operations
```

### Handles in Delivery

```typescript
// Step 1: Alice encrypts delivery address
const encAddress = await fhevm.createEncryptedInput(
  deliveryManager.address,
  alice.address
);
encAddress.add64(ethers.id("recipient_address"));
const { handles: addressHandles, inputProof: addressProof } =
  await encAddress.encrypt();

// Step 2: Send to contract with handle
const tx = await deliveryManager
  .connect(alice)
  .createDelivery(
    addressHandles[0],  // Handle used here
    addressProof
  );

// Step 3: Contract stores encrypted value internally
// Handle becomes a reference to that transaction

// Step 4: Later, retrieve and work with stored encrypted value
const storedEncryptedAddress = await deliveryManager.getEncryptedAddress(deliveryId);
// This is the actual euint64, not a handle
```

## Privacy Patterns

### Pattern 1: Hidden Computation

```solidity
// User sends encrypted data
// Contract computes on encrypted data
// Result stored encrypted
// Only authorized user can decrypt

function calculateFee(
    externalEuint32 amount,
    bytes calldata proof
) external {
    euint32 amountEnc = FHE.fromExternal(amount, proof);
    FHE.allowThis(amountEnc);
    FHE.allow(amountEnc, msg.sender);

    // Calculate fee on encrypted amount
    // No one (not even contract) knows the amount
    euint32 fee = FHE.div(FHE.mul(amountEnc, 2), 100);

    FHE.allow(fee, msg.sender);
    storedFee = fee;
}
```

### Pattern 2: Threshold Comparison

```solidity
// Check if encrypted value exceeds threshold
// Without revealing the value

function isEligible(
    externalEuint32 balance,
    bytes calldata proof
) external view returns (ebool) {
    euint32 balanceEnc = FHE.fromExternal(balance, proof);
    FHE.allowThis(balanceEnc);

    euint32 threshold = 10000;  // Threshold can be public

    // Returns encrypted true/false
    // No one sees the balance value
    return FHE.ge(balanceEnc, threshold);
}
```

### Pattern 3: Private Accumulation

```solidity
// Add encrypted values without revealing totals

mapping(address => euint32) balances;

function addBalance(
    externalEuint32 amount,
    bytes calldata proof
) external {
    euint32 amountEnc = FHE.fromExternal(amount, proof);
    FHE.allowThis(amountEnc);

    // Add to encrypted total
    // No one knows the individual amounts or total
    balances[msg.sender] = FHE.add(balances[msg.sender], amountEnc);
}
```

## Common Mistakes and Solutions

### Mistake 1: Missing FHE.allowThis()

```solidity
// ❌ WRONG
function processValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    // Missing FHE.allowThis()!

    result = FHE.add(encrypted, 100);  // Fails!
}

// ✅ CORRECT
function processValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    FHE.allowThis(encrypted);  // Contract permission

    result = FHE.add(encrypted, 100);  // Works!
}
```

### Mistake 2: Exposing Encrypted Values in View Functions

```solidity
// ❌ WRONG - View functions cannot work with encrypted values
function getValue() external view returns (euint32) {
    return storedEncrypted;  // Fails! Cannot expose euint in view
}

// ✅ CORRECT - Decrypt before returning or use decrypt-in-contract
function getDecryptedValue() external view returns (uint32) {
    return FHE.decrypt(storedEncrypted);  // If you have permission
}
```

### Mistake 3: Mismatched Encryption Signer

```typescript
// ❌ WRONG - Alice encrypts but Bob submits
const enc = await fhevm.createEncryptedInput(
  contract.address,
  alice.address  // Alice's address
);
enc.add32(1000);
const { handles, inputProof } = await enc.encrypt();

await contract.connect(bob).process(handles[0], inputProof);
// Fails! Proof doesn't match Bob's address

// ✅ CORRECT - Signer matches encrypter
const enc = await fhevm.createEncryptedInput(
  contract.address,
  bob.address  // Bob's address
);
enc.add32(1000);
const { handles, inputProof } = await enc.encrypt();

await contract.connect(bob).process(handles[0], inputProof);
// Works!
```

### Mistake 4: Relying on Handles After Encryption

```typescript
// ❌ POTENTIALLY WRONG - Storing handle text is not persistent
const encrypted = await fhevm.createEncryptedInput(...);
encrypted.add32(value);
const { handles } = await encrypted.encrypt();

const handleString = handles[0];  // This is a reference
// This handle becomes invalid later

// ✅ CORRECT - Store encrypted values in contract state
function store(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    FHE.allowThis(encrypted);

    storedValues[msg.sender] = encrypted;  // Store as euint type
}

// Later: Retrieve and use
euint32 retrieved = storedValues[msg.sender];  // Persistent!
```

## FHE in the Delivery Platform

### Privacy in Delivery Creation

```solidity
function createDelivery(
    externalEuint64 recipientAddress,
    bytes calldata addressProof,
    externalEuint32 fee,
    bytes calldata feeProof
) external returns (bytes32 deliveryId) {
    // Convert encrypted values
    euint64 address_enc = FHE.fromExternal(recipientAddress, addressProof);
    euint32 fee_enc = FHE.fromExternal(fee, feeProof);

    // Grant permissions
    FHE.allowThis(address_enc);
    FHE.allowThis(fee_enc);
    FHE.allow(address_enc, msg.sender);
    FHE.allow(fee_enc, msg.sender);

    // Store encrypted (never exposed)
    Delivery storage d = deliveries[deliveryId];
    d.recipientAddress = address_enc;
    d.fee = fee_enc;

    return deliveryId;
}
```

### Privacy in Route Matching

```solidity
function acceptDelivery(
    bytes32 deliveryId,
    externalEuint64 courierLocation,
    bytes calldata locationProof
) external {
    Delivery storage d = deliveries[deliveryId];

    // Convert courier's location
    euint64 courier_loc = FHE.fromExternal(courierLocation, locationProof);
    FHE.allowThis(courier_loc);

    // Get pickup location from delivery (already encrypted)
    euint64 pickup_loc = d.pickupLocation;

    // Calculate distance on encrypted values
    // Courier doesn't see actual coordinates
    euint64 distance = calculateDistance(pickup_loc, courier_loc);
    ebool acceptable = FHE.le(distance, MAX_DISTANCE);

    // Only if location matches (computation hidden)
    if (FHE.decrypt(acceptable)) {
        d.courier = msg.sender;
    }
}
```

## Performance Considerations

### Computational Complexity

FHE operations have different costs:

```
Fast:     FHE.add, FHE.sub, FHE.and, FHE.or
Medium:   FHE.mul, FHE.cmux
Slower:   FHE.div, complex logic chains
```

### Optimization Tips

```solidity
// ❌ INEFFICIENT - Many divisions
for (uint i = 0; i < 100; i++) {
    total = FHE.add(total, FHE.div(values[i], 10));
}

// ✅ BETTER - Combine operations
euint32 sumValue = 0;
for (uint i = 0; i < 100; i++) {
    sumValue = FHE.add(sumValue, values[i]);
}
total = FHE.div(sumValue, 10);
```

## Conclusion

FHE is powerful but requires understanding:
1. **Binding**: Values bound to [contract, user] pairs
2. **Proofs**: Input proofs verify correct encryption
3. **Permissions**: Always use allowThis() and allow()
4. **Operations**: Use appropriate FHE operations
5. **Handles**: Temporary references, store euint in state

The Anonymous Delivery Network uses these principles to achieve:
- **Hidden Addresses**: Recipients remain anonymous
- **Private Locations**: Routes calculated on encrypted data
- **Confidential Payments**: Amounts hidden from public view
- **Anonymous Reputation**: Ratings tracked without identity

---

**FHE: Privacy Through Mathematics**
