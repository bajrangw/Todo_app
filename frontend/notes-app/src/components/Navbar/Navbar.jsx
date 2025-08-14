import React, { useState } from "react";
import Profileinfo from "../Cards/Profileinfo";
import { useNavigate, useLocation } from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar";

const Navbar = ({ userInfo, onSearchNote, handleClearSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const hideSearchAndUser = ["/login", "/signup"].includes(location.pathname);

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

const handleSearch = () => {
  if (searchQuery.trim()) {
    onSearchNote?.(searchQuery.trim());
  } else {
    handleClearSearch?.(); 
  }
};

const onClearSearch = () => {
  setSearchQuery("");
  handleClearSearch?.();
};

const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSearch();
  }
};



  return (
    <div className="bg-white flex items-center justify-between px-6 py-2 drop-shadow">
      <h2 className="text-xl font-medium text-black py-2">To do list</h2>

      {!hideSearchAndUser && (
        <>
          <SearchBar
          value={searchQuery}
          onChange={({ target }) => setSearchQuery(target.value)}
          handleSearch={handleSearch}
          onClearSearch={onClearSearch}
          onKeyDown={handleKeyDown}
/>
          <Profileinfo userInfo={userInfo} onLogout={onLogout} />
        </>
      )}
    </div>
  );
};

export default Navbar;
