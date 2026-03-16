import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  pricing_status?: 'pending' | 'active' | 'rejected' | null;
  commercial_details?: string | null;
  documents_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isPartner: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Helper function to fetch profile
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const { data: partnerConfig } = await supabase
          .from('partner_b2b_config')
          .select('is_active')
          .eq('user_id', userId)
          .maybeSingle();

        const { data: partnerReq } = await supabase
          .from('partner_requests')
          .select('status')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .maybeSingle();

        if (isMounted) {
          setProfile(profileData as any);
          setIsPartner(!!partnerConfig?.is_active || !!partnerReq);
        }
      } catch (error) {
        console.error('[AuthContext] Error fetching profile:', error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile when user logs in - use setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setIsPartner(false);
        }
      }
    );

    // Safety timeout to ensure app doesn't stay stuck on loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[AuthContext] Safety timeout triggered - forcing loading false');
        setLoading(false);
      }
    }, 6000);

    // THEN check for existing session
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
        }

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        console.log('[AuthContext] Session checked:', !!session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        if (isMounted) {
          console.log('[AuthContext] Initialization complete, setting loading false');
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsPartner(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isPartner, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
