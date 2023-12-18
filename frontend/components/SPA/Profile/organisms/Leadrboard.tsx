import React from "react";
import ProfileComp from "../molecules/ProfileComp";
import { useQuery } from "react-query";
import { getLeadProfiles } from "@/utils/getLeadProfiles";
import { Skeleton } from "antd";
import { SkeletonComp } from "@/components/global/Skeleton";

interface LeaderboardProps {
  MonStyle: "Home" | "Profile";
}

export const Leadrboard = ({ MonStyle }: LeaderboardProps) => {
  const { isLoading, error, data } = useQuery("profiles", async () => {
    return getLeadProfiles();
  });

  if (isLoading) return <SkeletonComp large={10} />;
  if (error) return "An error has occurred: " + error;

  // Optimize rendering by checking data length before mapping
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center">
        <h1 className="text-gray-400 text-3xl font-semibold text-center">
          No Users
        </h1>
      </div>
    );
  }

  let bgStyle: string = "bg-purpleProfile";
  let colors: string[] = ["#ffc500", "#C0C0C0", "#cd7f32"];
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full py-2">
      {data?.map((user: any, index: any) => (
        <div
          key={user.id}
          className={`border-1 border-none rounded-2xl w-full ${bgStyle}  h-20 flex justify-start items-center p-10 gap-6`}
        >
          <span className="text-fontlight font-ClashGrotesk-Semibold text-lg flex items-center">
            {index < 9 ? `#0${index + 1}` : `#${index + 1}`}
          </span>

          <ProfileComp
            img={user.avatarUrl}
            nickName={user.nickName}
            firstName={user.firstName}
            lastName={user.lastName}
            color={colors[index]}
            id={user.id}
            channelId={user.id}
            status={user.status}
          />
        </div>
      ))}
    </div>
  );
};

export default Leadrboard;
