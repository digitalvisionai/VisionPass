
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Digital Vision logo at the very top left corner of the page */}
      <img
        src="/lovable-uploads/645e2f58-74f1-4736-9ed6-ce62d08f2a8d.png"
        alt="Digital Vision Logo"
        className="fixed top-0 left-0 h-24 w-auto object-contain drop-shadow-md m-6 z-50"
        style={{ maxWidth: '160px' }}
      />
      {/* VisionPass logo absolutely centered above the login card, not affecting card layout */}
      <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none w-full flex justify-center">
        <img
          src="/lovable-uploads/vision pass.png"
          alt="VisionPass Logo"
          className="h-64 w-auto object-contain drop-shadow-md mb-4 sm:h-64 sm:mb-8 max-w-xs sm:max-w-lg"
          style={{ maxWidth: '90vw' }}
        />
      </div>
      <div className="max-w-md w-full space-y-8 pt-44 sm:pt-32">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 text-center">
          Face Recognition Attendance System
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Admin Login Portal
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Enter your admin credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Only authorized administrators can access this system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
