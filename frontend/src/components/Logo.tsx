import React from "react";

type LogoProps = {
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <span className="font-bold text-lg">StockCount</span>
    </div>
  );
};

export default Logo;
