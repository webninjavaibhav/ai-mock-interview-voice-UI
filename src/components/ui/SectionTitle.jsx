import React from "react";

export const SectionTitle = ({
  children,
  subtitle,
  size = "md",
  className = "",
  icon: Icon,
}) => {
  const sizeStyles = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-gray-600" size={size === "sm" ? 16 : 20} />}
        <h2 className={`font-bold text-gray-800 ${sizeStyles[size]}`}>
          {children}
        </h2>
      </div>
      {subtitle && (
        <p className="text-gray-600 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const Label = ({
  children,
  required = false,
  className = "",
  size = "sm",
}) => {
  const sizeStyles = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
  };

  return (
    <label className={`block font-semibold text-gray-800 ${sizeStyles[size]} ${className}`}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};