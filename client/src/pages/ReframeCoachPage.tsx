import React from "react";
import { useParams } from "wouter";
import Header from "@/components/layout/Header";
import ReframeCoachDashboard from "@/components/reframeCoach/ReframeCoachDashboard";

const ReframeCoachPage = () => {
  const params = useParams();
  const userId = parseInt(params.userId);

  return (
    <div>
      <Header title="Reframe Coach" />
      <div className="container max-w-4xl py-6">
        <ReframeCoachDashboard userId={userId} />
      </div>
    </div>
  );
};

export default ReframeCoachPage;