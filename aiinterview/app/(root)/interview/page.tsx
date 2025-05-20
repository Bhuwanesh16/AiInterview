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
<<<<<<< HEAD
        profileImage={user?.profileURL}
=======
        // profileImage={user?.profileURL}
>>>>>>> d0d8a5ce1ede1e7c8ae4b83f3a7509fe3b99ce1b
        type="generate"
      />
    </>
  );
};

export default Page;