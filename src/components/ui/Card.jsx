import React from "react";

export const Card = ({
  children,
  className = "",
  variant = "default",
  padding = "md",
  ...props
}) => {
  const baseStyles = "rounded-lg";

  const variantStyles = {
    default: "bg-white shadow-lg border border-gray-100",
    elevated: "bg-white rounded-2xl shadow-2xl",
    gradient: "bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200",
    highlight: "bg-indigo-50 border border-indigo-200",
    info: "bg-blue-50 border border-blue-200",
  };

  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`mb-6 pb-4 border-b ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "" }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`mt-8 pt-6 border-t ${className}`}>
      {children}
    </div>
  );
};