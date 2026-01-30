"use client";

import Agent from "@/components/Agent";

interface InterviewPageClientProps {
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
}

const InterviewPageClient = ({ user }: InterviewPageClientProps) => {
    if (!user) return null;

    return (
        <Agent
            userName={user.name}
            userId={user.id}
            type="generate"
        />
    );
};

export default InterviewPageClient;
