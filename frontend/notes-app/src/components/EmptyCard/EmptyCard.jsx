import React from "react";

const EmptyCard = ({ imgSrc, message }) => {
  return (
    <div className="grid place-items-center text-center p-4 w-full min-h-[600px]">
      <div className="flex flex-col items-center">
        <img
          src={imgSrc}
          alt="No notes"
          className="w-60 mb-4 opacity-30"
          draggable="false"
        />
        <p className="text-gray-700 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default EmptyCard;
