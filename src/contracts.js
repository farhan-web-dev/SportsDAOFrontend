import governorAbiFile from "./abis/GovernerContract.json";

// Get governor address from environment variable
const governorAddress = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS;

if (!governorAddress) {
  console.warn(
    "⚠️ [contracts.js] NEXT_PUBLIC_GOVERNOR_ADDRESS is not set in environment variables"
  );
} else {
  console.log("✅ [contracts.js] Governor address loaded:", governorAddress);
}

// Extract ABI from the file
// If it's already an array (pure ABI), use it directly
// If it's an artifact with 'abi' property, extract the ABI
const governorAbi = Array.isArray(governorAbiFile)
  ? governorAbiFile
  : governorAbiFile.abi || governorAbiFile;

// Validate ABI structure
if (!Array.isArray(governorAbi)) {
  console.error("❌ [contracts.js] Invalid ABI structure - expected array");
} else {
  // Check if propose function exists
  const proposeFunction = governorAbi.find(
    (item) => item.type === "function" && item.name === "propose"
  );
  if (!proposeFunction) {
    console.error("❌ [contracts.js] 'propose' function not found in ABI");
  } else {
    console.log("✅ [contracts.js] 'propose' function found in ABI");
  }

  // Check if ProposalCreated event exists
  const proposalCreatedEvent = governorAbi.find(
    (item) => item.type === "event" && item.name === "ProposalCreated"
  );
  if (!proposalCreatedEvent) {
    console.error("❌ [contracts.js] 'ProposalCreated' event not found in ABI");
  } else {
    console.log("✅ [contracts.js] 'ProposalCreated' event found in ABI");
    // Verify proposalId is the first parameter
    const firstParam = proposalCreatedEvent.inputs?.[0];
    if (firstParam?.name === "proposalId" && firstParam?.type === "uint256") {
      console.log(
        "✅ [contracts.js] ProposalCreated event has proposalId as first parameter"
      );
    } else {
      console.warn(
        "⚠️ [contracts.js] ProposalCreated event structure may be different than expected"
      );
    }
  }
}

export const contracts = {
  governor: {
    address: governorAddress,
    abi: governorAbi,
  },
};

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const checkAdmin = async (address) => {
  try {
    const response = await fetch(`${BACKEND_URL}/is-admin/${address}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.isAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
