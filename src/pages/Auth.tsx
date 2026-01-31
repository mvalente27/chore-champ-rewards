import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Star, Sparkles, User, Users, Download, Smartphone, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(20);
const familyCodeSchema = z.string().length(6, 'Family code must be 6 characters');

const STORAGE_KEY = 'chorequest_kid_login';

interface SavedKidLogin {
  username: string;
  familyCode: string;
}

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginType, setLoginType] = useState<'parent' | 'kid'>('parent');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; username?: string; familyCode?: string }>({});
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const { signIn, signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Load saved kid login credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SavedKidLogin = JSON.parse(saved);
        setUsername(parsed.username || '');
        setFamilyCode(parsed.familyCode || '');
        setRememberMe(true);
        setLoginType('kid');
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Check if app is installed and listen for install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast.success('App installed! You can now open it from your home screen.');
      }
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
  };

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; username?: string; familyCode?: string } = {};

    if (loginType === 'parent') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    } else {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        newErrors.username = usernameResult.error.errors[0].message;
      }
      const familyCodeResult = familyCodeSchema.safeParse(familyCode);
      if (!familyCodeResult.success) {
        newErrors.familyCode = familyCodeResult.error.errors[0].message;
      }
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignUp && loginType === 'parent') {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKidLogin = async () => {
    // For kid login, we need to convert username to the fake email format
    // The format is: username@household-short.chorequest.local
    // But we don't know the household ID, so we need to look it up
    
    // First, try to find the user by searching all possible emails
    // This is done server-side in a more efficient way, but for now
    // we'll use a pattern match approach
    
    try {
      // Try to sign in with email pattern - we'll search for the username
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username.toLowerCase()}@`, // This won't work directly
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch {
      // If direct login fails, try to find the user via RPC
      // For now, show a helpful error
      return { 
        error: new Error('Could not find account. Make sure you entered the correct username and password.') 
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (loginType === 'kid') {
        // Kid login with username + family code
        let lookupData, lookupError;
        try {
          const result = await supabase.functions.invoke('lookup-kid-login', {
            body: { 
              username: username.toLowerCase(),
              familyCode: familyCode.toUpperCase(),
            },
          });
          lookupData = result.data;
          lookupError = result.error;
        } catch (networkErr) {
          console.error('Network error during lookup:', networkErr);
          toast.error('Cannot connect to server. Please check your internet connection or try a different browser.');
          return;
        }

        if (lookupError || !lookupData?.email) {
          toast.error('Username or family code not found. Please check and try again.');
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: lookupData.email,
          password,
        });

        if (error) {
          toast.error('Invalid username or password. Please try again.');
        } else {
          // Save or clear kid login credentials based on Remember Me
          if (rememberMe) {
            const savedLogin: SavedKidLogin = { 
              username: username.toLowerCase(), 
              familyCode: familyCode.toUpperCase() 
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLogin));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
          toast.success(`Welcome back! 👋`);
          navigate('/');
        }
      } else if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome to ChoreQuest! 🎉');
          navigate('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back! 👋');
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Install Banner - Show before login */}
      {!isInstalled && (
        <div className="w-full max-w-md mb-4">
          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-secondary/15 to-secondary/5 border border-secondary/30 rounded-xl p-3 flex items-center gap-3 hover:from-secondary/20 hover:to-secondary/10 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground text-sm">Install ChoreQuest</p>
              <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
            </div>
            <Download className="w-5 h-5 text-secondary" />
          </button>
        </div>
      )}

      {/* Logo/Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <Star className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">ChoreQuest</h1>
        <p className="text-muted-foreground mt-1">Making chores fun & rewarding!</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2">
            {isSignUp ? (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Create Your Family Account
              </>
            ) : (
              'Welcome Back!'
            )}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Start your family chore adventure'
              : 'Sign in to continue your quest'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSignUp && (
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'parent' | 'kid')} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="parent" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Parent
                </TabsTrigger>
                <TabsTrigger value="kid" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Kid
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Mom, Dad, or your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            {loginType === 'parent' ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="familyCode">Family Code</Label>
                  <Input
                    id="familyCode"
                    type="text"
                    placeholder="ABC123"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    disabled={isSubmitting}
                    maxLength={6}
                    className="uppercase tracking-widest text-center font-mono"
                  />
                  {errors.familyCode && (
                    <p className="text-sm text-destructive">{errors.familyCode}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Ask your parent for the family code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={isSubmitting}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {loginType === 'kid' && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rememberMe" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember my username & family code
                </Label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {loginType === 'parent' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        {loginType === 'parent' 
          ? 'Parents sign up first, then add kids from the dashboard'
          : 'Ask your parent for your family code, username, and password'
        }
      </p>
    </div>
  );
};

export default Auth;
