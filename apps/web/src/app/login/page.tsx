"use client";

import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import CircleLoginOnlyForm from "@/components/circle-login-only-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, User } from "lucide-react";

export default function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false);

  if (showSignUp) {
    return <SignUpForm onSwitchToSignIn={() => setShowSignUp(false)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg border shadow-sm">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              個人アカウント
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              店舗・スタッフ簡易
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="pt-2">
            <SignInForm onSwitchToSignUp={() => setShowSignUp(true)} />
          </TabsContent>

          <TabsContent value="staff" className="pt-2">
            <CircleLoginOnlyForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
