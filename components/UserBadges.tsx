import React from 'react';

interface UserBadgesProps {
    role: 'admin' | 'mod' | 'user';
    isVerified: boolean;
    className?: string;
}

const UserBadges: React.FC<UserBadgesProps> = ({ role, isVerified, className = '' }) => {
    return (
        <span className={`inline-flex items-center gap-1 text-xl ${className}`}>
            {role === 'admin' && <span title="Admin">👑</span>}
            {role === 'mod' && <span title="Moderator">🛡️</span>}
            {isVerified && <span title="Verified">✅</span>}
        </span>
    );
};

export default UserBadges;
