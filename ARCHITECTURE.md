# Anonymous Delivery Network - Architecture Guide

## System Overview

The Anonymous Delivery Network is built on a modular smart contract architecture that leverages Fully Homomorphic Encryption (FHE) to maintain privacy throughout all delivery operations.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Web3 Wallet, Delivery Dapp UI)                 │
└────────┬────────────────────────────────────────────────────┘
         │ Encrypted Transactions
         │
┌────────▼────────────────────────────────────────────────────┐
│                  Blockchain Layer (Ethereum)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  DeliveryManager │  │ PaymentProcessor │  │ Reputation │ │
│  │      (FHE)       │  │       (FHE)      │  │  Tracker   │ │
│  │                  │  │                  │  │   (FHE)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┘ │
│           │                     │                    │       │
│           └─────────────────────┼────────────────────┘       │
│                                 │                            │
│           ┌─────────────────────▼────────────────────┐      │
│           │     PrivacyLayer (FHE Utilities)         │      │
│           │  - Encrypted address processing         │      │
│           │  - Location comparison                  │      │
│           │  - Permission management                │      │
│           │  - Amount verification                  │      │
│           └──────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
         │
         │ Decryption Requests
         │
┌────────▼────────────────────────────────────────────────────┐
│           Decryption Relayer (Zama FHE Service)              │
│            Returns decrypted results to authorized parties   │
└─────────────────────────────────────────────────────────────┘
```

## Core Contracts

### 1. DeliveryManager Contract

**Purpose**: Manages the complete delivery lifecycle from request creation to completion.

**Key Responsibilities**:
- Create and store encrypted delivery requests
- Match couriers to deliveries based on encrypted preferences
- Track delivery status through completion
- Handle delivery confirmation and proof

**Key Data Structures**:

```solidity
struct DeliveryRequest {
    bytes32 requestId;
    euint64 encryptedRecipientAddress;  // Encrypted address (FHE)
    euint32 encryptedDeliveryFee;       // Encrypted payment amount
    euint64 encryptedPickupLocation;    // Encrypted location
    euint64 encryptedDeliveryLocation;  // Encrypted destination
    address requester;
    uint256 createdAt;
    DeliveryStatus status;
    address assignedCourier;
}

enum DeliveryStatus {
    PENDING,
    ACCEPTED,
    IN_TRANSIT,
    COMPLETED,
    CANCELLED
}
```

**Key Functions**:

```solidity
// Create a new delivery request with encrypted data
function createDeliveryRequest(
    externalEuint64 encryptedRecipient,
    bytes calldata inputProof,
    externalEuint32 encryptedFee,
    bytes calldata feeProof,
    externalEuint64 pickupLoc,
    bytes calldata pickupProof,
    externalEuint64 deliveryLoc,
    bytes calldata deliveryProof
) external returns (bytes32 requestId)

// Accept a delivery based on courier's location preferences
function acceptDelivery(
    bytes32 requestId,
    externalEuint64 courierLocation,
    bytes calldata locationProof
) external returns (bool)

// Confirm delivery completion
function completeDelivery(
    bytes32 requestId,
    bytes calldata completionProof
) external returns (bool)

// Get delivery status (no sensitive data revealed)
function getDeliveryStatus(bytes32 requestId)
    external
    view
    returns (DeliveryStatus)
```

**FHE Patterns Used**:
- **Encryption Binding**: All addresses and amounts encrypted for specific contract/user pairs
- **Permission System**: Uses `FHE.allowThis()` for contract access, `FHE.allow()` for user access
- **Handle Management**: Encrypted values referenced by handles, not exposed directly

### 2. PaymentProcessor Contract

**Purpose**: Handles all payment operations with complete privacy protection.

**Key Responsibilities**:
- Process encrypted payment amounts
- Hold payments in escrow during delivery
- Distribute payments upon completion
- Handle refunds and disputes
- Support multiple currency operations

**Key Data Structures**:

```solidity
struct Payment {
    bytes32 paymentId;
    bytes32 deliveryId;
    euint32 encryptedAmount;            // Encrypted payment amount
    euint32 encryptedPlatformFee;       // Encrypted fee calculation
    PaymentStatus status;
    address payer;
    address payee;
    uint256 createdAt;
    uint256 completedAt;
}

enum PaymentStatus {
    PENDING,
    ESCROW,
    COMPLETED,
    REFUNDED,
    DISPUTED
}
```

**Key Functions**:

```solidity
// Create a payment with encrypted amount
function createPayment(
    bytes32 deliveryId,
    externalEuint32 amount,
    bytes calldata amountProof,
    address payee
) external payable returns (bytes32 paymentId)

// Move payment to escrow
function escrowPayment(bytes32 paymentId) external returns (bool)

// Complete payment transfer
function completePayment(bytes32 paymentId) external returns (bool)

// Refund payment with encrypted amount
function refundPayment(
    bytes32 paymentId,
    externalEuint32 refundAmount,
    bytes calldata refundProof
) external returns (bool)

// Get payment status
function getPaymentStatus(bytes32 paymentId)
    external
    view
    returns (PaymentStatus)
```

**FHE Patterns Used**:
- **Arithmetic Operations**: `FHE.add()`, `FHE.sub()` for fee calculations on encrypted amounts
- **Comparisons**: `FHE.le()` for validating amounts
- **Conditional Logic**: `FHE.cmux()` for conditional payment routing

### 3. ReputationTracker Contract

**Purpose**: Maintains anonymous reputation scores for network participants.

**Key Responsibilities**:
- Record encrypted ratings for deliveries
- Calculate reputation scores on encrypted data
- Prevent reputation manipulation
- Provide reputation information without revealing identity

**Key Data Structures**:

```solidity
struct ReputationRecord {
    address participant;
    euint32 totalRating;                // Encrypted cumulative rating
    euint32 ratingCount;                // Encrypted number of ratings
    uint256 lastUpdated;
}

struct Rating {
    bytes32 deliveryId;
    euint8 encryptedScore;              // Encrypted 1-5 score
    euint64 encryptedComment;           // Encrypted review data
    address rater;
    uint256 timestamp;
}
```

**Key Functions**:

```solidity
// Submit encrypted rating for a delivery
function submitRating(
    bytes32 deliveryId,
    address ratedParticipant,
    externalEuint8 score,
    bytes calldata scoreProof,
    externalEuint64 comment,
    bytes calldata commentProof
) external returns (bool)

// Get encrypted reputation score
function getReputationScore(address participant)
    external
    view
    returns (euint32)

// Calculate average rating on encrypted data
function getAverageRating(address participant)
    external
    returns (euint8)

// Check if user meets minimum reputation
function meetsMinimumReputation(
    address participant,
    externalEuint32 minimumScore,
    bytes calldata proof
) external view returns (bool)
```

**FHE Patterns Used**:
- **Accumulation**: Adding encrypted ratings to totals
- **Division**: Calculating average on encrypted data
- **Comparison**: Checking if ratings meet minimums
- **Privacy**: Maintaining anonymous participant records

### 4. PrivacyLayer Contract (Utility Library)

**Purpose**: Provides reusable FHE utility functions for privacy operations.

**Key Functions**:

```solidity
// Address comparison on encrypted data
function addressesMatch(
    euint64 address1,
    euint64 address2
) internal pure returns (ebool)

// Location proximity check (for delivery matching)
function locationsNear(
    euint64 courierLocation,
    euint64 deliveryLocation,
    euint32 maxDistance
) internal pure returns (ebool)

// Payment amount validation
function validateAmount(
    euint32 amount,
    euint32 minAmount,
    euint32 maxAmount
) internal pure returns (ebool)

// Set up permissions for encrypted values
function setupPermissions(
    euint32 encryptedValue
) internal

// Verify proof and decrypt for authorized user
function verifyAndDecrypt(
    externalEuint32 externalValue,
    bytes calldata proof
) internal view returns (euint32)
```

## Data Flow Examples

### Complete Delivery Workflow

```
1. Sender creates delivery request
   ├─ Encrypts recipient address → stored encrypted
   ├─ Encrypts delivery fee → stored encrypted
   ├─ Encrypts locations → stored encrypted
   └─ Request stored on-chain

2. Courier searches for deliveries
   ├─ Views available deliveries (no sensitive data)
   ├─ Provides encrypted location preference
   └─ Smart contract matches on encrypted data

3. Courier accepts delivery
   ├─ Contract verifies location match (on encrypted data)
   ├─ Payment moved to escrow
   └─ Courier receives handle reference only

4. Courier completes delivery
   ├─ Submits completion proof
   ├─ Payment transferred from escrow
   └─ Reputation updated

5. Both parties rate each other
   ├─ Encrypted ratings stored
   ├─ Reputation scores updated (on encrypted data)
   └─ No party sees other's identity data
```

### Permission Flow

```
User Encrypts Value
       │
       ├─ Creates encrypted input (bound to contract + user)
       ├─ Generates input proof
       └─ Calls smart contract function

Smart Contract Receives Call
       │
       ├─ Converts external encrypted value to internal
       ├─ Calls FHE.allowThis(value) ← Contract permission
       ├─ Calls FHE.allow(value, user) ← User permission
       ├─ Performs computations on encrypted data
       └─ Stores result encrypted

User or Contract Decrypts
       │
       ├─ Only parties with FHE.allow() permission
       ├─ Requests decryption from relayer
       ├─ Relayer returns decrypted value
       └─ Value available to authorized party only
```

## Security Considerations

### 1. Input Validation
- All encrypted inputs require valid proofs
- Proofs verify correct encryption and signer
- Rejected if proof validation fails

### 2. Permission Management
- **Contract Permission** (`FHE.allowThis()`): Enables contract to compute on encrypted value
- **User Permission** (`FHE.allow()`): Enables user to decrypt values
- Both required for full functionality

### 3. Handle Lifecycle
- Handles are temporary references to encrypted values
- Never expose actual encrypted data
- Handles become invalid after certain operations
- Proper handle management prevents information leakage

### 4. Privacy Isolation
- Each user-contract pair has isolated encryption context
- Cannot share encrypted values across different binding contexts
- Ensures delivery information remains isolated per party

## Integration Points

### Client Applications
- Submit encrypted data using FHEVM client SDK
- Receive handles for encrypted values
- Request decryption of authorized values

### Decryption Relayer
- Verifies user authorization
- Decrypts values when requested
- Returns plaintext only to authorized parties

### External Smart Contracts
- Can integrate with payment tokens (ERC20)
- Can leverage reputation in access control
- Can hook into delivery completion events

## Upgrading and Maintenance

### When Updating FHEVM Library
1. Update `@fhevm/solidity` version
2. Test all encrypted type operations
3. Verify permission handling still works
4. Update contract imports if needed
5. Regenerate and test all contracts

### Adding New Features
1. Add contract in appropriate category
2. Include comprehensive tests
3. Update PrivacyLayer with new utilities
4. Generate documentation
5. Test with existing contracts

### Version Management
- Maintain backward compatibility where possible
- Clear documentation for breaking changes
- Migration guide for updates
- Archive previous versions for reference

---

**Privacy Through Architecture**
