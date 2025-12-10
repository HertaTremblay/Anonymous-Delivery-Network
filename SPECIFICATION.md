# Anonymous Delivery Network - Competition Specification

## Project Overview

The Anonymous Delivery Network is a privacy-preserving delivery platform built on blockchain technology using Fully Homomorphic Encryption (FHE). This project demonstrates how to build a decentralized delivery service where all sensitive information—including sender addresses, recipient information, package details, and payment data—remains encrypted throughout the entire transaction lifecycle.

## Challenge Objective

Build a comprehensive FHEVM-based example repository that demonstrates:

1. **Privacy-Preserving Smart Contracts** - Core contracts implementing FHE for delivery operations
2. **Encrypted Data Processing** - Handling encrypted addresses, locations, and payment information
3. **Anonymous User Interactions** - Enabling users to participate in the delivery network without revealing identity
4. **Automated Documentation** - Self-documenting code with clear examples
5. **Production-Ready Tests** - Comprehensive test suites covering both common use cases and edge cases

## Key Concepts to Demonstrate

### 1. Core Delivery Operations
- Creating encrypted delivery requests
- Accepting deliveries on encrypted location data
- Processing payments anonymously
- Tracking delivery status with privacy protection

### 2. FHE Implementation
- Using `@fhevm/solidity` library for encrypted operations
- Implementing permission systems with `FHE.allowThis()` and `FHE.allow()`
- Handling input proofs for encrypted values
- Working with encrypted data types (euint32, euint64, etc.)

### 3. Privacy Guarantees
- Maintaining encrypted addresses throughout the delivery lifecycle
- Ensuring couriers cannot see sensitive delivery details
- Protecting payment information from visibility
- Enabling reputation systems without identity disclosure

### 4. Smart Contract Architecture
- DeliveryManager - Core contract for delivery lifecycle
- PrivacyLayer - FHE implementation for encrypted operations
- PaymentProcessor - Handling anonymous payments
- ReputationTracker - Anonymous rating system

## Requirements

### 1. Smart Contracts

Create Solidity smart contracts demonstrating:

#### Primary Contracts
- **DeliveryManager.sol** - Manages the full delivery lifecycle
  - Create delivery requests with encrypted recipient information
  - Accept deliveries with encrypted location matching
  - Confirm delivery completion
  - Track delivery status

- **PaymentProcessor.sol** - Handles anonymous payments
  - Process encrypted payment amounts
  - Distribute payments to couriers upon completion
  - Handle refunds with privacy protection
  - Support multiple payment scenarios

- **ReputationTracker.sol** - Anonymous reputation system
  - Record ratings encrypted
  - Calculate reputation scores on encrypted data
  - Maintain anonymous reputation history
  - Prevent Sybil attacks

#### Supporting Contracts
- **PrivacyLayer.sol** - FHE utility functions
  - Encrypted address processing
  - Location comparison on encrypted data
  - Amount verification functions
  - Permission management helpers

### 2. Test Coverage

Comprehensive test suites in TypeScript demonstrating:

- **Success Cases**
  - ✅ Complete delivery workflow (request → accept → complete)
  - ✅ Payment processing with encrypted amounts
  - ✅ Rating and reputation updates
  - ✅ Multiple concurrent deliveries

- **Permission Handling**
  - ✅ Proper use of `FHE.allowThis()` for contract permissions
  - ✅ Proper use of `FHE.allow()` for user permissions
  - ✅ Permission requirements for decryption

- **Edge Cases**
  - ✅ Handling invalid encrypted inputs
  - ✅ Multiple users attempting the same delivery
  - ✅ Payment disputes and refund logic
  - ✅ Reputation calculation edge cases

- **Anti-Patterns** (What NOT to do)
  - ❌ Missing `FHE.allowThis()` in permission setup
  - ❌ Exposing encrypted values in view functions
  - ❌ Mismatched encryption signers
  - ❌ Incorrect handle lifecycle management

### 3. Documentation

Auto-generated documentation including:

- **Contract Documentation**
  - Purpose and architecture of each contract
  - Key functions with parameter explanations
  - Permission requirements
  - Common pitfalls and solutions

- **Usage Guides**
  - How to create a delivery request
  - How to accept and complete deliveries
  - How to process payments anonymously
  - How to maintain reputation

- **Concept Explanations**
  - FHE basics for delivery use case
  - Encryption binding in the platform
  - Input proof requirements
  - Handle lifecycle in payment processing

- **Quick References**
  - Code snippets for common operations
  - Function call sequences
  - Error handling patterns
  - Best practices checklist

### 4. Project Structure

```
anonymous-delivery/
├── contracts/
│   ├── DeliveryManager.sol
│   ├── PaymentProcessor.sol
│   ├── ReputationTracker.sol
│   ├── PrivacyLayer.sol
│   └── interfaces/
│       ├── IDeliveryManager.sol
│       └── IPaymentProcessor.sol
├── test/
│   ├── DeliveryManager.test.ts
│   ├── PaymentProcessor.test.ts
│   ├── ReputationTracker.test.ts
│   └── integration/
│       └── FullDeliveryWorkflow.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── USAGE_GUIDE.md
│   ├── CONCEPTS.md
│   └── API_REFERENCE.md
├── deploy/
│   └── deploy.ts
├── hardhat.config.ts
├── package.json
└── README.md
```

### 5. Code Quality Standards

- **Solidity**
  - Clear function names describing operations
  - Comprehensive inline comments
  - Error messages explaining failures
  - Security best practices
  - Follows OpenZeppelin style guidelines

- **TypeScript Tests**
  - Clear test descriptions
  - Organized test suites by feature
  - Both positive and negative test cases
  - Well-commented test setup
  - Error message validation

- **Documentation**
  - Auto-generated from code comments
  - Clear section organization
  - Code examples for all concepts
  - Visual diagrams for complex concepts
  - Links between related sections

## Evaluation Criteria

Submissions will be evaluated on:

1. **Code Quality** (25%)
   - Clean, readable, well-organized code
   - Proper error handling and validation
   - Security best practices

2. **Completeness** (25%)
   - All required contracts implemented
   - Comprehensive test coverage
   - All documentation generated

3. **Documentation Quality** (20%)
   - Clear explanations of concepts
   - Helpful examples and patterns
   - Easy to understand for new developers

4. **Innovation** (15%)
   - Creative use of FHE features
   - Advanced privacy patterns
   - Performance optimizations

5. **Maintainability** (15%)
   - Easy to update when dependencies change
   - Clear upgrade path
   - Well-documented change process

## Deliverables Checklist

- [ ] All smart contracts implemented and compiled
- [ ] Comprehensive test suite with >85% coverage
- [ ] Deployment scripts for test networks
- [ ] Auto-generated documentation in markdown
- [ ] README with setup and usage instructions
- [ ] Architecture diagram and explanation
- [ ] Example transactions and test outputs
- [ ] Developer guide for extending the project
- [ ] Demonstration video showing:
  - Setup and compilation
  - Running tests
  - Contract deployment
  - Example transactions
  - Documentation generation

## Timeline

- **Start Date**: December 1, 2025
- **Submission Deadline**: December 31, 2025 (23:59 AoE)
- **Evaluation Period**: January 1-10, 2026
- **Winners Announced**: January 15, 2026

## Prize Pool

Total Prize: $10,000 USD
- 1st Place: $5,000
- 2nd Place: $3,000
- 3rd Place: $1,500
- Community Choice: $500

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Example dApps](https://github.com/zama-ai/dapps)
- [OpenZeppelin Confidential Contracts](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts)

## Support

For questions and assistance:
- Join [Zama Community Forum](https://www.zama.ai/community)
- Connect on [Zama Discord](https://discord.com/invite/zama)
- Follow [@Zama on X](https://twitter.com/zama)

---

**Built with privacy in mind using FHEVM by Zama**
