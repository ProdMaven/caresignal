import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { GuardrailBanner } from "@/components/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "About Unspoken" };

const DOES = [
  "Turns a spoken or typed sentence into a tidy log entry you can check and correct.",
  "Counts what tends to come before hard moments, across everyone who logs for the same person.",
  "Answers your questions using only your own log entries, and shows the counts behind each answer.",
  "Shows which everyday strategies helped other families with the same pattern, once 5 or more families have tried them.",
];

const NEVER = [
  "Diagnose a condition or name a cause. Patterns are possible things to check.",
  "Suggest medication, doses, restraint, or anything that needs a clinician to supervise.",
  "Replace your doctor or care team. Signs of injury, pain, illness, self-injury, or a sudden change always get: please contact your doctor or care team.",
  "Treat an emergency as a log entry. Possible emergencies, such as stroke signs or a serious fall, get: call 911 now.",
  "Share one family's notes with another. Community numbers are totals only, with the family count shown.",
];

export default function AboutPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">About Unspoken</h1>
        <p className="text-muted-foreground">
          Every need, finally heard. For anyone who lives with or cares for someone who cannot always say what they need, such as a parent living with
          dementia or an autistic child. Distress is communication. Unspoken helps you notice what it may be saying.
        </p>
      </div>
      <GuardrailBanner />

      <Card>
        <CardHeader>
          <CardTitle>What it does</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {DOES.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-1 size-5 shrink-0 text-emerald-700" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What it never does</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {NEVER.map((line) => (
              <li key={line} className="flex gap-2">
                <X className="mt-1 size-5 shrink-0 text-red-700" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>If you are the one struggling</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Caring for someone every day is hard, and you matter too. If you feel you cannot go on, call or text 988,
            the 988 Suicide and Crisis Lifeline. It is free and open 24 hours a day. In an emergency, call 911.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the numbers and the data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Patterns and scores are counted by plain code from log entries. AI is used to turn your notes into log entries and
            your spoken history into milestones. It does not find patterns or produce any number.
          </p>
          <p>Strategy scores are based on family logs, not a clinical trial. Discuss them with your care team.</p>
          <p>
            Everything in this demo is synthetic. Helen, Arjun, Maya, their caregivers, and the other families are made
            up. Please do not enter real names or private health details.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
