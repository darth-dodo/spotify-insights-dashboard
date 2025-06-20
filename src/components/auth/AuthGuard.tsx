import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BlurLoader } from '@/components/ui/BlurLoader';
import { ErrorDialog } from '@/components/auth/ErrorDialog';
import { spotifyPlaybackSDK } from '@/lib/spotify-playback-sdk';
import { LandingPage } from '@/components/LandingPage';
import { DataLoadingScreen } from '@/components/ui/DataLoadingScreen';
import { useLoading } from '@/components/providers/LoadingProvider';

interface AuthGuardProps {
  children?: React.ReactNode;
  loginComponent?: React.ReactNode;
  dashboardComponent?: React.ReactNode;
}

export const AuthGuard = ({ children, loginComponent, dashboardComponent }: AuthGuardProps) => {
  const { user, isLoading, error } = useAuth();
  const { isLoadingData } = useLoading();
  const sdkCleanupDone = useRef(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

  console.log('AuthGuard state:', { 
    user: !!user, 
    isLoading, 
    error, 
    isLoadingData,
    path: window.location.pathname 
  });

  // Show error dialog if there's an auth error, but not during loading, data loading, or on dashboard paths, but not during loading or on dashboard paths
  useEffect(() => {
    const shouldShowError = error && 
      !isLoading && 
      !isLoadingData && 
      !window.location.pathname.startsWith('/dashboard') &&
      window.location.pathname !== '/';
      
    if (shouldShowError && !isLoading && !window.location.pathname.startsWith('/dashboard')) {
      setErrorDialogOpen(true);
    } else if (!error) {
      setErrorDialogOpen(false);
    } else if (!error) {
      setErrorDialogOpen(false);
    }
  }, [error, isLoading, isLoadingData, isLoading]);

  // Clean up Spotify SDK in demo mode
  useEffect(() => {
    if (window.location.pathname === '/' && !user && !isLoading && !sdkCleanupDone.current) {
      try {
        spotifyPlaybackSDK.disconnect();
        
        if ((window as any).onSpotifyWebPlaybackSDKReady) {
          delete (window as any).onSpotifyWebPlaybackSDKReady;
        }
        
        console.log('Cleaned up Spotify SDK for demo mode');
      } catch (error) {
        console.warn('Error during SDK cleanup:', error);
      }
      
      sdkCleanupDone.current = true;
    }
  }, [user, isLoading]);

  const handleRetryAuth = () => {
    setErrorDialogOpen(false);
    window.location.reload();
  };

  // Show dashboard if user is authenticated
  if (user) {
    console.log('User authenticated, showing dashboard');
    return dashboardComponent || children;
  }

  // Root (public) path without authentication → Landing page
  if (window.location.pathname === '/' && !user) {
    console.log('No authentication on root path, showing landing page');
    return (
      <BlurLoader isLoading={isLoading}>
        <LandingPage />
      </BlurLoader>
    );
  }

  // For dashboard path while authentication is still processing, show data loading screen
  if (window.location.pathname.startsWith('/dashboard') && !user) {
    console.log('Awaiting authentication on /dashboard, waiting for profile');
    return null;
  }

  // Fallback: show landing page for any other unauthenticated path
  console.log('User not authenticated, showing landing page');
  return (
    <BlurLoader isLoading={isLoading}>
      <LandingPage />
      <ErrorDialog
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
        title="Authentication Error"
        message={error || 'An error occurred during authentication'}
        onRetry={handleRetryAuth}
      />
    </BlurLoader>
  );
};
