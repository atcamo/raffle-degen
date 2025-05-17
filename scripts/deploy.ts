const { ethers } = require("hardhat");

async function main() {
  const DEGEN_TOKEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"; // DEGEN token on Base

  console.log("Deploying RaffleDegen contract...");

  const RaffleDegen = await ethers.getContractFactory("RaffleDegen");
  const raffleDegen = await RaffleDegen.deploy(DEGEN_TOKEN_ADDRESS);

  await raffleDegen.waitForDeployment();

  console.log("RaffleDegen deployed to:", await raffleDegen.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 