import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | PrepPal Admin</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-600">PrepPal Admin</h2>
            <p className="mt-2 text-gray-600">Sign in to manage content</p>
          </div>
          
          <Card>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm">
                  {error}
                </div>
              )}
              
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              
              <Button type="submit" fullWidth loading={loading}>
                Sign in
              </Button>
              
              <div className="text-center text-sm text-gray-500 pt-4">
                <p>First time setup? Check the <a href="/setup-docs/setup" className="text-primary-600 hover:underline">Setup Guide</a></p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
} 