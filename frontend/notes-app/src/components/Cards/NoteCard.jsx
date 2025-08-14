import moment from "moment";
import React from "react";
import { MdOutlinePushPin } from "react-icons/md";
import { MdCreate, MdDelete } from "react-icons/md";

const NoteCard = ({
  title,
  date,
  content,
  tags,
  isPinned,
  onEdit,
  onDelete,
  onPinNote,
}) => {
  return (
    <div className="border rounded p-4 bg-white hover:shadow-xl transition-all ease-in-out">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div>
          <h6 className="text-sm font-medium">{title}</h6>
          <span className="text-xs text-slate-500">
          {moment.utc(date).local().format("DD MMM YYYY")}
</span>
        </div>

        {/* Pin Icon */}
        <MdOutlinePushPin
          className={`cursor-pointer text-xl transition-colors duration-200 ${
            isPinned
              ? "text-blue-500 hover:text-blue-600"
              : "text-gray-400 hover:text-blue-500"
          }`}
          onClick={onPinNote}
          title={isPinned ? "Unpin note" : "Pin note"}
        />
      </div>

      {/* Note content */}
      <p className="text-xs text-slate-600 mt-2">
        {content?.slice(0, 60)}
      </p>

      {/* Bottom Row */}
      <div className="flex items-center justify-between mt-3">
        {/* Tags */}
        <div className="text-xs text-slate-500">
          {tags.map((item) => `#${item} `)}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <MdCreate
            className="cursor-pointer hover:text-green-600 transition-colors"
            onClick={onEdit}
          />
          <MdDelete
            className="cursor-pointer hover:text-red-500 transition-colors"
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
