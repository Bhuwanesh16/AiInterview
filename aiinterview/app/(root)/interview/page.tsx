import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <h3>Interview generation</h3>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        jobRole="Frontend Developer"
        experienceLevel="Junior"
        techStack="React, Node.js, TypeScript"
        questionType="Technical"
        numberOfQuestions={5}
        type="generate"
      />
    </>
  );
};

export default Page;
