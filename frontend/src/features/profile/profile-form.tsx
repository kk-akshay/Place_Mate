"use client";

import type {
  FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  InlineMultiSelect,
} from "@/components/forms/inline-multi-select";
import {
  InlineSearchSelect,
} from "@/components/forms/inline-search-select";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Label,
} from "@/components/ui/label";
import {
  Progress,
} from "@/components/ui/progress";
import {
  BRANCH_OPTIONS,
  COMPANY_OPTIONS,
  DEGREE_OPTIONS,
  GRADUATION_YEAR_OPTIONS,
  INSTITUTION_OPTIONS,
  PREPARATION_GOAL_OPTIONS,
  SKILL_OPTIONS,
  STRENGTH_OPTIONS,
  TARGET_ROLE_OPTIONS,
  WEAK_AREA_OPTIONS,
  WEEKLY_HOUR_OPTIONS,
} from "@/data/profile-options";
import {
  useAuth,
} from "@/features/auth/auth-provider";
import {
  ApiRequestError,
} from "@/lib/api";
import type {
  StudentProfile,
  StudentProfileInput,
} from "@/types/profile";


type ProfileFormProps = {
  mode:
    | "onboarding"
    | "edit";

  initialProfile?:
    | StudentProfile
    | null;
};


type FormState = {
  college_name: string;

  degree: string;

  branch: string;

  graduation_year: string;

  target_roles: string[];

  target_companies: string[];

  skills: string[];

  strengths: string[];

  weak_areas: string[];

  preparation_goals: string[];

  weekly_hours: string;
};


const steps = [
  {
    title:
      "Education",

    description:
      "Tell us about your academic background.",
  },
  {
    title:
      "Career targets",

    description:
      "Choose the roles and companies you want to prepare for.",
  },
  {
    title:
      "Skills",

    description:
      "Show Place-Mate what you already know and where you want to improve.",
  },
  {
    title:
      "Preparation plan",

    description:
      "Set your priorities and realistic weekly preparation time.",
  },
];


function getInitialState(
  profile?:
    | StudentProfile
    | null,
): FormState {
  if (!profile) {
    return {
      college_name:
        "",

      degree:
        "",

      branch:
        "",

      graduation_year:
        "",

      target_roles:
        [],

      target_companies:
        [],

      skills:
        [],

      strengths:
        [],

      weak_areas:
        [],

      preparation_goals:
        [],

      weekly_hours:
        "7",
    };
  }


  return {
    college_name:
      profile.college_name,

    degree:
      profile.degree,

    branch:
      profile.branch,

    graduation_year:
      String(
        profile.graduation_year,
      ),

    target_roles: [
      ...profile.target_roles,
    ],

    target_companies: [
      ...profile.target_companies,
    ],

    skills: [
      ...profile.skills,
    ],

    strengths: [
      ...profile.strengths,
    ],

    weak_areas: [
      ...profile.weak_areas,
    ],

    preparation_goals: [
      ...profile.preparation_goals,
    ],

    weekly_hours:
      String(
        profile.weekly_hours,
      ),
  };
}


function validateStep(
  step: number,
  values: FormState,
): string | null {
  if (
    step === 0
  ) {
    if (
      !values
        .college_name
        .trim()
    ) {
      return (
        "Select or enter your college or university."
      );
    }


    if (
      !values.degree
    ) {
      return (
        "Select your degree."
      );
    }


    if (
      !values.branch
    ) {
      return (
        "Select your branch or specialization."
      );
    }


    const year =
      Number(
        values
          .graduation_year,
      );


    if (
      !Number.isInteger(
        year,
      ) ||
      year < 2000 ||
      year > 2100
    ) {
      return (
        "Select a valid graduation year."
      );
    }
  }


  if (
    step === 1 &&
    values
      .target_roles
      .length === 0
  ) {
    return (
      "Select at least one target role."
    );
  }


  if (
    step === 2 &&
    values
      .skills
      .length === 0
  ) {
    return (
      "Select at least one current skill."
    );
  }


  if (
    step === 3
  ) {
    if (
      values
        .preparation_goals
        .length === 0
    ) {
      return (
        "Select at least one preparation goal."
      );
    }


    const weeklyHours =
      Number(
        values
          .weekly_hours,
      );


    if (
      !Number.isInteger(
        weeklyHours,
      ) ||
      weeklyHours < 1 ||
      weeklyHours > 80
    ) {
      return (
        "Select your weekly preparation time."
      );
    }
  }


  return null;
}


export function ProfileForm({
  mode,
  initialProfile,
}: ProfileFormProps) {
  const router =
    useRouter();

  const {
    authFetch,
  } = useAuth();


  const [
    step,
    setStep,
  ] = useState(0);


  const [
    values,
    setValues,
  ] = useState<FormState>(
    () =>
      getInitialState(
        initialProfile,
      ),
  );


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const currentStep =
    steps[step];


  const progress =
    (
      (step + 1)
      /
      steps.length
    )
    * 100;


  function setField<
    Key extends
      keyof FormState,
  >(
    key: Key,
    value:
      FormState[Key],
  ) {
    setValues(
      (current) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }


  function handleNext() {
    const message =
      validateStep(
        step,
        values,
      );


    if (message) {
      setError(
        message,
      );

      return;
    }


    setError(null);


    setStep(
      (current) =>
        Math.min(
          current + 1,
          steps.length - 1,
        ),
    );


    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }


  function handleBack() {
    setError(null);


    setStep(
      (current) =>
        Math.max(
          current - 1,
          0,
        ),
    );


    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    for (
      let index = 0;
      index
        < steps.length;
      index += 1
    ) {
      const message =
        validateStep(
          index,
          values,
        );


      if (message) {
        setStep(
          index,
        );

        setError(
          message,
        );

        return;
      }
    }


    setSubmitting(
      true,
    );

    setError(null);


    const payload:
      StudentProfileInput = {
        college_name:
          values
            .college_name
            .trim(),

        degree:
          values.degree,

        branch:
          values.branch,

        graduation_year:
          Number(
            values
              .graduation_year,
          ),

        target_roles:
          values.target_roles,

        target_companies:
          values.target_companies,

        skills:
          values.skills,

        strengths:
          values.strengths,

        weak_areas:
          values.weak_areas,

        preparation_goals:
          values
            .preparation_goals,

        weekly_hours:
          Number(
            values
              .weekly_hours,
          ),
      };


    try {
      await authFetch<StudentProfile>(
        "/profiles/me",
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload,
            ),
        },
      );


      router.replace(
        "/dashboard",
      );

    } catch (error) {
      setError(
        error
          instanceof ApiRequestError
          ? error.message
          : (
              "Unable to save your profile."
            ),
      );

    } finally {
      setSubmitting(
        false,
      );
    }
  }


  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-xl shadow-primary/5">
      <CardHeader className="border-b border-border/70 bg-muted/30 px-5 py-6 sm:px-8">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-primary">
                Step{" "}
                {
                  step + 1
                }
                {" "}
                of{" "}
                {
                  steps.length
                }
              </p>

              <CardTitle className="mt-2 text-2xl">
                {
                  currentStep.title
                }
              </CardTitle>

              <CardDescription className="mt-2 max-w-xl leading-6">
                {
                  currentStep
                    .description
                }
              </CardDescription>
            </div>

            <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary sm:flex">
              {
                step + 1
              }
            </div>
          </div>


          <Progress
            value={
              progress
            }
            className="h-2"
          />
        </div>
      </CardHeader>


      <form
        onSubmit={
          handleSubmit
        }
      >
        <CardContent className="px-5 py-7 sm:px-8 sm:py-8">
          {error ? (
            <Alert
              variant="destructive"
              className="mb-6"
            >
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          ) : null}


          {step === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  College /
                  University
                </Label>

                <InlineSearchSelect
                  value={
                    values
                      .college_name
                  }
                  onChange={(
                    value,
                  ) => {
                    setField(
                      "college_name",
                      value,
                    );
                  }}
                  options={
                    INSTITUTION_OPTIONS
                  }
                  placeholder="Search your institution"
                  searchPlaceholder="Search or type your college/university..."
                  allowCustom
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  If your
                  institution is
                  not listed,
                  search its name
                  and add it as a
                  custom value.
                </p>
              </div>


              <div className="space-y-2">
                <Label>
                  Degree
                </Label>

                <InlineSearchSelect
                  value={
                    values.degree
                  }
                  onChange={(
                    value,
                  ) => {
                    setField(
                      "degree",
                      value,
                    );
                  }}
                  options={
                    DEGREE_OPTIONS
                  }
                  placeholder="Select degree"
                  searchPlaceholder="Search degree..."
                  allowCustom
                />
              </div>


              <div className="space-y-2">
                <Label>
                  Branch /
                  Specialization
                </Label>

                <InlineSearchSelect
                  value={
                    values.branch
                  }
                  onChange={(
                    value,
                  ) => {
                    setField(
                      "branch",
                      value,
                    );
                  }}
                  options={
                    BRANCH_OPTIONS
                  }
                  placeholder="Select specialization"
                  searchPlaceholder="Search specialization..."
                  allowCustom
                />
              </div>


              <div className="space-y-2">
                <Label>
                  Graduation year
                </Label>

                <InlineSearchSelect
                  value={
                    values
                      .graduation_year
                  }
                  onChange={(
                    value,
                  ) => {
                    setField(
                      "graduation_year",
                      value,
                    );
                  }}
                  options={
                    GRADUATION_YEAR_OPTIONS
                  }
                  placeholder="Select year"
                  searchPlaceholder="Search year..."
                  allowCustom={
                    false
                  }
                />
              </div>
            </div>
          ) : null}


          {step === 1 ? (
            <div className="space-y-7">
              <div className="space-y-2">
                <Label>
                  Target roles

                  <span className="ml-1 text-primary">
                    *
                  </span>
                </Label>

                <InlineMultiSelect
                  values={
                    values
                      .target_roles
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "target_roles",
                      nextValues,
                    );
                  }}
                  options={
                    TARGET_ROLE_OPTIONS
                  }
                  placeholder="Choose target roles"
                  searchPlaceholder="Search or add a role..."
                  maxSelections={
                    10
                  }
                />
              </div>


              <div className="space-y-2">
                <Label>
                  Target
                  companies
                </Label>

                <InlineMultiSelect
                  values={
                    values
                      .target_companies
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "target_companies",
                      nextValues,
                    );
                  }}
                  options={
                    COMPANY_OPTIONS
                  }
                  placeholder="Choose target companies"
                  searchPlaceholder="Search or add a company..."
                  maxSelections={
                    10
                  }
                />
              </div>
            </div>
          ) : null}


          {step === 2 ? (
            <div className="space-y-7">
              <div className="space-y-2">
                <Label>
                  Current
                  skills

                  <span className="ml-1 text-primary">
                    *
                  </span>
                </Label>

                <InlineMultiSelect
                  values={
                    values.skills
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "skills",
                      nextValues,
                    );
                  }}
                  options={
                    SKILL_OPTIONS
                  }
                  placeholder="Choose your skills"
                  searchPlaceholder="Search or add a skill..."
                  maxSelections={
                    20
                  }
                />
              </div>


              <div className="space-y-2">
                <Label>
                  Strengths
                </Label>

                <InlineMultiSelect
                  values={
                    values
                      .strengths
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "strengths",
                      nextValues,
                    );
                  }}
                  options={
                    STRENGTH_OPTIONS
                  }
                  placeholder="Choose strengths"
                  searchPlaceholder="Search or add a strength..."
                  maxSelections={
                    15
                  }
                />
              </div>


              <div className="space-y-2">
                <Label>
                  Areas to
                  improve
                </Label>

                <InlineMultiSelect
                  values={
                    values
                      .weak_areas
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "weak_areas",
                      nextValues,
                    );
                  }}
                  options={
                    WEAK_AREA_OPTIONS
                  }
                  placeholder="Choose improvement areas"
                  searchPlaceholder="Search or add an improvement area..."
                  maxSelections={
                    15
                  }
                />
              </div>
            </div>
          ) : null}


          {step === 3 ? (
            <div className="space-y-7">
              <div className="space-y-2">
                <Label>
                  Preparation
                  goals

                  <span className="ml-1 text-primary">
                    *
                  </span>
                </Label>

                <InlineMultiSelect
                  values={
                    values
                      .preparation_goals
                  }
                  onChange={(
                    nextValues,
                  ) => {
                    setField(
                      "preparation_goals",
                      nextValues,
                    );
                  }}
                  options={
                    PREPARATION_GOAL_OPTIONS
                  }
                  placeholder="Choose your goals"
                  searchPlaceholder="Search or add a preparation goal..."
                  maxSelections={
                    10
                  }
                />
              </div>


              <div className="max-w-md space-y-2">
                <Label>
                  Weekly
                  preparation
                  time
                </Label>

                <InlineSearchSelect
                  value={
                    values
                      .weekly_hours
                  }
                  onChange={(
                    value,
                  ) => {
                    setField(
                      "weekly_hours",
                      value,
                    );
                  }}
                  options={
                    WEEKLY_HOUR_OPTIONS
                  }
                  placeholder="Select weekly hours"
                  searchPlaceholder="Search weekly hours..."
                  allowCustom={
                    false
                  }
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  This is your
                  weekly preparation
                  budget. Time spent
                  in Place-Mate
                  practice modules
                  will be deducted
                  from it.
                </p>
              </div>
            </div>
          ) : null}


          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={
                handleBack
              }
              disabled={
                step === 0 ||
                submitting
              }
              className="rounded-xl"
            >
              <ArrowLeft
                className="size-4"
                aria-hidden="true"
              />

              Back
            </Button>


            {step
              < steps.length
                - 1 ? (
              <Button
                type="button"
                onClick={
                  handleNext
                }
                className="rounded-xl px-6"
              >
                Continue

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  submitting
                }
                className="rounded-xl px-6 shadow-lg shadow-primary/15"
              >
                <Check
                  className="size-4"
                  aria-hidden="true"
                />

                {submitting
                  ? "Saving..."
                  : mode
                      === "onboarding"
                    ? "Finish setup"
                    : "Save changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </form>
    </Card>
  );
}