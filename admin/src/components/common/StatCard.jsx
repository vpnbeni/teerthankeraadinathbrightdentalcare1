import React from "react";
import { motion } from "framer-motion";

/**
 * Reusable StatCard component for displaying statistics
 * Responsive: Compact on mobile, full-featured on desktop
 * @param {Object} props
 * @param {string|number} props.value - The main value to display
 * @param {string} props.label - The label/description for the stat
 * @param {React.Component} props.icon - Heroicon component to display
 * @param {string} props.iconColor - Gradient color classes for icon (e.g., "from-blue-500 to-cyan-500")
 * @param {string} props.hoverColor - Hover shadow color (e.g., "blue-200")
 * @param {string} props.bgGradient - Background gradient on hover (e.g., "from-blue-50/50 to-cyan-50/50")
 * @param {string} props.badge - Optional badge text
 * @param {string} props.badgeColor - Badge color classes (e.g., "bg-blue-100 text-blue-700")
 * @param {number} props.change - Optional percentage change value
 * @param {Object} props.variants - Optional framer-motion variants
 */
const StatCard = ({
  value,
  label,
  icon: Icon,
  iconColor = "from-blue-500 to-cyan-500",
  hoverColor = "blue-200",
  bgGradient = "from-blue-50/50 to-cyan-50/50",
  badge,
  badgeColor = "bg-blue-100 text-blue-700",
  change,
  variants,
}) => {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl lg:rounded-3xl p-3 md:p-5 lg:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-${hoverColor}/30 transition-all duration-300`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} rounded-xl md:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2 md:mb-4 lg:mb-6">
          <div className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${iconColor} rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-${iconColor.split(' ')[0].replace('from-', '')}/25`}>
            <Icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          {badge && (
            <div className={`px-1.5 py-0.5 md:px-2 md:py-0.5 lg:px-3 lg:py-1 ${badgeColor} text-[9px] md:text-[10px] lg:text-xs font-semibold rounded-full`}>
              {badge}
            </div>
          )}
          {change !== undefined && change !== 0 && (
            <div className={`px-1.5 py-0.5 md:px-2 md:py-0.5 lg:px-3 lg:py-1 ${change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-[9px] md:text-[10px] lg:text-xs font-semibold rounded-full`}>
              {change > 0 ? "+" : ""}{change}%
            </div>
          )}
        </div>
        <div className="text-xl md:text-3xl lg:text-5xl font-bold text-gray-900 mb-0.5 md:mb-1 lg:mb-2 tracking-tight">
          {value}
        </div>
        <p className="text-gray-600 font-medium text-[10px] md:text-xs lg:text-sm">{label}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
