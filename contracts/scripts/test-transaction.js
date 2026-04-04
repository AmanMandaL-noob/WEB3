const hre = require("hardhat");

/**
 * Test script to generate transactions for MEV bot to attack
 * This simulates a user swap that the bot will try to sandwich
 */
async function main() {
  console.log("🧪 Test Transaction Generator");
  console.log("Generated transaction will be visible to MEV bot\n");

  const [deployer, attacker, user] = await hre.ethers.getSigners();

  // Load deployment addresses
  let addresses = require("../deploymentAddresses.json");

  // Get contract instances
  const tokenA = await hre.ethers.getContractAt(
    "MockToken",
    addresses.tokenA
  );
  const poolAB = await hre.ethers.getContractAt(
    "DexPool",
    addresses.poolAB
  );

  console.log("📍 Contracts loaded:");
  console.log(`   Token A: ${addresses.tokenA}`);
  console.log(`   Pool AB: ${addresses.poolAB}\n`);

  // Give user some tokens to swap
  console.log("💰 Funding user account...");
  await tokenA.mint(user.address, hre.ethers.utils.parseUnits("1000", 6));
  console.log(`✅ User funded with 1000 tokens\n`);

  // Approve pool to spend tokens
  console.log("🔐 Approving token spending...");
  await tokenA.connect(user).approve(
    poolAB.address,
    hre.ethers.utils.parseUnits("100", 6)
  );
  console.log("✅ Token approved\n");

  // Execute swap - BOT WILL ATTACK THIS!
  console.log("🔄 Executing swap (BOT WILL ATTACK THIS!)...");
  try {
    const tx = await poolAB
      .connect(user)
      .swap(
        hre.ethers.utils.parseUnits("100", 6),
        0,
        tokenA.address,
        {
          gasPrice: hre.ethers.utils.parseUnits("30", "gwei"),
        }
      );

    console.log(`📤 Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    console.log("═".repeat(50));
    console.log("🎯 If MEV bot is running, it should have:");
    console.log("   1. Detected the pending transaction");
    console.log("   2. Executed a front-run swap");
    console.log("   3. Waited for your transaction");
    console.log("   4. Executed a back-run swap");
    console.log("   5. Calculated profit");
    console.log("═".repeat(50));

  } catch (error) {
    console.error("❌ Transaction failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
