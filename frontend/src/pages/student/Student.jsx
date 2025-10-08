import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// --- MOCK DATA ---
// In a real application, this data would come from an API
const eventsData = [
  {
    id: 1,
    title: 'Montreal International Jazz Festival',
    category: 'Featured',
    date: '2026-06-25T19:00:00',
    location: 'Place des Arts, Montreal',
    description: 'Experience the world\'s largest jazz festival, featuring legendary artists and rising stars in the heart of downtown Montreal.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Indie Music Festival',
    category: 'Music',
    date: '2025-11-12T18:00:00',
    location: 'Parc Jean-Drapeau, Montreal',
    description: 'A two-day festival showcasing the best up-and-coming indie bands from across the country.',
    imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Startup Pitch Night',
    category: 'Business',
    date: '2025-11-05T19:00:00',
    location: 'Innovation Hub, Montreal',
    description: 'Watch the city\'s brightest entrepreneurs pitch their ideas to a panel of venture capitalists.',
    imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Advanced React Workshop',
    category: 'Technology',
    date: '2025-11-18T10:00:00',
    location: 'Online',
    description: 'Deep dive into advanced React patterns, hooks, and performance optimization techniques.',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 5,
    title: 'City Marathon 2025',
    category: 'Sports',
    date: '2025-10-19T07:00:00',
    location: 'Mount Royal Park, Montreal',
    description: 'Join thousands of runners in the annual city marathon. All skill levels welcome.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'Artisan Market Fair',
    category: 'Community',
    date: '2025-10-26T11:00:00',
    location: 'Old Port, Montreal',
    description: 'Discover unique handmade crafts, local food, and live music at our weekend market.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 7,
    title: 'Annual Tech Summit 2025',
    category: 'Featured',
    date: '2025-10-25T09:00:00',
    location: 'Convention Center, Montreal',
    description: 'Join industry leaders to discuss the future of technology, from AI to quantum computing.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 8,
    title: 'Cinephile\'s Dream: Film Noir Retrospective',
    category: 'Arts & Culture',
    date: '2025-11-20T19:00:00',
    location: 'Cinéma du Parc, Montreal',
    description: 'A month-long retrospective celebrating the dark and stylish world of classic film noir.',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963e?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 9,
    title: 'Oktoberfest Montreal',
    category: 'Food & Drink',
    date: '2025-10-11T14:00:00',
    location: 'Lachine Canal, Montreal',
    description: 'Enjoy a taste of Bavaria with craft beer, traditional food, and live oompah bands.',
    imageUrl: 'https://images.unsplash.com/photo-1598801269323-315159d84f83?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 10,
    title: 'Digital Marketing Conference',
    category: 'Education',
    date: '2025-11-22T09:00:00',
    location: 'Palais des congrès, Montreal',
    description: 'Learn the latest trends in SEO, social media, and content marketing from industry experts.',
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 11,
    title: 'Yoga & Mindfulness Retreat',
    category: 'Health & Wellness',
    date: '2025-12-06T10:00:00',
    location: 'Eastern Townships, QC',
    description: 'A full-day retreat to de-stress before exams. Includes guided meditation and yoga sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop',
  },
  {
    id: 12,
    title: 'Holiday Baking Masterclass',
    category: 'Food & Drink',
    date: '2025-12-13T13:00:00',
    location: 'Ateliers & Saveurs, Montreal',
    description: 'Learn how to create delicious holiday treats from a professional pastry chef.',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop',
  },
  {
    id: 13,
    title: 'Community Volunteer Day',
    category: 'Community',
    date: '2025-11-30T10:00:00',
    location: 'Multiple Locations, Montreal',
    description: 'Join us in giving back to the community. Choose from various projects across the city.',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 14,
    title: 'Charity Soccer Tournament',
    category: 'Sports',
    date: '2025-11-15T09:00:00',
    location: 'Concordia Stadium, Montreal',
    description: 'Form a team and compete for a good cause. All proceeds go to local youth sports programs.',
    imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 15,
    title: 'Networking for Young Professionals',
    category: 'Business',
    date: '2025-11-28T18:30:00',
    location: 'Downtown Rooftop Bar, Montreal',
    description: 'Expand your professional network in a relaxed and friendly atmosphere. Light appetizers provided.',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 16,
    title: 'Modern Art Exhibition Opening',
    category: 'Featured',
    date: '2025-12-05T19:00:00',
    location: 'Galerie d\'Art Contemporain, Montreal',
    description: 'Be the first to see the new collection from groundbreaking international and local artists.',
    imageUrl: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 17,
    title: 'The Ethics of AI: A Public Debate',
    category: 'Technology',
    date: '2025-11-26T18:00:00',
    location: 'McGill University, Leacock 132',
    description: 'Leading experts debate the moral and ethical implications of artificial intelligence in our society.',
    imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 18,
    title: 'Public Speaking Workshop',
    category: 'Education',
    date: '2025-12-02T13:00:00',
    location: 'Concordia University, Webster Library',
    description: 'Conquer your fear of public speaking and learn to deliver presentations with confidence.',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop',
  }
];

const categories = ['All', 'Featured', 'Music', 'Technology', 'Business', 'Sports', 'Community', 'Arts & Culture', 'Food & Drink', 'Health & Wellness', 'Education'];
const uniqueLocations = [...new Set(eventsData.map(event => event.location))].sort();


// --- ICONS ---
const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="10" r="3"></circle>
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
    </svg>
);

const LogoutIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

const ChevronLeftIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);

const ChevronRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

const AdjustmentsHorizontalIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);

const XMarkIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CalendarDaysIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-3 14.25h.008v.008H-3v-.008z" />
    </svg>
);

const MapPinIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const TagIcon = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

const HeartIcon = ({ className, isLiked }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const GlobeAltIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12.033m-9.284 0a9.009 9.009 0 01-5.026 2.67M11.716 12.033c-.16.953-.29 1.912-.425 2.867" />
    </svg>
);

const SunIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const MoonIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const Bars3Icon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const HomeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v.75A2.25 2.25 0 005.25 13.5h13.5A2.25 2.25 0 0021 11.25v-.75M4.5 12v7.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V12" />
    </svg>
);

const CalendarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);

const CompassIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 8.09l-2.82 5.64-5.64-2.82 2.82-5.64 5.64 2.82z" />
    </svg>
);



// --- HOOKS ---
const useCountdown = (targetDate) => {
    const countDownDate = new Date(targetDate).getTime();
    const [countDown, setCountDown] = useState(countDownDate - new Date().getTime());
    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [countDownDate]);
    return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);
    return [days, hours, minutes, seconds];
};


// --- COMPONENTS ---
const Header = ({ theme, toggleTheme, onMenuClick }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  const useOutsideAlerter = (ref, setOpenState) => {
      useEffect(() => {
        function handleClickOutside(event) {
          if (ref.current && !ref.current.contains(event.target)) {
            setOpenState(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [ref, setOpenState]);
  }

  useOutsideAlerter(userDropdownRef, setIsUserMenuOpen);
  useOutsideAlerter(langDropdownRef, setIsLangMenuOpen);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
             <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                <Bars3Icon className="h-6 w-6"/>
            </button>
            <a href="#" className="text-2xl font-bold text-indigo-600">Flemmards</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
                <span className="font-medium text-sm hidden sm:block">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <div className="relative" ref={langDropdownRef}>
                <button onClick={() => setIsLangMenuOpen(prev => !prev)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                    <GlobeAltIcon className="w-6 h-6"/>
                    <span className="font-medium text-sm">EN</span>
                </button>
                {isLangMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-colors duration-300">
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">English (EN)</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">Français (FR)</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">Español (ES)</a>
                    </div>
                )}
            </div>
            <div className="relative" ref={userDropdownRef}>
              <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-300 py-2 pl-2 pr-4">
                <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-300 transition-colors duration-300"/>
                <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300">Curtis</span>
              </button>
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300" role="menuitem">
                    <UserCircleIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"/>
                    Profile
                  </a>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300" role="menuitem">
                    <LogoutIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400"/>
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const MobileMenu = ({ isOpen, onClose }) => {
    return (
        <div className={`fixed inset-0 z-[60] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 transition-opacity duration-300"
                onClick={onClose}
                style={{ opacity: isOpen ? 1 : 0 }}
            ></div>

            {/* Menu Panel */}
            <div
                className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out"
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                    <h2 className="font-bold text-lg dark:text-white">Menu</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="p-4 flex flex-col gap-2">
                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <HomeIcon className="w-6 h-6"/> Home
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <CalendarIcon className="w-6 h-6"/> My Events
                    </a>
                    <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors duration-300">
                        <CompassIcon className="w-6 h-6"/> Explore
                    </a>
                </nav>
            </div>
        </div>
    );
};

const FeaturedEventSlide = ({ event, onViewDetails }) => {
    const [days, hours, minutes, seconds] = useCountdown(event.date);
    return (
        <div className="relative w-full h-96 flex-shrink-0">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
                <span className="inline-block bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Featured Event</span>
                <h2 className="text-4xl font-extrabold mb-4">{event.title}</h2>
                <p className="text-lg max-w-2xl mb-6">{event.description}</p>
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-4 text-center">
                        <div><span className="text-4xl font-bold">{String(days).padStart(2, '0')}</span><span className="block text-xs">Days</span></div>
                        <div><span className="text-4xl font-bold">{String(hours).padStart(2, '0')}</span><span className="block text-xs">Hours</span></div>
                        <div><span className="text-4xl font-bold">{String(minutes).padStart(2, '0')}</span><span className="block text-xs">Minutes</span></div>
                        <div><span className="text-4xl font-bold">{String(seconds).padStart(2, '0')}</span><span className="block text-xs">Seconds</span></div>
                    </div>
                    <button onClick={() => onViewDetails(event)} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 transform hover:scale-105">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeaturedEventCarousel = ({ events, onViewDetails }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        const isLastSlide = currentIndex === events.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, events.length]);

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000);
        return () => clearInterval(slideInterval);
    }, [nextSlide]);

    if (!events || events.length === 0) {
        return null;
    }

    return (
        <div className="relative h-96 rounded-xl overflow-hidden mb-12 shadow-2xl">
            <div className="relative w-full h-full flex transition-transform ease-in-out duration-500" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {events.map((event) => (
                    <FeaturedEventSlide key={event.id} event={event} onViewDetails={onViewDetails} />
                ))}
            </div>
            <div className="absolute bottom-5 right-0 left-0 z-30 flex justify-center gap-2">
                {events.map((_, slideIndex) => (
                    <div
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${currentIndex === slideIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};


const EventCard = ({ event, onViewDetails }) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const [isLiked, setIsLiked] = useState(false);

    const handleLikeClick = (e) => {
        e.stopPropagation(); // Prevent triggering other click events on the card
        setIsLiked(!isLiked);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700/50 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl group flex flex-col">
            <div className="relative">
                <img className="h-48 w-full object-cover" src={event.imageUrl} alt={event.title} />
                <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 transition-colors duration-300">{event.category}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate transition-colors duration-300">{event.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 transition-colors duration-300">{event.description}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 transition-colors duration-300">
                        <p><strong>Date:</strong> {formattedDate} at {formattedTime}</p>
                        <p><strong>Location:</strong> {event.location}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 transition-colors duration-300">
                    <button onClick={() => onViewDetails(event)} className="flex-grow bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        View Details
                    </button>
                    <button
                        onClick={handleLikeClick}
                        className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-300"
                        aria-label="Like event"
                    >
                        <HeartIcon
                            isLiked={isLiked}
                            className={`w-6 h-6 transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500'}`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryFilter = ({ categories, activeCategories, setActiveCategories }) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const checkForScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    }, []);

    const handleCategoryClick = (category) => {
        if (category === 'All') {
            setActiveCategories(['All']);
            return;
        }

        const newActiveCategories = activeCategories.filter(c => c !== 'All');

        if (newActiveCategories.includes(category)) {
            const updatedCategories = newActiveCategories.filter(c => c !== category);
            if (updatedCategories.length === 0) {
                setActiveCategories(['All']);
            } else {
                setActiveCategories(updatedCategories);
            }
        } else {
            setActiveCategories([...newActiveCategories, category]);
        }
    };


    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            checkForScroll();
            container.addEventListener('scroll', checkForScroll, { passive: true });
            const resizeObserver = new ResizeObserver(checkForScroll);
            resizeObserver.observe(container);
            return () => {
                container.removeEventListener('scroll', checkForScroll);
                resizeObserver.unobserve(container);
            };
        }
    }, [checkForScroll]);
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -350 : 350;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    return (
         <div className="relative flex items-center mb-12">
            {canScrollLeft && ( <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll left"> <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button> )}
            <div ref={scrollContainerRef} className="flex overflow-x-auto gap-3 py-2 px-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scroll-smooth::-webkit-scrollbar { display: none; }`}</style>
                {categories.map(category => ( <button key={category} onClick={() => handleCategoryClick(category)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 whitespace-nowrap ${activeCategories.includes(category) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}> {category} </button> ))}
            </div>
            {canScrollRight && ( <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" aria-label="Scroll right"> <ChevronRightIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" /> </button> )}
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 1) return null;
    return (
        <div className="mt-12 flex justify-center items-center space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> Previous </button>
            {pageNumbers.map(number => ( <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 rounded-md transition-colors duration-300 ${ currentPage === number ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600' }`}> {number} </button> ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-300"> Next </button>
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, filters, setFilters, applyFilters, clearFilters }) => {
    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const modalEventTypes = categories.filter(c => c !== 'All' && c !== 'Featured');

    return (
        <div className="fixed inset-0 bg-black/70 bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out" style={{ opacity: isOpen ? 1 : 0 }}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-8 relative transform transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'translateY(0)' : 'translateY(-20px)', opacity: isOpen ? 1 : 0 }}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Filter Events</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors duration-300">Refine your search to find the perfect event.</p>

                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Date Range</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
                                    <input type="date" name="fromDate" value={filters.fromDate} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"/>
                                </div>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
                                    <input type="date" name="toDate" value={filters.toDate} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2 bg-transparent dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"/>
                                </div>
                            </div>
                        </div>

                        {/* Event Type */}
                        <div className="relative">
                            <label htmlFor="eventType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Event Type</label>
                            <TagIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none"/>
                            <select name="eventType" id="eventType" value={filters.eventType} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Types</option>
                                {modalEventTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90"/>
                        </div>

                        {/* Location */}
                        <div className="relative">
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Location</label>
                             <MapPinIcon className="absolute left-3 top-10 h-5 w-5 text-gray-400 pointer-events-none"/>
                            <select name="location" id="location" value={filters.location} onChange={handleInputChange} className="w-full appearance-none pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 bg-white dark:bg-gray-800 dark:text-white">
                                <option value="">All Locations</option>
                                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <ChevronRightIcon className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none transform rotate-90"/>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4 transition-colors duration-300">
                        <button type="button" onClick={clearFilters} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300">
                            Clear
                        </button>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EventDetailModal = ({ event, isOpen, onClose }) => {
    if (!event) return null;

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className={`fixed inset-0 z-[70] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/70 transition-opacity duration-300"
                onClick={onClose}
                style={{ opacity: isOpen ? 1 : 0 }}
            ></div>

            {/* Modal Content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                 <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ease-in-out"
                    style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
                >
                    <div className="relative">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover rounded-t-xl"/>
                        <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition-colors">
                            <XMarkIcon className="h-6 w-6"/>
                        </button>
                    </div>
                    <div className="p-8">
                        <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm font-semibold px-3 py-1 rounded-full mb-4">{event.category}</span>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{event.title}</h2>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600 dark:text-gray-400 mb-6">
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="w-5 h-5"/>
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5"/>
                                <span>{event.location}</span>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{event.description}</p>
                        <button className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors duration-300 text-lg">
                            Participate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState(['All']);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const initialFilters = { fromDate: '', toDate: '', eventType: '', location: '' };
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [modalFilters, setModalFilters] = useState(initialFilters);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const openEventModal = (event) => setSelectedEvent(event);
  const closeEventModal = () => setSelectedEvent(null);

  const eventsPerPage = 9;

  const featuredEvents = useMemo(() =>
    eventsData.filter(e => e.category === 'Featured'),
  []);

  const filteredEvents = useMemo(() => {
    let events = eventsData.filter(event => event.category !== 'Featured');

    // Category Filter (from main page)
    if (!activeCategories.includes('All')) {
        events = events.filter(event => activeCategories.includes(event.category));
    }

    // Advanced Filters (from modal)
    if (activeFilters.fromDate) {
        events = events.filter(event => new Date(event.date) >= new Date(activeFilters.fromDate));
    }
    if (activeFilters.toDate) {
        events = events.filter(event => new Date(event.date) <= new Date(activeFilters.toDate).setHours(23, 59, 59, 999));
    }
    if (activeFilters.eventType) {
        events = events.filter(event => event.category === activeFilters.eventType);
    }
    if (activeFilters.location) {
        events = events.filter(event => event.location === activeFilters.location);
    }

    // Search Term Filter
    if (searchTerm) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return events;
  }, [searchTerm, activeCategories, activeFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategories, activeFilters]);

  const handleApplyFilters = () => {
      setActiveFilters(modalFilters);
      setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
      setModalFilters(initialFilters);
      setActiveFilters(initialFilters);
      setIsFilterModalOpen(false);
  };

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} onMenuClick={() => setIsMobileMenuOpen(true)}/>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <FeaturedEventCarousel events={featuredEvents} onViewDetails={openEventModal} />

        <div className="mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-grow group w-full">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors duration-300" />
                <input
                    type="text"
                    placeholder="Search for events, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-colors duration-300"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                        aria-label="Clear search"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <button onClick={() => setIsFilterModalOpen(true)} className="flex-shrink-0 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
        </div>

        <CategoryFilter categories={categories} activeCategories={activeCategories} setActiveCategories={setActiveCategories} />

        {currentEvents.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {currentEvents.map(event => (
              <EventCard key={event.id} event={event} onViewDetails={openEventModal} />
            ))}
          </div>
        ) : (
            <div className="text-center py-16">
                <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">No Events Found</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 transition-colors duration-300">Try adjusting your search or filter.</p>
            </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </main>

      <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={modalFilters}
          setFilters={setModalFilters}
          applyFilters={handleApplyFilters}
          clearFilters={handleClearFilters}
      />

      <EventDetailModal
        isOpen={!!selectedEvent}
        onClose={closeEventModal}
        event={selectedEvent}
      />

      <footer className="bg-white dark:bg-gray-800 mt-12 py-4 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
            &copy; {new Date().getFullYear()} Flemmards. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

