import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * VerifiedBadge — small inline checkmark for verified users.
 * Renders nothing if `verified` is falsy.
 */
const VerifiedBadge = ({ verified, size = 12, color = "#22d3ee", style }) => {
  if (!verified) return null;
  return (
    <View style={style}>
      <Ionicons name="checkmark-circle" size={size} color={color} />
    </View>
  );
};

export default VerifiedBadge;
