import React from "react";

export const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    "font-semibold rounded-lg flex items-center justify-center gap-2";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:scale-105 transform disabled:opacity-50",
    danger:
      "bg-red-500 text-white hover:bg-red-600 hover:scale-105 transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
    neutral:
      "bg-gray-800 text-white hover:bg-gray-900 hover:scale-105 transform shadow-lg",
    ghost:
      "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105 transform",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />}
      {children}
    </button>
  );
};