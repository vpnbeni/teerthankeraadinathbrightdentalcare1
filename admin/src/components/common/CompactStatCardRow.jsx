import React from "react";
import { motion } from "framer-motion";

/**
 * Compact StatCard for row layout (like notifications page)
 * Displays 1 per row on mobile, 2 per row when 4 cards, 3 per row when 3 cards
 * @param {Object} props
 * @param {string|number} props.value - The main value to display
 * @param {string} props.label - The label/description for the stat
 * @param {React.Component} props.icon - Heroicon component to display
 * @param {string} props.iconColor - Gradient color classes for icon
 * @param {string} props.valueColor - Text color for value (optional)
 * @param {Object} props.variants - Optional framer-motion variants
 */
const CompactStatCardRow = ({
  value,
  label,
  icon: Icon,
  iconColor = "from-indigo-500 to-purple-600",
  valueColor = "text-gray-900",
  variants,
}) => {
  return (
    <motion.div
      variants={variants}
      className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${iconColor} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default CompactStatCardRow;
