"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";
import { Label } from "./ui/label";

const interviewSetupSchema = z.object({
    jobRole: z.string().min(2, "Job role is required"),
    experienceLevel: z.string().min(1, "Experience level is required"),
    techStack: z.string().min(2, "Tech stack is required"),
    questionType: z.string().min(1, "Question type is required"),
    numberOfQuestions: z.preprocess(
        (a) => {
            if (typeof a === "string") return parseInt(a, 10);
            return a;
        },
        z.number().min(1, "Must have at least 1 question").max(20, "Max 20 questions")
    ),
});

interface InterviewSetupFormProps {
    onSubmit: (data: InterviewSettings) => void;
    isLoading?: boolean;
}

export type InterviewSettings = z.infer<typeof interviewSetupSchema>;

const InterviewSetupForm = ({ onSubmit, isLoading }: InterviewSetupFormProps) => {
    const form = useForm<InterviewSettings>({
        resolver: zodResolver(interviewSetupSchema),
        defaultValues: {
            jobRole: "",
            experienceLevel: "Mid-level",
            techStack: "",
            questionType: "Mixed",
            numberOfQuestions: 5,
        },
    });

    const handleSubmit = (data: InterviewSettings) => {
        onSubmit(data);
    };

    return (
        <div className="card-border w-full max-w-2xl mx-auto">
            <div className="card p-8 space-y-8">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-100 to-primary-foreground bg-clip-text text-transparent">
                        Setup Your Interview
                    </h2>
                    <p className="text-gray-400">
                        Customize your AI interview session to match your goals.
                    </p>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 form"
                    >
                        <FormField
                            control={form.control as any}
                            name="jobRole"
                            label="Job Role"
                            placeholder="e.g. Frontend Developer, Product Manager"
                            type="text"
                        />

                        <div className="space-y-2">
                            <Label htmlFor="experienceLevel">Experience Level</Label>
                            <div className="relative">
                                <select
                                    {...form.register("experienceLevel")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-white"
                                >
                                    <option value="Junior">Junior</option>
                                    <option value="Mid-level">Mid-level</option>
                                    <option value="Senior">Senior</option>
                                    <option value="Lead">Lead</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control as any}
                            name="techStack"
                            label="Tech Stack"
                            placeholder="e.g. React, Node.js, AWS (comma separated)"
                            type="text"
                        />

                        <div className="space-y-2">
                            <Label htmlFor="questionType">Question Type</Label>
                            <div className="relative">
                                <select
                                    {...form.register("questionType")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-white"
                                >
                                    <option value="Technical">Technical</option>
                                    <option value="Behavioral">Behavioral</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <FormField
                                control={form.control as any}
                                name="numberOfQuestions"
                                label="Number of Questions"
                                placeholder="5"
                                type="number"
                            />
                        </div>

                        <Button
                            className="btn w-full font-semibold text-lg"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Starting Session..." : "Start Interview"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default InterviewSetupForm;
