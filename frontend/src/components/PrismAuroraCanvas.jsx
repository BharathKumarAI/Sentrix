import React from "react";

export function PrismAuroraCanvas({ runState = "idle" }) {
  // Map runState to dynamic style variables
  const getAuroraStyles = () => {
    switch (runState) {
      case "RUNNING":
        return {
          "--aurora-speed": "14s",
          "--aurora-opacity": "0.75",
        };
      case "AWAITING_APPROVAL":
        return {
          "--aurora-speed": "22s",
          "--aurora-opacity": "0.80",
        };
      default: // idle
        return {
          "--aurora-speed": "48s",
          "--aurora-opacity": "0.45",
        };
    }
  };

  return (
    <div className="aurora-container" aria-hidden="true" style={getAuroraStyles()}>
      <div className="aurora-mesh" />
    </div>
  );
}
