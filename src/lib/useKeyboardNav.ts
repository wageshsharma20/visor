import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { useCameraStore } from '@/stores/cameraStore';

export function useKeyboardNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const leaderPressedRef = useRef(false);
  const leaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    showBoxes,
    setShowBoxes,
    showLabels,
    setShowLabels,
    showTrails,
    setShowTrails,
  } = useUiStore();

  const { paused, setPaused } = useCameraStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when inside input fields
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Handle 'g' leader key sequence (e.g., 'g' then 'l')
      if (leaderPressedRef.current) {
        leaderPressedRef.current = false;
        if (leaderTimerRef.current) {
          clearTimeout(leaderTimerRef.current);
          leaderTimerRef.current = null;
        }

        switch (key) {
          case 'l':
            e.preventDefault();
            navigate('/live');
            return;
          case 'm':
            e.preventDefault();
            navigate('/models');
            return;
          case 'h':
            e.preventDefault();
            navigate('/history');
            return;
          default:
            break;
        }
      }

      if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        leaderPressedRef.current = true;
        if (leaderTimerRef.current) clearTimeout(leaderTimerRef.current);
        leaderTimerRef.current = setTimeout(() => {
          leaderPressedRef.current = false;
        }, 1000);
        return;
      }

      // Single-key shortcuts for live feed controls
      if (location.pathname === '/live' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (key === 'b') {
          e.preventDefault();
          setShowBoxes(!showBoxes);
        } else if (key === 'l') {
          e.preventDefault();
          setShowLabels(!showLabels);
        } else if (key === 't') {
          e.preventDefault();
          setShowTrails(!showTrails);
        } else if (key === 'f') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('visor:toggle-fullscreen'));
        } else if (e.code === 'Space') {
          e.preventDefault();
          setPaused(!paused);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (leaderTimerRef.current) clearTimeout(leaderTimerRef.current);
    };
  }, [
    navigate,
    location.pathname,
    showBoxes,
    setShowBoxes,
    showLabels,
    setShowLabels,
    showTrails,
    setShowTrails,
    paused,
    setPaused,
  ]);
}
