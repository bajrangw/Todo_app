import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import NoteCard from "../../components/Cards/NoteCard";
import { MdAdd } from "react-icons/md";
import AddEditNotes from "./AddEditNotes";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import axiosInstance from "../../utils/axiosInstance";
import Toast from "../../components/ToastMessage/Toast";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddNotesImg from "../../assets/images/add-notes.svg"; 
import NoDataImg from "../../assets/images/no-data.svg";
import { Navigate } from "react-router-dom";



const Home = () => {

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: "null",
  });

  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    message: "",
    type: "add",
    });

  const [allNotes, setAllNotes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const [isSearch, setIsSearch] = useState(false);

  const navigate = useNavigate();

  const handelEditNote = (noteDetails) => {
    setOpenAddEditModal({
      isShown: true,
      type: "edit",
      data: noteDetails,
    });
  }

const showToastMessage = (message, type = "success") => {
    setShowToastMsg({ 
        isShown: true,
        message, 
    });
};

  const handelCloseToast = () => {
    setShowToastMsg({ 
      isShown: false,
      message: "",
    });
  };

  // Ger user info from localStorage
 const getUserInfo = async () => {
  try {
    const response = await axiosInstance.get("/get-user");
    if (response.data && response.data.user) {
      setUserInfo(response.data.user);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.clear();
      navigate("/login");
    }
  }
};


  // Get all notes from the server
  const getAllNotes = async () => {
    try {
      const response = await axiosInstance.get("/get-all-notes");

      if (response.data && response.data.notes) {
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log("An error occurred while fetching notes. Please try again.");
    }
  };

  // Delete note function
  const deleteNote = async (data) => {
    const noteId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-note/" + noteId);

      if (response.data && !response.data.error) {
        showToastMessage("Note Deleted Successfully", "delete");
        getAllNotes();
      }
    } catch (error) {
      if (
        error.response && 
        error.response.data && 
        error.response.data.message
      ) {
      console.log("An error occurred while deleting the note. Please try again.");
    }
  }
  };

  // Search notes function
  const onSearchNote = async (query) => {
    try {
      const response = await axiosInstance.get("/search-notes", {
        params: { query },    
      });

      if (response.data && response.data.notes) {
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }
    } catch (error) {
      console.log(error);
    }
  };

// Update isPinned status of a note
const updateIsPinned = async (noteData) => {
  const noteId = noteData._id;
  try {
    const response = await axiosInstance.put(`/edit-note/${noteId}`, {
  isPinned: !noteData.isPinned,
});

    if (response.data && !response.data.error) {
      showToastMessage(`Note ${!noteData.isPinned ? "Pinned" : "Unpinned"} Successfully`);
      getAllNotes();
    } else {
      console.log("Error updating pin status");
    }
  } catch (error) {
    console.log("Error in updateIsPinned:", error);
  }
};


  // Handle search clear
const handleClearSearch = () => {
  setIsSearch(false);
  getAllNotes();
};
  
  
  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => {};
  }, []);



  return (
    <>
<Navbar
  userInfo={userInfo}
  onSearchNote={(query) => {
    if (query.trim()) {
      onSearchNote(query);
    } else {
      handleClearSearch();
    }
  }}
  handleClearSearch={handleClearSearch}
/>

    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
  {allNotes.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {allNotes.map((items) => (
        <NoteCard
          key={items._id}
          title={items.title}
          date={items.createdOn}
          content={items.content}
          tags={items.tags}
          isPinned={items.isPinned}
          onEdit={() => handelEditNote(items)}
          onDelete={() => deleteNote(items)}
          onPinNote={() => updateIsPinned(items)}
        />
      ))}
    </div>
  ) : (
    <EmptyCard 
    imgSrc={isSearch ? NoDataImg : AddNotesImg}
    message={
      isSearch ? `Oops! No notes found matching your search.` 
      : `Start creating your first note! click the 'Add' button to jot down your thoughts, idea, and reminders. Lets get started!`}
    />
  )}
</div>

      <button
      className="w-14 h-14 flex items-center justify-center cursor-pointer rounded-2xl bg-blue-500 hover:bg-blue-600 fixed right-10 bottom-10 shadow-lg "
      onClick={() => {
        setOpenAddEditModal({ isShown: true, type: "add", data: null });
      }}

      >

      <MdAdd className="text-[32px] text-white border-gray-300" />
    </button>

    <Modal 
    isOpen={openAddEditModal.isShown}
    onRequestClose={() => {}}
    style={{
      overlay: {
        backgroundColor: "rgba(0,0,0,0.2)",
      },
    }}
      contentLabel=""
      className="w-2/5 max-h-[75vh] bg-white rounded-md mx-auto mt-14 p-5 overflow-y-auto"
    >
      <AddEditNotes 
      type={openAddEditModal.type}
      noteData={openAddEditModal.data}
      onClose={() => {
        setOpenAddEditModal({ isShown: false, type: "add", data: null });
      }}
      getAllNotes={getAllNotes}
      showToastMessage={showToastMessage}
      />
    </Modal>
    <Toast
    isShown={showToastMsg.isShown}
    message={showToastMsg.message}
    type={showToastMsg.type}
    onClose={handelCloseToast}
    />
  </>
);
};

export default Home;