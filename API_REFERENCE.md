# API Reference

Complete reference for Anonymous Delivery Network smart contracts.

## DeliveryManager Contract

Core contract managing the delivery lifecycle.

### Functions

#### `createDeliveryRequest()`

Creates a new delivery request with encrypted data.

```solidity
function createDeliveryRequest(
    bytes calldata encryptedRecipient,
    bytes calldata recipientProof,
    bytes calldata encryptedPickupLocation,
    bytes calldata pickupProof,
    bytes calldata encryptedDeliveryLocation,
    bytes calldata deliveryProof
) external returns (bytes32 requestId)
```

**Parameters:**
- `encryptedRecipient`: External encrypted recipient address (FHE)
- `recipientProof`: ZK proof verifying recipient encryption
- `encryptedPickupLocation`: External encrypted pickup location
- `pickupProof`: ZK proof for pickup location
- `encryptedDeliveryLocation`: External encrypted delivery location
- `deliveryProof`: ZK proof for delivery location

**Returns:**
- `requestId`: Unique identifier for the delivery request

**Events Emitted:**
```solidity
event DeliveryRequested(
    bytes32 indexed requestId,
    address indexed requester,
    uint256 timestamp
)
```

**Example:**
```typescript
const encryptedRecipient = await fhevm.createEncryptedInput(
  deliveryManager.address,
  sender.address
);
encryptedRecipient.add64(recipientAddressHash);
const { handles: h1, inputProof: p1 } = await encryptedRecipient.encrypt();

const tx = await deliveryManager
  .connect(sender)
  .createDeliveryRequest(h1[0], p1, h1[0], p1, h1[0], p1);
```

---

#### `acceptDelivery()`

Accept a delivery based on courier location.

```solidity
function acceptDelivery(
    bytes32 requestId,
    bytes calldata courierLocation,
    bytes calldata locationProof
) external returns (bool success)
```

**Parameters:**
- `requestId`: ID of the delivery to accept
- `courierLocation`: External encrypted courier location
- `locationProof`: ZK proof for location encryption

**Returns:**
- `success`: True if delivery accepted

**Events Emitted:**
```solidity
event DeliveryAccepted(
    bytes32 indexed requestId,
    address indexed courier,
    uint256 timestamp
)
```

**Requirements:**
- Delivery must exist and be PENDING
- Caller cannot be the requester
- Location proof must be valid

---

#### `completeDelivery()`

Mark a delivery as completed.

```solidity
function completeDelivery(bytes32 requestId)
    external
    returns (bool success)
```

**Parameters:**
- `requestId`: ID of the delivery to complete

**Returns:**
- `success`: True if delivery completed

**Events Emitted:**
```solidity
event DeliveryCompleted(
    bytes32 indexed requestId,
    address indexed courier,
    uint256 timestamp
)
```

**Requirements:**
- Delivery must be ACCEPTED or IN_TRANSIT
- Only assigned courier can call

---

#### `cancelDelivery()`

Cancel a pending delivery.

```solidity
function cancelDelivery(bytes32 requestId)
    external
    returns (bool success)
```

**Parameters:**
- `requestId`: ID of the delivery to cancel

**Returns:**
- `success`: True if delivery cancelled

**Events Emitted:**
```solidity
event DeliveryCancelled(
    bytes32 indexed requestId,
    uint256 timestamp
)
```

**Requirements:**
- Only requester can cancel
- Delivery must be PENDING

---

### View Functions

#### `getDeliveryStatus()`

Get current status of a delivery.

```solidity
function getDeliveryStatus(bytes32 requestId)
    external
    view
    returns (DeliveryStatus status)
```

**Returns:**
- `status`: One of {PENDING, ACCEPTED, IN_TRANSIT, COMPLETED, CANCELLED}

---

#### `getDelivery()`

Get complete delivery information.

```solidity
function getDelivery(bytes32 requestId)
    external
    view
    returns (DeliveryRequest memory delivery)
```

**Returns:**
```solidity
struct DeliveryRequest {
    bytes32 requestId;
    address requester;
    address assignedCourier;
    uint256 createdAt;
    uint256 acceptedAt;
    uint256 completedAt;
    DeliveryStatus status;
}
```

---

#### `getDeliveryCount()`

Get total number of deliveries.

```solidity
function getDeliveryCount() external view returns (uint256 count)
```

---

#### `getUserDeliveries()`

Get all deliveries for a user.

```solidity
function getUserDeliveries(address user)
    external
    view
    returns (bytes32[] memory deliveryIds)
```

---

## PaymentProcessor Contract

Manages all payment operations.

### Functions

#### `createPayment()`

Create a payment for a delivery.

```solidity
function createPayment(
    bytes32 deliveryId,
    bytes calldata encryptedAmount,
    bytes calldata amountProof,
    address payee
) external payable returns (bytes32 paymentId)
```

**Parameters:**
- `deliveryId`: Associated delivery ID
- `encryptedAmount`: External encrypted payment amount
- `amountProof`: ZK proof for amount
- `payee`: Courier address

**Returns:**
- `paymentId`: Unique payment identifier

**Events Emitted:**
```solidity
event PaymentCreated(
    bytes32 indexed paymentId,
    bytes32 indexed deliveryId,
    address indexed payer,
    address payee,
    uint256 timestamp
)
```

**Requirements:**
- `msg.value` >= MINIMUM_PAYMENT (0.001 ETH)
- `msg.value` <= MAXIMUM_PAYMENT (1000 ETH)
- Payee != address(0)
- Payee != caller

---

#### `escrowPayment()`

Move payment to escrow.

```solidity
function escrowPayment(bytes32 paymentId)
    external
    returns (bool success)
```

---

#### `completePayment()`

Release payment from escrow.

```solidity
function completePayment(bytes32 paymentId)
    external
    returns (bool success)
```

**Events Emitted:**
```solidity
event PaymentCompleted(
    bytes32 indexed paymentId,
    address indexed payee,
    uint256 amount,
    uint256 timestamp
)
```

**Note:** Fee (2%) is retained by platform, rest goes to payee.

---

#### `refundPayment()`

Refund a payment.

```solidity
function refundPayment(
    bytes32 paymentId,
    bytes calldata encryptedAmount,
    bytes calldata amountProof
) external returns (bool success)
```

---

### View Functions

#### `getPaymentStatus()`

```solidity
function getPaymentStatus(bytes32 paymentId)
    external
    view
    returns (PaymentStatus status)
```

**Status Values:** {PENDING, ESCROW, COMPLETED, REFUNDED, DISPUTED}

---

#### `getPayment()`

```solidity
function getPayment(bytes32 paymentId)
    external
    view
    returns (Payment memory payment)
```

---

#### `getPaymentCount()`

```solidity
function getPaymentCount() external view returns (uint256 count)
```

---

#### `getUserPayments()`

```solidity
function getUserPayments(address user)
    external
    view
    returns (bytes32[] memory paymentIds)
```

---

#### `getPlatformFee()`

```solidity
function getPlatformFee() external pure returns (uint256 feePercentage)
```

**Returns:** 2 (representing 2%)

---

## ReputationTracker Contract

Manages participant reputation.

### Functions

#### `submitRating()`

Submit an encrypted rating.

```solidity
function submitRating(
    bytes32 deliveryId,
    address ratedParticipant,
    bytes calldata encryptedScore,
    bytes calldata scoreProof,
    bytes calldata encryptedComment,
    bytes calldata commentProof
) external returns (bool success)
```

**Parameters:**
- `deliveryId`: Associated delivery
- `ratedParticipant`: Participant being rated
- `encryptedScore`: Encrypted rating (1-5)
- `scoreProof`: ZK proof for score
- `encryptedComment`: Encrypted comment/review
- `commentProof`: ZK proof for comment

**Returns:**
- `success`: True if rating submitted

**Events Emitted:**
```solidity
event RatingSubmitted(
    bytes32 indexed deliveryId,
    address indexed ratedParticipant,
    address indexed rater,
    uint256 timestamp
)
```

**Requirements:**
- Caller != ratedParticipant (no self-rating)
- No duplicate ratings for same delivery
- Valid proofs required

---

### View Functions

#### `getReputationScore()`

Get total reputation points.

```solidity
function getReputationScore(address participant)
    external
    view
    returns (uint256 score)
```

---

#### `getAverageRating()`

Get average rating (1-5 scale).

```solidity
function getAverageRating(address participant)
    external
    view
    returns (uint8 average)
```

---

#### `getRatingCount()`

Get number of ratings received.

```solidity
function getRatingCount(address participant)
    external
    view
    returns (uint256 count)
```

---

#### `meetsMinimumReputation()`

Check if participant meets minimum reputation.

```solidity
function meetsMinimumReputation(
    address participant,
    bytes calldata minimumScore,
    bytes calldata proof
) external view returns (bool meetsRequirement)
```

---

#### `getReputation()`

Get complete reputation record.

```solidity
function getReputation(address participant)
    external
    view
    returns (ReputationRecord memory reputation)
```

```solidity
struct ReputationRecord {
    address participant;
    uint256 totalRating;
    uint256 ratingCount;
    uint256 lastUpdated;
}
```

---

#### `getParticipants()`

Get all rated participants.

```solidity
function getParticipants()
    external
    view
    returns (address[] memory allParticipants)
```

---

## PrivacyLayerContract

Utility functions for privacy operations.

### Functions

#### `addressesMatch()`

Compare addresses (FHE-conceptual).

```solidity
function addressesMatch(uint64 addr1, uint64 addr2)
    external
    pure
    returns (bool)
```

---

#### `locationsNear()`

Check location proximity.

```solidity
function locationsNear(
    uint64 loc1,
    uint64 loc2,
    uint32 maxDist
) external pure returns (bool)
```

---

#### `validateAmount()`

Validate amount in range.

```solidity
function validateAmount(
    uint256 amount,
    uint256 minAmount,
    uint256 maxAmount
) external pure returns (bool)
```

---

#### `hashAddress()`

Hash address for operations.

```solidity
function hashAddress(address addr)
    external
    pure
    returns (uint64)
```

---

#### `encodeLocation()`

Encode location pair.

```solidity
function encodeLocation(uint32 lat, uint32 lon)
    external
    pure
    returns (uint64)
```

---

#### `decodeLocation()`

Decode location pair.

```solidity
function decodeLocation(uint64 encoded)
    external
    pure
    returns (uint32, uint32)
```

---

## Error Handling

### Custom Errors

```solidity
// DeliveryManager
error DeliveryNotFound(bytes32 requestId);
error InvalidDeliveryStatus();
error UnauthorizedAccess(address user);
error InvalidProof();
error LocationMismatch();

// PaymentProcessor
error PaymentNotFound(bytes32 paymentId);
error InvalidPaymentAmount();
error InsufficientFunds();
error PaymentAlreadyProcessed(bytes32 paymentId);

// ReputationTracker
error ParticipantNotFound(address participant);
error InvalidRating();
error DuplicateRating(bytes32 deliveryId);

// General
error ZeroAddress();
error InvalidInput();
error PermissionDenied();
```

---

## Constants

### DeliveryManager
- `MAX_DISTANCE = 100` - Maximum delivery distance
- `MIN_COURIER_REPUTATION = 50` - Minimum reputation score

### PaymentProcessor
- `PLATFORM_FEE_PERCENT = 2` - Platform fee (2%)
- `MINIMUM_PAYMENT = 1000` - Minimum payment (0.001 ETH in wei)
- `MAXIMUM_PAYMENT = 1000 ether` - Maximum payment

### ReputationTracker
- `MIN_RATING = 1` - Minimum rating score
- `MAX_RATING = 5` - Maximum rating score

---

## Enumerations

### DeliveryStatus
```solidity
enum DeliveryStatus {
    PENDING,     // 0 - Awaiting courier acceptance
    ACCEPTED,    // 1 - Accepted by courier
    IN_TRANSIT,  // 2 - Being delivered
    COMPLETED,   // 3 - Successfully delivered
    CANCELLED    // 4 - Cancelled
}
```

### PaymentStatus
```solidity
enum PaymentStatus {
    PENDING,    // 0 - Created
    ESCROW,     // 1 - Held in escrow
    COMPLETED,  // 2 - Released to payee
    REFUNDED,   // 3 - Refunded to payer
    DISPUTED    // 4 - Under dispute
}
```

---

## Integration Example

Complete workflow example:

```typescript
// 1. Create encrypted delivery
const deliveryTx = await deliveryManager
  .connect(sender)
  .createDeliveryRequest(
    encryptedRecipient,
    recipientProof,
    encryptedPickup,
    pickupProof,
    encryptedDelivery,
    deliveryProof
  );

// 2. Courier accepts
const deliveryId = deliveryTx.requestId;
await deliveryManager
  .connect(courier)
  .acceptDelivery(deliveryId, encryptedLocation, locationProof);

// 3. Create payment
const paymentTx = await paymentProcessor
  .connect(sender)
  .createPayment(
    deliveryId,
    encryptedAmount,
    amountProof,
    courier.address,
    { value: ethers.parseEther("0.1") }
  );

// 4. Escrow and complete
const paymentId = paymentTx.paymentId;
await paymentProcessor.connect(sender).escrowPayment(paymentId);
await paymentProcessor.connect(sender).completePayment(paymentId);

// 5. Complete delivery
await deliveryManager.connect(courier).completeDelivery(deliveryId);

// 6. Rate each other
await reputationTracker
  .connect(sender)
  .submitRating(
    deliveryId,
    courier.address,
    encryptedRating,
    ratingProof,
    encryptedComment,
    commentProof
  );
```

---

## Gas Considerations

Approximate gas usage:

| Operation | Gas | Notes |
|-----------|-----|-------|
| createDeliveryRequest | 45,000 | Encrypted data storage |
| acceptDelivery | 35,000 | Location matching |
| completeDelivery | 28,000 | Status update |
| createPayment | 65,000 | Payment with escrow |
| completePayment | 42,000 | Transfer and fee |
| submitRating | 52,000 | Reputation update |

---

For more details, see:
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development patterns
- [FHE_CONCEPTS.md](FHE_CONCEPTS.md) - FHE explanation
