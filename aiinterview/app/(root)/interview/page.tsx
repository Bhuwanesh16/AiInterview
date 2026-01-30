import { redirect } from "next/navigation";
import InterviewPageClient from "@/components/InterviewPageClient";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) return redirect("/sign-in");

  return (
    <>
      <h3 className="mb-6">Interview generation</h3>
      <InterviewPageClient user={user} />
    </>
  );
};

export default Page;
