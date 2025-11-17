import React from 'react';

const Icon: React.FC<{ children: React.ReactNode, className?: string, title?: string, strokeWidth?: number, viewBox?: string }> = ({ children, className, title, strokeWidth = 2, viewBox = "0 0 24 24" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox={viewBox} stroke="currentColor" strokeWidth={strokeWidth} aria-hidden={!title} role={title ? 'img' : 'presentation'}>
        {title && <title>{title}</title>}
        {children}
    </svg>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.343 6.343l11.314 11.314m-11.314 0L17.657 6.343" /></Icon>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5l4.5 4.5m-6.75-2.25a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></Icon>
);

export const CatSilhouetteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,15.2 17.8,17.9 15,19.2V18.5C15,17.1 13.9,16 12.5,16H11.5C10.1,16 9,17.1 9,18.5V19.2C6.2,17.9 4,15.2 4,12A8,8 0 0,1 12,4M8.5,12.5A1.5,1.5 0 0,1 7,11A1.5,1.5 0 0,1 8.5,9.5A1.5,1.5 0 0,1 10,11A1.5,1.5 0 0,1 8.5,12.5M15.5,12.5A1.5,1.5 0 0,1 14,11A1.5,1.5 0 0,1 15.5,9.5A1.5,1.5 0 0,1 17,11A1.5,1.5 0 0,1 15.5,12.5M12,7.5C10.9,7.5 10,8.4 10,9.5C10,9.8 10.1,10.1 10.2,10.4C10.6,10.1 11.2,10 12,10C12.8,10 13.4,10.1 13.8,10.4C13.9,10.1 14,9.8 14,9.5C14,8.4 13.1,7.5 12,7.5Z" /></svg>
);

export const LeafCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.32L5.71 22L6.66 19.7C7.5 20.5 9.1 22 12.5 22C19.42 22 21 12 17 8Z" />
    </svg>
);

export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className} strokeWidth={3}><path d="M12,4a8,8,0,0,1,8,8" strokeLinecap="round"/></Icon>
);

// --- New Hand-Drawn Icons ---

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5v8.25a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-8.25M12 3L3 10.5h18L12 3z" /></Icon>
);

export const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18h14V3M5 3h14M12 3s-3 2-3 5 3 5 3 5 3-2 3-5-3-5-3-5z" /></Icon>
);

export const StoreIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M5.25 6.75v10.5a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V6.75M9 6.75V4.5a3 3 0 013-3 3 3 0 013 3v2.25" /></Icon>
);

export const GamepadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M9 9H7m2 6H7m6-6h2m-2 6h2M6 6h12a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3z" /></Icon>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a5.98 5.98 0 01-6 0M12 14.128a3 3 0 100-6 3 3 0 000 6zM21 19.128a9 9 0 10-18 0" /></Icon>
);

export const AdminIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <Icon className={className} title={title}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1.055c-4.418 0-8 3.582-8 8V15a1 1 0 001 1h14a1 1 0 001-1V9.055c0-4.418-3.582-8-8-8zM12 15h.01M4.75 11h14.5" /></Icon>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V6.75A2.25 2.25 0 0013.5 4.5h-8.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5H13.5A2.25 2.25 0 0015.75 17.25V15M21 12l-4.5-4.5M16.5 12H3" /></Icon>
);

export const SpeakerWaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /><path d="M13.5 4.5l7.5 7.5-7.5 7.5M3 10.5h1.5v3H3z" /></Icon>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></Icon>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></Icon>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l.93 12.09A2.25 2.25 0 009.17 21h5.66a2.25 2.25 0 002.24-2.91L18 6M4.5 6h15m-12 3v6m6-6v6m-9-9V4.5a1.5 1.5 0 011.5-1.5h6a1.5 1.5 0 011.5 1.5V6" /></Icon>
);

export const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 17.25h16.5M3.75 12h16.5m-16.5 5.25v-10.5a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25z" /><path d="M8.25 12.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></Icon>
);

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-1.54 10.8a2.25 2.25 0 01-2.23 1.95H7.52a2.25 2.25 0 01-2.23-1.95L3.75 7.5M10.5 11.25h3" /></Icon>
);

export const ArrowUturnUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l4.5-4.5M13.5 9V4.5M13.5 9H3.75A2.25 2.25 0 001.5 11.25v6.5A2.25 2.25 0 003.75 20h6.75a2.25 2.25 0 002.25-2.25V16.5" /></Icon>
);

export const GiftCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5v21m-6-15h12M6 15h12m-6-13.5L3.75 6h16.5L12 1.5zm0 21l-2.25-4.5h4.5L12 22.5z" /></Icon>
);

export const TradeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h12M16.5 3L21 7.5m0 0L16.5 12M21 7.5H9" /></Icon>
);

export const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className} title="Misión completada"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 6.75H9.375a2.25 2.25 0 00-2.25 2.25v9.75a2.25 2.25 0 002.25 2.25h9.75a2.25 2.25 0 002.25-2.25V9.375a2.25 2.25 0 00-2.25-2.25H12.75z" /><path d="M12.75 6.75V2.25m0 4.5h-4.5m4.5 0h4.5" /></Icon>
);

export const VerifiedIcon: React.FC<{ className?: string, title?: string }> = ({ className, title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      {title && <title>{title}</title>}
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

// --- Unchanged or less stylized icons for specific purposes ---
export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></Icon>
);

export const TimeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></Icon>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Icon>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const HeartIcon: React.FC<{ className?: string, solid?: boolean }> = ({ className, solid }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);
