import React, { useEffect, useState } from "react";
import style from "@/styles/components/TopLeftNav.module.scss";
import { BiSearchAlt } from "react-icons/bi";
import ProfileComp from "../SPA/Profile/molecules/ProfileComp";
import axios from "axios";
import debounce from 'lodash/debounce';

const SearchComp = () => {
  const getChannelStatus = (channel) => {
    if (channel.isPrivate) {
      return "Private";
    } else if (channel.is_protected) {
      return "Protected";
    } else {
      return "Public";
    }
  };
  const [activeSearch, setActiveSearch] = useState([]);
  const [res, setRes] = useState([]);
  const [Mount, setMount] = useState(false);
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const channelsRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/channels`, {
          withCredentials: true,
        });
  
        const channels = channelsRes.data.map((channel) => ({
          ...channel,
          isChannel: true,
        }));
  
        const fetchProfiles = async () => {
          try {
            const profileres = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
              withCredentials: true,
            });
            const profiles = profileres.data.map((profile) => ({
              ...profile,
              isChannel: false,
            }));
  
            setRes([...channels, ...profiles]); 
            setMount(true);
          } catch (error) {
            console.error("Error fetching profiles", error);
          }
        };
  
        fetchProfiles();
      } catch (error) {
        console.error("Error fetching channels", error);
      }
    };
  
    fetchChannels();
  }, []);
 
    const debouncedSearch = debounce((search) => {
    const searchValue = search.toLowerCase();
    const searchTerms = searchValue.split(" ");

    const filteredUsers = res.filter((user) => {
      let fullName = "";
      if (user.isChannel) {
        fullName = user.name.toLowerCase();
      } else {
        fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      }
      const userFullName = fullName;

      return (
        user.nickName.includes(searchValue) ||
        (searchTerms.length === 1 && fullName.includes(searchValue)) ||
        (searchTerms.length === 2 &&
          userFullName.includes(searchTerms[0]) &&
          userFullName.includes(searchTerms[1]))
      );
    });

    setActiveSearch(filteredUsers.slice(0, 8));
  }, 300); // Debounce for 300 milliseconds

  const handleSearch = (e) => {
    if (e.target.value === "") {
      setActiveSearch([]);
      return false;
    }

    debouncedSearch(e.target.value);
  };

 
  

  return (
    <>
      <div className={style["top_search"]}>
        <BiSearchAlt className={style["search_icon"]} />
        <input
          type="text"
          placeholder="Search for players, channels..."
          onChange={(e) => handleSearch(e)}
        />
      </div>
      {activeSearch.length > 0 && (
        <div className="absolute top-20 p-4 bg-black text-white w-[400px] h-auto overflow-auto rounded-xl left-1/2 -translate-x-1/2 flex flex-col gap-4">
          {activeSearch.map((data, index) => (
            <ProfileComp
              key={index}
              img={data.isChannel ? "" : data.avatarUrl}
              nickName={data.isChannel ? getChannelStatus(data) : data.nickName}
              firstName={data.isChannel ? data.name : data.firstName}
              lastName={data.isChannel ? null : data.lastName}
              channelId={data.id}
              type={
                data.isChannel
                  ? getChannelStatus(data) === "Public"
                    ? "Public"
                    : getChannelStatus(data) === "Protected"
                    ? "Protected"
                    : null
                  : null
              }
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SearchComp;
