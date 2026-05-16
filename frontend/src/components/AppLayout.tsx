import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ThreadSidebar } from "@/components/ThreadSidebar";
import { PersonalizationDialog } from "@/components/PersonalizationDialog";
import { api } from "@/api/client";

export default function AppLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
      } else {
        setSession(session);
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    api.getPreferences().then((res) => {
      if (!res.onboardingCompleted) {
        setShowOnboarding(true);
      }
    }).catch(() => {
      // If preferences endpoint fails (e.g. auth disabled), silently skip
    });
  }, [session]);

  if (!ready || !session) {
    return (
      <div className="grid h-screen place-items-center bg-[var(--gradient-horizon)] text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ThreadSidebar email={session.user.email ?? null} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <PersonalizationDialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
