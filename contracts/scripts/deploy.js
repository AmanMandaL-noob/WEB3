const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy Token A (USDC equivalent)
  console.log("\nDeploying Token A (USDC)...");
  const TokenA = await hre.ethers.getContractFactory("MockToken");
  const tokenA = await TokenA.deploy(
    "USD Coin",
    "USDC",
    6,
    hre.ethers.utils.parseUnits("1000000", 6) // 1M tokens
  );
  await tokenA.deployed();
  console.log("Token A deployed to:", tokenA.address);
  
  // Deploy Token B (DAI equivalent)
  console.log("\nDeploying Token B (DAI)...");
  const TokenB = await hre.ethers.getContractFactory("MockToken");
  const tokenB = await TokenB.deploy(
    "Dai Stablecoin",
    "DAI",
    18,
    hre.ethers.utils.parseEther("1000000") // 1M tokens
  );
  await tokenB.deployed();
  console.log("Token B deployed to:", tokenB.address);
  
  // Deploy Third Token (WETH equivalent)
  console.log("\nDeploying Token C (WETH)...");
  const TokenC = await hre.ethers.getContractFactory("MockToken");
  const tokenC = await TokenC.deploy(
    "Wrapped Ether",
    "WETH",
    18,
    hre.ethers.utils.parseEther("100") // 100 tokens
  );
  await tokenC.deployed();
  console.log("Token C deployed to:", tokenC.address);
  
  // Deploy DEX Pool (USDC/DAI)
  console.log("\nDeploying DEX Pool (USDC/DAI)...");
  const DexPool = await hre.ethers.getContractFactory("DexPool");
  const poolAB = await DexPool.deploy(
    tokenA.address,
    tokenB.address,
    "USDC-DAI LP",
    "USDC-DAI"
  );
  await poolAB.deployed();
  console.log("Pool AB deployed to:", poolAB.address);
  
  // Deploy DEX Pool (DAI/WETH)
  console.log("\nDeploying DEX Pool (DAI/WETH)...");
  const poolBC = await DexPool.deploy(
    tokenB.address,
    tokenC.address,
    "DAI-WETH LP",
    "DAI-WETH"
  );
  await poolBC.deployed();
  console.log("Pool BC deployed to:", poolBC.address);
  
  // Deploy DEX Operator
  console.log("\nDeploying DEX Operator...");
  const DexOperator = await hre.ethers.getContractFactory("DexOperator");
  const operator = await DexOperator.deploy();
  await operator.deployed();
  console.log("Operator deployed to:", operator.address);
  
  // Setup initial liquidity
  console.log("\nSetting up initial liquidity...");
  
  // Approve tokens for pool AB
  await tokenA.approve(poolAB.address, hre.ethers.utils.parseUnits("100000", 6));
  await tokenB.approve(poolAB.address, hre.ethers.utils.parseEther("100000"));
  
  // Add liquidity to pool AB (1:1 ratio for simplicity)
  await poolAB.addLiquidity(
    hre.ethers.utils.parseUnits("100000", 6),
    hre.ethers.utils.parseEther("100000"),
    0
  );
  console.log("Added initial liquidity to USDC/DAI pool");
  
  // Approve tokens for pool BC
  await tokenB.approve(poolBC.address, hre.ethers.utils.parseEther("100000"));
  await tokenC.approve(poolBC.address, hre.ethers.utils.parseEther("50"));
  
  // Add liquidity to pool BC
  await poolBC.addLiquidity(
    hre.ethers.utils.parseEther("100000"),
    hre.ethers.utils.parseEther("50"),
    0
  );
  console.log("Added initial liquidity to DAI/WETH pool");
  
  // Log deployment addresses
  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("Token A (USDC):", tokenA.address);
  console.log("Token B (DAI):", tokenB.address);
  console.log("Token C (WETH):", tokenC.address);
  console.log("Pool AB (USDC/DAI):", poolAB.address);
  console.log("Pool BC (DAI/WETH):", poolBC.address);
  console.log("Operator:", operator.address);
  console.log("========================================\n");
  
  // Save addresses to file
  const addresses = {
    tokenA: tokenA.address,
    tokenB: tokenB.address,
    tokenC: tokenC.address,
    poolAB: poolAB.address,
    poolBC: poolBC.address,
    operator: operator.address,
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    "./deploymentAddresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("Deployment addresses saved to deploymentAddresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
