import React from "react";
import { motion } from "framer-motion";

/**
 * Mobile-optimized StatCard component for horizontal scrolling
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
const MobileStatCard = ({
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
      className={`flex-shrink-0 w-32 md:w-auto md:flex-1 group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl p-4 md:p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-${hoverColor}/30 transition-all duration-300`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <div className="relative">
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-2 md:gap-0 mb-3 md:mb-6">
          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${iconColor} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-${iconColor.split(' ')[0].replace('from-', '')}/25`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          {badge && (
            <div className={`px-2 py-0.5 md:px-3 md:py-1 ${badgeColor} text-[10px] md:text-xs font-semibold rounded-full`}>
              {badge}
            </div>
          )}
        </div>
        <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight text-center md:text-left">
          {value}
        </div>
        <p className="text-gray-600 font-medium text-[10px] md:text-sm text-center md:text-left leading-tight">{label}</p>
      </div>
    </motion.div>
  );
};

export default MobileStatCard;
