import style from "@/styles/SPA/chat/chat.module.scss";
import { AiOutlineUserAdd } from "react-icons/ai";
import ProfileComp from "@/components/SPA/Profile/molecules/ProfileComp";
import { useEffect, useState } from "react";
import InFosPlayer from "../../Profile/atoms/InFosPlayer";
import ChannelSettings from "./ChannelSettings";
import axios from "axios";

const InviteSection = () => {
  return (
    <div className={style["invite-section"]}>
      <h1>
        <AiOutlineUserAdd />
        Invite Friends
      </h1>
      <input
        type="text"
        placeholder="Type the username to search for a friend"
      />

      <div className={style["invite-list"]}>
        <div className={style["friend"]}>
          <ProfileComp
            img="https://i.pravatar.cc/300?img=1"
            nickName="hamza_lkr"
            firstName="Le mountassir"
            lastName="fatFaggot"
          />
          <button>
            <AiOutlineUserAdd />
            Invite
          </button>
        </div>
        <div className={style["friend"]}>
          <ProfileComp
            img="https://i.pravatar.cc/300?img=1"
            nickName="hamza_lkr"
            firstName="Transgender"
            lastName="Nagat"
          />
          <button>
            <AiOutlineUserAdd />
            Invite
          </button>
        </div>
        <div className={style["friend"]}>
          <ProfileComp
            img="https://i.pravatar.cc/300?img=1"
            nickName="hamza_lkr"
            firstName="Achref"
            lastName="Femboy"
          />
          <button>
            <AiOutlineUserAdd />
            Invite
          </button>
        </div>
      </div>
    </div>
  );
};
const AuthoritySection = ({}) => {
  return (
    <div className={style["authority-section"]}>
      <h2>Owners</h2>
      <ProfileComp
        img="https://i.pravatar.cc/300?img=1"
        nickName="hamza_lkr"
        firstName="Saleh"
        lastName="Nagat"
      />
      <h2>Moderators</h2>
      <div className={style["list"]}>
        {[...Array(10)].map((e, i) => (
          <ProfileComp
            key={i}
            img="https://i.pravatar.cc/300?img=1"
            nickName="hamza_lkr"
            firstName="Saleh"
            lastName="Nagat"
          />
        ))}
      </div>
    </div>
  );
};

const MembersSection = ({}) => {
  return (
    <div className={style["members-section"]}>
      <h2>Members</h2>
      <div className={style["members-list"]}>
        {[...Array(222)].map((e, i) => (
          <div className={style["member"]} key={""}>
            <ProfileComp
              key={i}
              img="https://i.pravatar.cc/300?img=1"
              nickName="hamza_lkr"
              firstName="Saleh"
              lastName="Nagat"
            />
          </div>
        ))}
      </div>
      <div className={style["total"]}>Total: 33</div>
    </div>
  );
};

const ChannelMenu = ({ channel }: any) => {
  const [activeSection, setActiveSection] = useState<string>("Invite");
  const [active, setActive] = useState(0);
  const [channelData, setChannelData] = useState<any>(null);

  const handleButtonClick = (sectionName: string) => {
    setActiveSection(sectionName);
  };
  function handleActive(index: number) {
    setActive(index);
  }

  useEffect(() => {
    try {
      axios
        .get(`http://localhost:1337/api/channels/${channel.id}`)
        .then((res) => {
          setChannelData(res.data);
          console.log(res.data);
        });
    } catch (err) {
      console.log(err);
    }
  }, []);
  return (
    <>
      <div className={style["menu-header"]}>
        <h1>{channel.name}</h1>
        <div className={style["menu-list"]}>
          {OptionsSections.map((e, i) => (
            <InFosPlayer
              key={i}
              text={e.name}
              active={active === i}
              whenClick={() =>
                (function () {
                  handleActive(i);
                  handleButtonClick(e.name);
                })()
              }
              isItprofile={false}
            />
          ))}
        </div>
      </div>
      <div className={style["menu-body"]}>
        {activeSection === "Invite" && <InviteSection />}
        {activeSection === "Authority Hub" && <AuthoritySection />}
        {activeSection === "Members" && <MembersSection />}
        {activeSection === "Settings" && <ChannelSettings />}
      </div>
    </>
  );
};

const OptionsSections = [
  {
    name: "Invite",
  },
  {
    name: "Authority Hub",
  },
  {
    name: "Members",
  },
  {
    name: "Settings",
  },
];
export default ChannelMenu;