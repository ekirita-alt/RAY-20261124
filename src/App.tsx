/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  appData, 
  SolutionCategory, 
  SolutionItem 
} from './data/solutionsData';
import { 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronDown,
  Sparkles,
  Play,
  Pause,
  X,
  Maximize,
  Minimize,
  Video,
  FileText,
  Presentation,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { formatSlideEmbedUrl } from './utils/slideUrl';
// Official RAY JAPAN Logo component
const RayLogo = () => (
  <div className="flex items-center gap-2 select-none">
    <svg 
      viewBox="0 0 64.7 26.7" 
      className="h-6 sm:h-7 w-auto text-[#3CB4E5] transition-transform duration-200 group-hover:scale-105"
      fill="currentColor"
      aria-label="RAY"
    >
      <path d="M30.4,17.5c0,0-1,0-1.7-0.4c-2.3-1-2.3-3.9-2.3-3.9c0-3.2,2.1-3.9,3-4.1C30,9,30.6,8.9,31.1,8.9 c0,0,2.8-0.1,2.8,0.7l0,6.9C33.9,16.5,34,17.5,30.4,17.5 M33.8,6.1h-3.9c-8.1,0-8.8,6.5-8.8,6.5c-0.2,1-0.1,2.6,0.6,4.1 c1.5,3,4.5,3.9,7.6,3.9c0,0,3.2,0,4.8-1.2c0,0,1.7,1.2,5.2,1.2c0,0,0,0,0,0V8.2C39.3,6.9,37.7,6.2,33.8,6.1 M64.7,6.2L52.8,24.6 c0,0-2.1,2.6-7,2c0,0,0,0,0,0l4.7-7.2L41.9,6.2c0,0,0,0,0,0c4.8-0.5,6.6,2.1,6.6,2.1l4.7,6.9l4.5-7C57.7,8.2,59.7,5.8,64.7,6.2 C64.7,6.2,64.7,6.2,64.7,6.2 M19.9,20.6c-5,0.2-6.8-1.5-6.8-1.5l-5.5-6.4c-2-2.4,0.2-2.6,0.2-2.6c5.2,0.1,5.1-3.7,5.1-3.7 C13,3,9.6,2.9,9.6,2.9H5.9c-0.1,0-0.4,0-0.5,0.4v17.3H0V0h12.5c6.3,0.1,5.9,6.2,5.9,6.2c-0.2,5.4-5.9,5.7-5.9,5.7L19.9,20.6 C20,20.6,20,20.6,19.9,20.6"/>
    </svg>
    <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-300 uppercase pl-2 border-l border-slate-700">
      JAPAN
    </span>
  </div>
);

const topBgmAudio = '/audio/top_bgm.mp3';


export default function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<'home' | 'detail'>('home');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('rayface');
  const [activeItemId, setActiveItemId] = useState<string>('oneshot');
  // Expanded state for Level-2 groups (default: empty / all closed until clicked)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Concept Movie Modal state for top page
  const [isConceptModalOpen, setIsConceptModalOpen] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Audio & Playback state
  const [isMuted, setIsMuted] = useState<boolean>(true); // Top page BGM OFF (muted) by default
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [animKey, setAnimKey] = useState<number>(0);
  
  // Active media tab ('video' | 'slide')
  const [activeMediaType, setActiveMediaType] = useState<'video' | 'slide'>('video');
  // Slide iframe reset key (allows returning back to slide 1 at any moment)
  const [slideResetKey, setSlideResetKey] = useState<number>(0);

  // Video element reference
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Slide iframe reference
  const slideIframeRef = useRef<HTMLIFrameElement | null>(null);
  // Concept video modal reference
  const conceptVideoRef = useRef<HTMLVideoElement | null>(null);
  // Audio element reference for video BGM with looping
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Active Category & Item
  const activeCategory: SolutionCategory = appData[activeCategoryId] || appData['rayface'];
  const activeItem: SolutionItem = 
    activeCategory.items.find(item => item.id === activeItemId) || activeCategory.items[0];

  // Active Slide URL (clean continuous embed URL for smooth presentation animations)
  const activeSlideUrl = `${formatSlideEmbedUrl(activeItem.slideUrl || activeCategory.defaultSlideUrl)}&rm=minimal`;

  // Graphy Orange & White Theme Trigger (When viewing Graphy detail page)
  const isGraphyTheme = currentView === 'detail' && activeCategoryId === 'graphy';
  // Slides-Only Mode (Total Lineup category or items without video such as 推奨環境)
  const isSlidesOnly = activeCategoryId === 'lineup' || !!activeItem.slidesOnly || !activeItem.videoUrl;
  // External Embed Video Mode (e.g. Google Drive preview iframe)
  const isIframeVideo = !!activeItem.videoUrl && (
    activeItem.videoUrl.includes('drive.google.com') ||
    activeItem.videoUrl.includes('youtube.com') ||
    activeItem.videoUrl.includes('youtu.be') ||
    activeItem.videoUrl.includes('vimeo.com')
  );

  // Open category from Home
  // Play video with unmuted sound immediately (optimized single-call flow)
  const startVideoPlayback = (targetUrl?: string) => {
    const video = videoRef.current;
    if (!video) return;
    
    if (targetUrl) {
      const currentSrc = video.currentSrc || video.src;
      if (!currentSrc.endsWith(targetUrl)) {
        video.src = targetUrl;
      }
    }
    
    // Default is unmuted: ensure sound is on immediately
    video.muted = isMuted;
    video.volume = 1.0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsVideoPlaying(true);
      }).catch((err) => {
        console.warn('Playback with sound policy error:', err);
        if (video) {
          video.muted = true;
          video.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(() => {
            setIsVideoPlaying(false);
          });
        }
      });
    }
  };

  // Toggle expand state for a group (accordion: automatically closes other groups when one is selected/opened)
  const toggleGroup = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willOpen = !expandedGroups[groupId];
    if (willOpen) {
      setExpandedGroups({ [groupId]: true });
      // When opening a group, if currently active item is not in this group, select the first item of this group
      const currentItem = activeCategory.items.find(it => it.id === activeItemId);
      if (currentItem?.groupId !== groupId) {
        const targetEntry = activeCategory.entries.find(
          entry => entry.type === 'group' && entry.group.id === groupId
        );
        if (targetEntry && targetEntry.type === 'group' && targetEntry.group.items.length > 0) {
          const firstSub = targetEntry.group.items[0];
          const itemSlidesOnly = activeCategoryId === 'lineup' || !!firstSub.slidesOnly || !firstSub.videoUrl;
          setActiveItemId(firstSub.id);
          setActiveMediaType(itemSlidesOnly ? 'slide' : 'video');
          setAnimKey(prev => prev + 1);
          if (!itemSlidesOnly) {
            setIsMuted(false);
          }
        }
      }
    } else {
      setExpandedGroups({});
    }
  };

  // Open category from Home (optional targetItemId for direct deep-linking)
  const handleOpenCategory = (categoryId: string, targetItemId?: string) => {
    const category = appData[categoryId];
    if (!category) return;
    setActiveCategoryId(categoryId);
    const chosenItem = targetItemId 
      ? category.items.find(it => it.id === targetItemId) || category.items[0]
      : category.items[0];
    const itemSlidesOnly = categoryId === 'lineup' || !!chosenItem.slidesOnly || !chosenItem.videoUrl;
    setActiveItemId(chosenItem.id);
    setActiveMediaType(itemSlidesOnly ? 'slide' : 'video');
    
    // Groups are closed from the start; open ONLY if a specific item within it was targeted
    if (targetItemId && chosenItem.groupId) {
      setExpandedGroups({
        [chosenItem.groupId]: true
      });
    } else {
      setExpandedGroups({});
    }

    // Default unmuted for video items: screen transition starts sound immediately
    if (!itemSlidesOnly) {
      setIsMuted(false);
    }
    setCurrentView('detail');
    setAnimKey(prev => prev + 1);
  };

  // Back to Home
  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveMediaType('video');
    setExpandedGroups({});
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    // Return to home with BGM OFF (muted) by default
    setIsMuted(true);
    if (bgmAudioRef.current) {
      bgmAudioRef.current.muted = true;
      bgmAudioRef.current.pause();
      bgmAudioRef.current.currentTime = 0;
    }
  };

  // Select item (either standalone middle item or sub-item in a group)
  const handleSelectSubItem = (itemId: string) => {
    if (itemId === activeItemId) return;
    const selectedItem = activeCategory.items.find(it => it.id === itemId);
    const itemSlidesOnly = activeCategoryId === 'lineup' || !!selectedItem?.slidesOnly || !selectedItem?.videoUrl;
    setActiveItemId(itemId);
    setActiveMediaType(itemSlidesOnly ? 'slide' : 'video');
    setAnimKey(prev => prev + 1);

    if (selectedItem?.groupId) {
      // Sub-item in a group: keep only its parent group open and close all other groups
      setExpandedGroups({
        [selectedItem.groupId]: true
      });
    } else {
      // Standalone middle item (no sub-items) selected: automatically close all group tabs!
      setExpandedGroups({});
    }

    // Immediately unmuted sound on item selection (when video is used)
    if (!itemSlidesOnly) {
      setIsMuted(false);
    }
  };

  // Switch media type tab ('video' | 'slide')
  const handleSwitchMediaType = (type: 'video' | 'slide') => {
    setActiveMediaType(type);
    if (type === 'slide') {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    } else {
      if (videoRef.current && !isIframeVideo && activeItem.videoUrl) {
        startVideoPlayback(activeItem.videoUrl);
      }
    }
  };

  // Reset slide back to the beginning (Slide 1)
  const handleResetSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSlideResetKey(prev => prev + 1);
  };

  // Toggle Video Play / Pause
  const handleTogglePlayVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      startVideoPlayback();
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  // Universal Toggle Mute (Linked between Top Page & Detail Pages)
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
      }
      if (conceptVideoRef.current) {
        conceptVideoRef.current.muted = nextMuted;
      }
      if (bgmAudioRef.current) {
        if (nextMuted) {
          bgmAudioRef.current.pause();
        } else if (currentView === 'home' && !isConceptModalOpen) {
          bgmAudioRef.current.muted = false;
          bgmAudioRef.current.play().catch(() => {});
        }
      }
      return nextMuted;
    });
  };

  // Modal open/close handlers for Face-Driven Dentistry Concept Film
  const handleOpenConceptModal = () => {
    setIsMuted(false);
    setIsConceptModalOpen(true);
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
  };

  const handleCloseConceptModal = () => {
    setIsConceptModalOpen(false);
    setCurrentView('home');
    setIsMuted(true);
    if (bgmAudioRef.current) {
      bgmAudioRef.current.muted = true;
      bgmAudioRef.current.pause();
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(activeFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Toggle Fullscreen handler
  const handleToggleFullscreen = async () => {
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFs) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Close concept modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConceptModalOpen) {
        handleCloseConceptModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConceptModalOpen]);

  // Sync video element muted property whenever isMuted changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (conceptVideoRef.current) {
      conceptVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Top Page BGM Controller: strictly active only when on 'home' view, modal is closed, and sound is ON (!isMuted)
  useEffect(() => {
    if (currentView === 'home' && !isConceptModalOpen) {
      if (!isMuted && bgmAudioRef.current) {
        bgmAudioRef.current.muted = false;
        bgmAudioRef.current.play().catch(() => {});
      } else if (bgmAudioRef.current) {
        bgmAudioRef.current.muted = true;
        bgmAudioRef.current.pause();
      }
    } else {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
    }
  }, [currentView, isMuted, isConceptModalOpen]);

  // Handle browser autoplay policies on top page: trigger unmuted resume on first interaction
  // Handle browser autoplay policies on top page: trigger unmuted resume once on first interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      if (currentView === 'home' && !isMuted && !isConceptModalOpen && bgmAudioRef.current) {
        bgmAudioRef.current.muted = false;
        bgmAudioRef.current.play().catch(() => {});
      }
      if (currentView === 'detail' && !isMuted && videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [currentView, isMuted, isConceptModalOpen]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  // Ensure video updates and plays smoothly with sound when screen or active item changes
  useEffect(() => {
    if (currentView === 'detail' && videoRef.current) {
      if (activeMediaType === 'video' && !isSlidesOnly && !isIframeVideo && activeItem.videoUrl) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.volume = 1.0;
        startVideoPlayback(activeItem.videoUrl);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    } else if (currentView === 'home' && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [activeItemId, currentView, activeMediaType, isSlidesOnly, isIframeVideo]);

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#0a1128] text-white flex flex-col font-sans select-none">
      
      {/* ================= Universal Top Status & Utility Bar ================= */}
      <header className="h-14 px-3 sm:px-6 bg-[#0c142b]/95 border-b border-[#33415c]/60 flex items-center justify-between shrink-0 z-30">
        {/* Brand Zone */}
        <div 
          onClick={handleBackToHome}
          className="flex items-center cursor-pointer group"
        >
          <RayLogo />
        </div>

        {/* Center Breadcrumb (Detail view only) */}
        {currentView === 'detail' && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <button 
              onClick={handleBackToHome}
              className={`transition-colors cursor-pointer ${isGraphyTheme ? 'hover:text-orange-400' : 'hover:text-cyan-400'}`}
            >
              ホーム
            </button>
            <span className="text-slate-600">/</span>
            <span className={`${isGraphyTheme ? 'text-orange-400' : 'text-cyan-400'} font-semibold`}>{activeCategory.title}</span>
            {activeItem.groupTitle && (
              <>
                <span className="text-slate-600">/</span>
                <span className={`${isGraphyTheme ? 'text-orange-300' : 'text-cyan-300'} font-semibold truncate max-w-xs`}>
                  {activeItem.groupTitle}
                </span>
              </>
            )}
            {activeCategory.title !== activeItem.title && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-white truncate max-w-xs font-medium">
                  {activeItem.title}
                </span>
              </>
            )}
          </div>
        )}

        {/* Action Controls Zone */}
        <div className="flex items-center gap-2 min-h-[36px]">
          {/* Universal Sound Mute On/Off Button (Icon Only) */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'サウンドをON' : 'ミュート'}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer ${
              !isMuted 
                ? isGraphyTheme
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.35)] hover:bg-orange-500/30'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,168,255,0.35)] hover:bg-cyan-500/30' 
                : 'bg-slate-900/70 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {!isMuted ? (
              <Volume2 className={`w-4 h-4 ${isGraphyTheme ? 'text-orange-400' : 'text-cyan-400'} animate-pulse`} />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fullscreen Button: Only visible when NOT in fullscreen. In fullscreen, exit only via ESC */}
          {!isFullscreen && (
            <button
              onClick={handleToggleFullscreen}
              aria-label="全画面表示"
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer bg-slate-900/70 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500"
            >
              <Maximize className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {/* ================= Viewport Body ================= */}
      <main className="relative flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        
        {/* ========================================================
            階層1: ホーム画面 (Home View)
           ======================================================== */}
        <div 
          className={`absolute inset-0 overflow-hidden flex flex-col items-center justify-between px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 transition-all duration-400 ease-in-out ${
            currentView === 'home' 
              ? 'opacity-100 scale-100 pointer-events-auto z-20' 
              : 'opacity-0 scale-95 pointer-events-none z-10'
          }`}
        >
          {/* ================= High-End Color Accent (Blue + Orange) Background (Style #10) ================= */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#060c1d]">
            <img 
              src="/images/blue_orange_bg.jpg" 
              alt="Blue + Orange Color Accent Background" 
              className="w-full h-full object-cover object-center transform scale-105 opacity-80 transition-opacity duration-700" 
            />
            {/* Elegant vignette & ambient radial dark shading: softens the light ribbons directly behind the cards */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 55%, rgba(6, 12, 29, 0.7) 0%, rgba(6, 12, 29, 0.35) 55%, rgba(4, 8, 20, 0.88) 100%)'
              }}
            />
            {/* Soft vertical gradient veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060c1d]/90 via-transparent to-[#071126]/60" />
            
            {/* Subtle high-tech ambient glows matching blue and orange lights */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl h-full flex flex-col justify-between items-center py-2 sm:py-3">
            
            {/* Main Title Lockup - Luminous Title for Face-Driven Dentistry */}
            <div className="text-center shrink-0 my-1 sm:my-2">
              <button
                type="button"
                onClick={handleOpenConceptModal}
                className="group relative inline-flex items-center cursor-pointer transition-all duration-300 focus:outline-none select-none px-5 sm:px-8 py-2 sm:py-2.5 bg-transparent hover:scale-[1.02] active:scale-[0.99] overflow-hidden rounded-full"
              >
                {/* Flowing Light Beam Sweep */}
                <div 
                  className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none animate-light-sweep mix-blend-screen"
                  aria-hidden="true"
                />

                {/* Title & Play Button (Restored glowing light effect) */}
                <div className="relative flex items-center gap-3 sm:gap-4 bg-transparent">
                  <h1 className="face-driven-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_25px_rgba(0,168,255,0.5)] drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                    Face-Driven Dentistry
                  </h1>
                  <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 flex items-center justify-center border border-cyan-400/50 group-hover:border-cyan-300 transition-all duration-300 shadow-[0_0_18px_rgba(0,168,255,0.45)] group-hover:scale-110 shrink-0">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  </span>
                </div>
              </button>
            </div>

            {/* Main Cards Area (2x2 Grid + Slimmer Graphy Card above HISTRY, with uniform gap-3) */}
            <div className="w-full flex-1 flex flex-col justify-center gap-3 sm:gap-3.5 my-auto max-h-[calc(100vh-13.5rem)]">
              {/* 2x2 Grid of Primary Solution Cards (Emphasized ~79% height) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 w-full h-[79%]">
                {['5d', 'rayface', 'cadcam', 'lineup'].map((catKey) => {
                  const cat = appData[catKey];
                  if (!cat) return null;
                  return (
                    <button
                      key={catKey}
                      onClick={() => handleOpenCategory(catKey)}
                      className="group relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 natural-border-pulse hover:border-[#00a8ff] bg-gradient-to-br from-[#141e33] to-[#0a1122] hover:from-[#1a2844] hover:to-[#0f172a] text-white cursor-pointer transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.85)] active:scale-[0.99] text-center overflow-hidden h-full z-10"
                    >
                      {/* Background visual artwork preview */}
                      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none overflow-hidden">
                        <img 
                          src={cat.heroImage} 
                          alt={cat.title}
                          className={`w-full h-full object-cover transition-transform duration-700 ${cat.imagePosition || 'object-center'} scale-100 group-hover:scale-105`} 
                        />
                      </div>

                      {/* Category Title */}
                      <div className="relative z-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-normal md:tracking-wide text-white group-hover:text-cyan-300 transition-colors drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)] text-center px-3 leading-snug">
                        {cat.title}
                      </div>

                      {/* Hover glow light */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-56 h-12 bg-cyan-400/25 blur-xl rounded-full group-hover:bg-cyan-400/50 transition-colors pointer-events-none" />
                    </button>
                  );
                })}
              </div>

              {/* Full Width (2 cards span) Slimmer Card: Graphy (Height shortened to ~18%, uniform vertical gap) */}
              {appData['graphy'] && (
                <button
                  onClick={() => handleOpenCategory('graphy')}
                  className="group relative flex items-center justify-center w-full h-[18%] rounded-xl sm:rounded-2xl border-2 natural-border-pulse-orange hover:border-orange-500 bg-gradient-to-br from-[#141e33] to-[#0a1122] hover:from-[#1a2844] hover:to-[#0f172a] text-white cursor-pointer transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.85)] active:scale-[0.99] overflow-hidden z-10"
                >
                  {/* Background visual artwork (matched opacity-30 / hover:opacity-50 to other cards) */}
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none overflow-hidden flex items-center justify-center">
                    <img 
                      src={appData['graphy'].heroImage} 
                      alt="Graphy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 scale-100 group-hover:scale-105" 
                    />
                  </div>

                  {/* Single Glowing Orange Title (Matched font size with other cards) */}
                  <div className="relative z-10 flex items-center justify-center px-4">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-normal md:tracking-wide text-orange-400 group-hover:text-amber-200 transition-colors drop-shadow-[0_0_16px_rgba(249,115,22,0.95)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      Graphy
                    </span>
                  </div>

                  {/* Hover Orange Glow Ambient Light under the button */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-10 bg-orange-500/25 blur-xl rounded-full group-hover:bg-orange-500/50 transition-colors pointer-events-none" />
                </button>
              )}
            </div>

            {/* Bottom HISTRY Button (Uniform gap spacing directly below Graphy) */}
            {appData['history'] && (
              <div className="w-full flex justify-center shrink-0 mt-3 sm:mt-3.5 mb-1">
                <button
                  onClick={() => handleOpenCategory('history')}
                  className="group relative px-9 sm:px-12 py-2 sm:py-2.5 rounded-full border border-sky-500/50 hover:border-cyan-400 bg-gradient-to-r from-sky-950 via-blue-950 to-slate-900 hover:from-sky-900 hover:to-blue-900 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.85)] hover:shadow-[0_0_28px_rgba(56,189,248,0.45)] active:scale-95 flex items-center justify-center z-10"
                >
                  <span className="text-sm sm:text-base md:text-lg font-black tracking-[0.25em] uppercase text-sky-400 group-hover:text-cyan-200 transition-colors drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]">
                    HISTRY
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            階層2 & 3: 詳細画面 (Detail View)
           ======================================================== */}
        <div 
          className={`absolute inset-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden overscroll-contain touch-pan-y transition-all duration-400 ease-in-out ${
            currentView === 'detail' 
              ? 'opacity-100 scale-100 pointer-events-auto z-20' 
              : 'opacity-0 scale-95 pointer-events-none z-10'
          }`}
        >
          {/* ================= Sidebar (Narrowed ~20% width) ================= */}
          <aside className={`w-full md:w-[22%] lg:w-[19%] xl:w-[17%] md:min-w-[200px] md:max-w-[250px] p-2.5 sm:p-3.5 md:p-4 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[34vh] sm:max-h-[38vh] md:max-h-none transition-colors duration-300 border-b-2 md:border-b-0 md:border-r-2 ${
            isGraphyTheme
              ? 'bg-white border-orange-200 text-slate-800 shadow-sm'
              : 'bg-[#121826] border-[#00a8ff]/30 text-white'
          }`}>
            <div>
              {/* Back to Home Button */}
              <button
                id="btn-back"
                onClick={handleBackToHome}
                className={`w-full mb-3 sm:mb-5 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all cursor-pointer shadow-md ${
                  isGraphyTheme
                    ? 'bg-white hover:bg-orange-500 hover:text-white border-2 border-orange-300 text-slate-800 shadow-sm group'
                    : 'bg-transparent hover:bg-[#1e293b] active:bg-[#33415c] border-2 border-[#33415c] text-slate-300 hover:text-white'
                }`}
              >
                <ChevronLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${isGraphyTheme ? 'text-orange-500 group-hover:text-white' : 'text-[#00a8ff]'}`} />
                <span>ホームに戻る</span>
              </button>

              {/* Category Title */}
              <div className={`mb-2.5 sm:mb-4 pb-2 sm:pb-3 border-b-2 ${isGraphyTheme ? 'border-orange-200' : 'border-[#33415c]'}`}>
                <div className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold ${isGraphyTheme ? 'text-orange-600' : 'text-cyan-400'}`}>Category</div>
                <h2 className={`text-lg sm:text-xl md:text-2xl font-black ${isGraphyTheme ? 'text-orange-500' : 'text-[#00a8ff]'}`}>
                  {activeCategory.title}
                </h2>
                {activeCategory.subText && (
                  <div className={`text-[11px] sm:text-xs mt-0.5 sm:mt-1 ${isGraphyTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {activeCategory.subText}
                  </div>
                )}
              </div>

              {/* Submenu Item Entries (3-tier hierarchy: 中項目 & 小項目) - HISTRYは階層が1つのため非表示 */}
              {activeCategoryId !== 'history' && (
                <div className="space-y-1.5 sm:space-y-2">
                {activeCategory.entries.map((entry) => {
                  if (entry.type === 'item') {
                    const item = entry.item;
                    const isActive = activeItemId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSubItem(item.id)}
                        className={`w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 border-2 cursor-pointer flex items-center justify-between group ${
                          isActive
                            ? isGraphyTheme
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.35)] md:translate-x-1.5 font-bold'
                              : 'bg-[#00a8ff]/20 border-[#00a8ff] text-white shadow-[0_0_15px_rgba(0,168,255,0.35)] md:translate-x-1.5'
                            : isGraphyTheme
                              ? 'bg-white border-orange-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                              : 'bg-white/5 border-[#33415c]/70 text-slate-300 hover:bg-white/10 hover:border-slate-500'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        {isActive && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isGraphyTheme ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-cyan-400 shadow-[0_0_6px_#00a8ff]'}`} />
                        )}
                      </button>
                    );
                  } else {
                    const group = entry.group;
                    const isGroupExpanded = Boolean(expandedGroups[group.id]);
                    const isAnyChildActive = group.items.some(it => it.id === activeItemId);
                    return (
                      <div
                        key={group.id}
                        className={`rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                          isAnyChildActive
                            ? isGraphyTheme
                              ? 'bg-orange-50 border-orange-400/50 p-1.5 sm:p-2 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                              : 'bg-[#00a8ff]/15 border-cyan-500/50 p-1.5 sm:p-2 shadow-[0_0_15px_rgba(0,168,255,0.2)]'
                            : isGroupExpanded
                            ? isGraphyTheme
                              ? 'bg-orange-50/50 border-orange-300/60 p-1.5 sm:p-2'
                              : 'bg-white/5 border-cyan-500/30 p-1.5 sm:p-2'
                            : isGraphyTheme
                              ? 'bg-white border-orange-200/80 p-1.5 sm:p-2 hover:bg-orange-50/60'
                              : 'bg-white/5 border-[#33415c]/70 p-1.5 sm:p-2 hover:bg-white/10 hover:border-slate-500'
                        }`}
                      >
                        {/* Group Header (中項目) */}
                        <button
                          onClick={(e) => toggleGroup(group.id, e)}
                          className={`w-full flex items-center justify-between px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-bold transition-colors cursor-pointer group ${
                            isGraphyTheme
                              ? isGroupExpanded ? 'text-orange-600 bg-orange-100/60' : 'text-slate-800 hover:bg-orange-50'
                              : isGroupExpanded ? 'text-cyan-300 hover:bg-slate-800/60' : 'text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-bold tracking-wide">{group.title}</span>
                          <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                            isGroupExpanded 
                              ? isGraphyTheme ? 'rotate-0 text-orange-500' : 'rotate-0 text-cyan-400' 
                              : isGraphyTheme ? '-rotate-90 text-slate-400 group-hover:text-slate-700' : '-rotate-90 text-slate-400 group-hover:text-white'
                          }`} />
                        </button>

                        {/* Sub-items list (小項目) */}
                        {isGroupExpanded && (
                          <div className={`pl-2 sm:pl-3 ml-2 sm:ml-2.5 border-l-2 space-y-1 mt-1 mb-0.5 ${isGraphyTheme ? 'border-orange-300' : 'border-cyan-500/30'}`}>
                            {group.items.map((subItem) => {
                              const isSubActive = activeItemId === subItem.id;
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSelectSubItem(subItem.id)}
                                  className={`w-full text-left px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all duration-200 border cursor-pointer flex items-center justify-between ${
                                    isSubActive
                                      ? isGraphyTheme
                                        ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)] md:translate-x-1'
                                        : 'bg-[#00a8ff]/25 border-[#00a8ff] text-white font-bold shadow-[0_0_12px_rgba(0,168,255,0.3)] md:translate-x-1'
                                      : isGraphyTheme
                                        ? 'bg-transparent border-transparent text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                                        : 'bg-transparent border-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-slate-700/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                    <span className="truncate">{subItem.title}</span>
                                  </div>
                                  {isSubActive && (
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isGraphyTheme ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-cyan-400 shadow-[0_0_6px_#00a8ff]'}`} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  })}
                </div>
              )}
            </div>

            {/* Bottom Quick Category Switcher */}
            <div className={`mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t ${isGraphyTheme ? 'border-orange-200' : 'border-slate-800'}`}>
              <div className={`text-[10px] font-mono uppercase mb-1.5 sm:mb-2 ${isGraphyTheme ? 'text-orange-600 font-semibold' : 'text-slate-400'}`}>Quick Jump</div>
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                {Object.entries(appData).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => handleOpenCategory(key)}
                    className={`text-[11px] sm:text-xs py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-lg font-medium transition-colors text-center truncate cursor-pointer ${
                      activeCategoryId === key
                        ? isGraphyTheme
                          ? 'bg-orange-500 text-white font-bold shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                          : 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,168,255,0.4)]'
                        : isGraphyTheme
                          ? 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ================= Main Content (Expanded width ~80%) ================= */}
          <section className={`relative flex-1 p-3.5 sm:p-6 md:p-7 lg:p-8 flex flex-col overflow-y-auto transition-colors duration-300 ${
            isGraphyTheme
              ? 'bg-gradient-to-br from-white via-orange-50/20 to-slate-100 text-slate-900'
              : 'bg-[#060d1f] text-white'
          }`}>
            {/* Color Accent (Blue + Orange) Background for 2nd tier (non-Graphy categories) */}
            {!isGraphyTheme && (
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#060c1d]">
                <img 
                  src="/images/blue_orange_bg.jpg" 
                  alt="Blue + Orange Color Accent Background" 
                  className="w-full h-full object-cover object-center opacity-45 mix-blend-screen scale-105" 
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at 75% 25%, rgba(6, 12, 29, 0.4) 0%, rgba(4, 8, 20, 0.92) 100%)'
                  }}
                />
              </div>
            )}
            
            {/* Media Type Switcher Tab Bar (動画 / 詳細 - スライド専用項目では非表示) */}
            {!isSlidesOnly && (
              <div className="relative z-10 flex items-center justify-start mb-2.5 sm:mb-3.5">
              {/* Outer Ambient Glow Aura */}
              <div className="relative inline-flex">
                <div 
                  className={`absolute -inset-1 rounded-2xl blur-md opacity-45 pointer-events-none transition-all duration-500 ${
                    isGraphyTheme ? 'bg-orange-500/40' : 'bg-cyan-500/40'
                  }`} 
                  aria-hidden="true" 
                />

                {/* Segmented Controller Tab Bar Container with Animated Neon Border Glow */}
                <div 
                  role="tablist"
                  aria-label="コンテンツ表示切り替え"
                  className={`relative inline-flex items-center p-1 sm:p-1.5 rounded-2xl transition-all duration-300 ${
                    isGraphyTheme
                      ? 'bg-white/95 backdrop-blur-md border-2 border-orange-400 animate-tab-glow-orange'
                      : 'bg-slate-900/90 backdrop-blur-md border border-cyan-400/60 animate-tab-glow'
                  }`}
                >
                  {/* Tab 1: 動画 */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeMediaType === 'video'}
                    onClick={() => handleSwitchMediaType('video')}
                    className={`group relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                      activeMediaType === 'video'
                        ? isGraphyTheme
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black shadow-[0_0_22px_rgba(249,115,22,0.65),inset_0_1px_1px_rgba(255,255,255,0.6)] scale-[1.03]'
                          : 'bg-gradient-to-r from-[#00d4ff] via-[#00b4ff] to-[#0090f0] text-slate-950 font-black shadow-[0_0_24px_rgba(0,195,255,0.75),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-[1.03]'
                        : isGraphyTheme
                          ? 'text-slate-600 hover:text-orange-600 hover:bg-orange-50 font-bold hover:scale-[1.01]'
                          : 'text-slate-300 hover:text-white hover:bg-white/10 font-bold hover:scale-[1.01]'
                    }`}
                  >
                    {/* Shimmer light-sweep effect on active tab */}
                    {activeMediaType === 'video' && (
                      <span className="absolute inset-0 w-full h-full overflow-hidden rounded-xl pointer-events-none" aria-hidden="true">
                        <span className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-tab-shimmer pointer-events-none" />
                      </span>
                    )}

                    <Video className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      activeMediaType === 'video'
                        ? isGraphyTheme ? 'text-white' : 'text-slate-950'
                        : isGraphyTheme ? 'text-orange-500' : 'text-cyan-400'
                    }`} />
                    <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight">動画</span>
                    {activeMediaType === 'video' && (
                      <span className={`w-2 h-2 rounded-full animate-ping ml-0.5 shrink-0 ${
                        isGraphyTheme ? 'bg-white' : 'bg-slate-950'
                      }`} />
                    )}
                  </button>

                  {/* Tab 2: 詳細 */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeMediaType === 'slide'}
                    onClick={() => handleSwitchMediaType('slide')}
                    className={`group relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                      activeMediaType === 'slide'
                        ? isGraphyTheme
                          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black shadow-[0_0_22px_rgba(249,115,22,0.65),inset_0_1px_1px_rgba(255,255,255,0.6)] scale-[1.03]'
                          : 'bg-gradient-to-r from-[#00d4ff] via-[#00b4ff] to-[#0090f0] text-slate-950 font-black shadow-[0_0_24px_rgba(0,195,255,0.75),inset_0_1px_1px_rgba(255,255,255,0.7)] scale-[1.03]'
                        : isGraphyTheme
                          ? 'text-slate-600 hover:text-orange-600 hover:bg-orange-50 font-bold hover:scale-[1.01]'
                          : 'text-slate-300 hover:text-white hover:bg-white/10 font-bold hover:scale-[1.01]'
                    }`}
                  >
                    {/* Shimmer light-sweep effect on active tab */}
                    {activeMediaType === 'slide' && (
                      <span className="absolute inset-0 w-full h-full overflow-hidden rounded-xl pointer-events-none" aria-hidden="true">
                        <span className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-tab-shimmer pointer-events-none" />
                      </span>
                    )}

                    <Presentation className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      activeMediaType === 'slide'
                        ? isGraphyTheme ? 'text-white' : 'text-slate-950'
                        : isGraphyTheme ? 'text-orange-500' : 'text-cyan-400'
                    }`} />
                    <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight">詳細</span>
                    {activeMediaType === 'slide' && (
                      <span className={`w-2 h-2 rounded-full animate-ping ml-0.5 shrink-0 ${
                        isGraphyTheme ? 'bg-white' : 'bg-slate-950'
                      }`} />
                    )}
                  </button>
                </div>
              </div>
              </div>
            )}

            {/* Media Wrapper (Expanded width & responsive height for video / slide, GPU-composited) */}
            <div className={`relative w-full h-[200px] sm:h-[300px] md:h-[55vh] lg:h-[58vh] bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-5 shrink-0 flex items-center justify-center transform-gpu ${
              isGraphyTheme
                ? 'border-2 border-orange-400/80 shadow-2xl shadow-orange-500/15'
                : 'border border-[#33415c] shadow-xl sm:shadow-2xl shadow-black/60'
            }`}>
              {activeMediaType === 'video' && !isSlidesOnly && activeItem.videoUrl ? (
                isIframeVideo ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    <iframe
                      key={`drive-video-embed-${activeItem.id}`}
                      src={activeItem.videoUrl}
                      title={`${activeItem.title} 動画`}
                      className="w-full h-full border-0 bg-black"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div 
                    onClick={handleTogglePlayVideo}
                    className="relative w-full h-full flex items-center justify-center bg-slate-950 cursor-pointer group"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <video 
                      ref={videoRef}
                      id="main-video"
                      src={activeItem.videoUrl}
                      autoPlay
                      muted={isMuted}
                      playsInline
                      preload="metadata"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      className="w-full h-full object-contain bg-black transform-gpu will-change-transform"
                      style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                    />

                    {/* Play overlay if paused */}
                    {!isVideoPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-all pointer-events-none">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform ${
                          isGraphyTheme
                            ? 'bg-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.7)]'
                            : 'bg-cyan-500/90 text-slate-950 shadow-[0_0_25px_rgba(0,168,255,0.6)]'
                        }`}>
                          <Play className={`w-6 h-6 sm:w-8 sm:h-8 ml-0.5 sm:ml-1 ${isGraphyTheme ? 'fill-white text-white' : 'fill-slate-950 text-slate-950'}`} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Authentic Google Slides Live Embed (Original Animations, Object Builds, and Slide Transitions Preserved) */
                <div className="relative w-full h-full bg-[#070c18] flex items-center justify-center overflow-hidden">
                  <iframe
                    ref={slideIframeRef}
                    key={`live-google-slide-embed-${activeItem.id}-${slideResetKey}`}
                    src={activeSlideUrl}
                    title={`${activeItem.title} プレゼンテーション`}
                    className="w-full h-full border-0 bg-transparent"
                    allowFullScreen
                    loading="lazy"
                  />

                  {/* Non-intrusive Tap / Click Prompt Icon on the Right - Balanced refined size */}
                  <div 
                    className="absolute right-3 sm:right-4 md:right-5 top-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center z-10"
                    aria-hidden="true"
                  >
                    {/* Outer animated ripple */}
                    <div className={`absolute w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 animate-tap-ripple ${
                      isGraphyTheme ? 'border-orange-400/70 bg-orange-400/10' : 'border-cyan-400/60 bg-cyan-400/10'
                    }`} />
                    
                    {/* Floating Hand/Tap Icon with gentle refined breathing pulse */}
                    <div className={`relative w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full flex items-center justify-center shadow-lg animate-pulse-tap backdrop-blur-[2px] transition-all ${
                      isGraphyTheme
                        ? 'bg-white/95 border-2 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.45)]'
                        : 'bg-slate-950/75 border-2 border-cyan-400/70 shadow-[0_0_22px_rgba(0,195,255,0.5)]'
                    }`}>
                      <svg 
                        viewBox="0 0 24 24" 
                        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ml-0.5 mt-0.5 ${
                          isGraphyTheme 
                            ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.65)]' 
                            : 'text-cyan-300 drop-shadow-[0_0_10px_rgba(0,210,255,0.7)]'
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.85" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        {/* Pointing Hand Icon */}
                        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                      </svg>
                    </div>
                  </div>

                  {/* Reset to Start (最初に戻る) Quick Button - Positioned slightly further to the right */}
                  <button
                    type="button"
                    onClick={handleResetSlide}
                    className={`absolute top-2.5 right-1.5 sm:top-3 sm:right-2 md:right-2 px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px] sm:text-xs font-medium shadow-lg backdrop-blur-sm transition-all duration-200 cursor-pointer group z-20 ${
                      isGraphyTheme
                        ? 'bg-white hover:bg-orange-50 border border-orange-200 hover:border-orange-400 text-slate-800 hover:text-orange-600'
                        : 'bg-slate-950/70 hover:bg-slate-900 border border-slate-700/60 hover:border-cyan-400/80 text-slate-300 hover:text-cyan-300'
                    }`}
                  >
                    <RotateCcw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isGraphyTheme ? 'text-orange-500' : 'text-cyan-400'} group-hover:-rotate-90 transition-transform duration-300`} />
                    <span>最初に戻る</span>
                  </button>

                  {/* Subtle lower guard overlay to cleanly block the Google external branding link */}
                  <div 
                    className="absolute bottom-0 left-0 w-28 sm:w-36 h-8 sm:h-9 bg-transparent pointer-events-auto cursor-default z-10"
                    title=""
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  />
                </div>
              )}
            </div>

            {/* Dynamic Text Information Wrapper with smooth fade-in animation */}
            <div 
              key={`text-${activeItemId}-${animKey}`}
              className="relative z-10 flex-1 flex flex-col justify-between fade-in"
            >
              <div>
                <div className="flex flex-col gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
                  {/* 3-Tier Hierarchy Path Indicator */}
                  <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-mono ${isGraphyTheme ? 'text-orange-500 font-semibold' : 'text-cyan-400'}`}>
                    <span className={isGraphyTheme ? 'text-orange-500 font-bold tracking-wider' : 'text-slate-400'}>{activeCategory.title}</span>
                    {activeItem.groupTitle && (
                      <>
                        <span className={isGraphyTheme ? 'text-orange-400' : 'text-slate-600'}>/</span>
                        <span className={`${isGraphyTheme ? 'text-orange-500' : 'text-cyan-300'} font-semibold`}>{activeItem.groupTitle}</span>
                      </>
                    )}
                    {activeCategory.title !== activeItem.title && (
                      <>
                        <span className={isGraphyTheme ? 'text-orange-400' : 'text-slate-600'}>/</span>
                        <span className={`${isGraphyTheme ? 'text-orange-500' : 'text-white'} font-medium`}>{activeItem.title}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <h1 
                      id="content-title"
                      className={`text-lg sm:text-2xl md:text-3xl font-black tracking-tight ${isGraphyTheme ? 'text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.25)]' : 'text-white'}`}
                    >
                      {activeItem.title}
                    </h1>
                  </div>
                </div>

                {isGraphyTheme ? (
                  <div className="mt-2 sm:mt-3 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border-2 border-orange-200/90 shadow-[0_4px_16px_rgba(249,115,22,0.08)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    <span className="text-xl sm:text-2xl font-black text-orange-500 tracking-wider">
                      {activeItem.desc}
                    </span>
                  </div>
                ) : (
                  <p 
                    id="content-desc"
                    className="text-xs sm:text-base md:text-lg text-slate-300 leading-relaxed mb-2.5 sm:mb-4"
                  >
                    {activeItem.desc}
                  </p>
                )}
              </div>
            </div>

          </section>
        </div>

      </main>

      {/* Brand Concept Movie - Refined Dialog Modal (全画面ではなく快適なシアターダイアログで滑らか再生) */}
      {isConceptModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 transition-opacity duration-300 animate-fade-in"
          onClick={handleCloseConceptModal}
        >
          {/* Framed Dialog Box */}
          <div 
            className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,168,255,0.25)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (Clean overlay without title text) */}
            <button
              onClick={handleCloseConceptModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700/80 hover:border-cyan-400 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Container (16:9 ratio, hardware decode optimized) */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video
                ref={conceptVideoRef}
                src="/videos/face_forward_concept.mp4"
                autoPlay
                controls
                muted={isMuted}
                playsInline
                preload="auto"
                className="w-full h-full object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Page Background Audio Element (Looping) */}
      <audio
        ref={bgmAudioRef}
        src={topBgmAudio}
        loop
        playsInline
        preload="auto"
        onEnded={() => {
          if (bgmAudioRef.current && currentView === 'home' && !isMuted && !isConceptModalOpen) {
            bgmAudioRef.current.currentTime = 0;
            bgmAudioRef.current.play().catch(() => {});
          }
        }}
      />

    </div>
  );
}
