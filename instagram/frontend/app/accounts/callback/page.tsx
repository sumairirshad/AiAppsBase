"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { AccountDto } from "@/lib/types";
import { Card, LoadingState, ErrorAlert } from "@/components/ui";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Completing Instagram connection...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

    if (oauthError) {
      setStatus("error");
      setMessage(oauthError);
      return;
    }

    const expectedState = sessionStorage.getItem("ig_oauth_state");
    if (!code || !state || state !== expectedState) {
      setStatus("error");
      setMessage("The OAuth state did not match. Please restart the connection flow.");
      return;
    }

    apiFetch<AccountDto>("/api/auth/callback", {
      method: "POST",
      body: JSON.stringify({ code, state })
    })
      .then((account) => {
        sessionStorage.removeItem("ig_oauth_state");
        setStatus("success");
        setMessage(`Connected @${account.username}. Redirecting...`);
        setTimeout(() => router.push("/accounts"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiClientError ? err.message : "Unable to complete the connection.");
      });
  }, [router, searchParams]);

  return (
    <Card className="mx-auto max-w-md text-center">
      {status === "processing" && <LoadingState label={message} />}
      {status === "success" && <p className="text-green-700">{message}</p>}
      {status === "error" && <ErrorAlert message={message} />}
    </Card>
  );
}

export default function AccountsCallbackPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading..." />}>
      <CallbackHandler />
    </Suspense>
  );
}
