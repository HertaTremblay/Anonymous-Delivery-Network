import { ethers } from "hardhat";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("       Anonymous Delivery Network - Contract Deployment");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH\n");

  // ═══════════════════════════════════════════════════════════════════
  // Step 1: Deploy PrivacyLayerContract
  // ═══════════════════════════════════════════════════════════════════
  console.log("1️⃣  Deploying PrivacyLayerContract...");
  const PrivacyLayerFactory = await ethers.getContractFactory(
    "PrivacyLayerContract"
  );
  const privacyLayer = await PrivacyLayerFactory.deploy();
  await privacyLayer.deployed();
  console.log("✅ PrivacyLayerContract deployed at:", privacyLayer.address);
  console.log("   (Gas used: estimated)\n");

  // ═══════════════════════════════════════════════════════════════════
  // Step 2: Deploy DeliveryManager
  // ═══════════════════════════════════════════════════════════════════
  console.log("2️⃣  Deploying DeliveryManager...");
  const DeliveryManagerFactory = await ethers.getContractFactory(
    "DeliveryManager"
  );
  const deliveryManager = await DeliveryManagerFactory.deploy();
  await deliveryManager.deployed();
  console.log("✅ DeliveryManager deployed at:", deliveryManager.address);
  console.log("   Features:");
  console.log("   • Create encrypted delivery requests");
  console.log("   • Accept deliveries with location matching");
  console.log("   • Complete and cancel deliveries");
  console.log("   • Track delivery status\n");

  // ═══════════════════════════════════════════════════════════════════
  // Step 3: Deploy PaymentProcessor
  // ═══════════════════════════════════════════════════════════════════
  console.log("3️⃣  Deploying PaymentProcessor...");
  const PaymentProcessorFactory = await ethers.getContractFactory(
    "PaymentProcessor"
  );
  const paymentProcessor = await PaymentProcessorFactory.deploy();
  await paymentProcessor.deployed();
  console.log("✅ PaymentProcessor deployed at:", paymentProcessor.address);
  console.log("   Features:");
  console.log("   • Create encrypted payments");
  console.log("   • Escrow management");
  console.log("   • Payment completion and refunds");
  console.log("   • 2% platform fee collection\n");

  // ═══════════════════════════════════════════════════════════════════
  // Step 4: Deploy ReputationTracker
  // ═══════════════════════════════════════════════════════════════════
  console.log("4️⃣  Deploying ReputationTracker...");
  const ReputationTrackerFactory = await ethers.getContractFactory(
    "ReputationTracker"
  );
  const reputationTracker = await ReputationTrackerFactory.deploy();
  await reputationTracker.deployed();
  console.log("✅ ReputationTracker deployed at:", reputationTracker.address);
  console.log("   Features:");
  console.log("   • Submit encrypted ratings");
  console.log("   • Track reputation scores");
  console.log("   • Calculate average ratings");
  console.log("   • Maintain participant reputation\n");

  // ═══════════════════════════════════════════════════════════════════
  // Verification and Summary
  // ═══════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✨ Deployment Complete!\n");

  console.log("📋 Deployed Contract Addresses:");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("PrivacyLayerContract:", privacyLayer.address);
  console.log("DeliveryManager:      ", deliveryManager.address);
  console.log("PaymentProcessor:     ", paymentProcessor.address);
  console.log("ReputationTracker:    ", reputationTracker.address);
  console.log("───────────────────────────────────────────────────────────────\n");

  // ═══════════════════════════════════════════════════════════════════
  // Verify Contracts are Functional
  // ═══════════════════════════════════════════════════════════════════
  console.log("🔍 Verifying contract functionality...\n");

  try {
    // Test DeliveryManager
    const deliveryCount = await deliveryManager.getDeliveryCount();
    console.log("✅ DeliveryManager: getDeliveryCount() =", deliveryCount.toString());

    // Test PaymentProcessor
    const paymentCount = await paymentProcessor.getPaymentCount();
    console.log("✅ PaymentProcessor: getPaymentCount() =", paymentCount.toString());

    const platformFee = await paymentProcessor.getPlatformFee();
    console.log("✅ PaymentProcessor: getPlatformFee() =", platformFee.toString(), "%");

    // Test ReputationTracker
    const participantCount = await reputationTracker.getParticipantCount();
    console.log("✅ ReputationTracker: getParticipantCount() =", participantCount.toString());

    // Test PrivacyLayer
    const hashedAddr = await privacyLayer.hashAddress(deployer.address);
    console.log("✅ PrivacyLayerContract: hashAddress() =", hashedAddr.toString());
  } catch (error) {
    console.error("⚠️  Verification error:", error);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Save Deployment Info
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n📝 Next Steps:");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("1. Update .env.example with deployed contract addresses");
  console.log("2. Run integration tests to verify functionality");
  console.log("3. Verify contracts on block explorer (if applicable)");
  console.log("4. Deploy to Sepolia testnet for public testing");
  console.log("───────────────────────────────────────────────────────────────\n");

  // Save addresses to file for reference
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "hardhat",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PrivacyLayerContract: privacyLayer.address,
      DeliveryManager: deliveryManager.address,
      PaymentProcessor: paymentProcessor.address,
      ReputationTracker: reputationTracker.address,
    },
  };

  console.log("📄 Deployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✨ Deployment successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
