import React from "react";
import { motion } from "framer-motion";

/**
 * Compact StatCard component for smaller displays (like appointment management mobile view)
 * @param {Object} props
 * @param {string|number} props.value - The main value to display
 * @param {string} props.label - The label/description for the stat
 * @param {React.Component} props.icon - Heroicon component to display
 * @param {string} props.iconColor - Gradient color classes for icon
 * @param {string} props.hoverColor - Hover shadow color
 * @param {string} props.bgGradient - Background gradient on hover
 * @param {string} props.badge - Optional badge text
 * @param {string} props.badgeColor - Badge color classes
 * @param {Object} props.variants - Optional framer-motion variants
 */
const CompactStatCard = ({
  value,
  label,
  icon: Icon,
  iconColor = "from-blue-500 to-cyan-500",
  hoverColor = "blue-200",
  bgGradient = "from-blue-50/50 to-cyan-50/50",
  badge,
  badgeColor = "bg-blue-100 text-blue-700",
  variants,
}) => {
  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex-shrink-0 w-24 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-3xl p-2.5 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-${hoverColor}/30 transition-all duration-300`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} rounded-xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <div className="relative">
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-1.5 md:gap-0 mb-2 md:mb-6">
          <div className={`w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br ${iconColor} rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg shadow-${iconColor.split(' ')[0].replace('from-', '')}/25`}>
            <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          {badge && (
            <div className={`px-1.5 py-0.5 md:px-3 md:py-1 ${badgeColor} text-[9px] md:text-xs font-semibold rounded-full`}>
              {badge}
            </div>
          )}
        </div>
        <div className="text-2xl md:text-5xl font-bold text-gray-900 mb-0.5 md:mb-2 tracking-tight text-center md:text-left">
          {value}
        </div>
        <p className="text-gray-600 font-medium text-[9px] md:text-sm text-center md:text-left leading-tight">{label}</p>
      </div>
    </motion.div>
  );
};

export default CompactStatCard;
