// =============================================================================
// NotificationBell Component
// =============================================================================
// Displays a bell icon with a red badge for unread notifications.
// Clicking it opens a dropdown panel to view and mark them as read.
//
// KEY PATTERNS:
// - `useRef` + `useEffect`: We attach a mousedown listener to the document
//   so that clicking ANYWHERE outside the dropdown closes it automatically.
// - Integration with `useNotifications`: The hook does all the hard work (polling,
//   fetching). This component just calls the hook and renders the result.
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // The hook handles polling automatically in the background
  const {
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    
    // Parse the extra data payload
    if (notif.data) {
      try {
        const data = JSON.parse(notif.data);
        if (data.groupId) {
          navigate(`/groups/${data.groupId}`);
          setIsOpen(false);
        }
      } catch (e) {
        console.error('Failed to parse notification data', e);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-xl text-lg relative transition-all duration-200 hover:bg-white/5"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-base-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card z-50 flex flex-col shadow-2xl">
          <div className="p-3 border-b border-white/10 flex justify-between items-center sticky top-0 bg-base-900/95 backdrop-blur z-10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent-400 hover:text-accent-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 flex justify-center">
                <div className="spinner w-6 h-6"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-base-400">
                You're all caught up! 🎉
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 border-b border-white/5 cursor-pointer transition-colors ${
                      notif.read ? 'opacity-60 hover:bg-white/5' : 'bg-accent-500/10 hover:bg-accent-500/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-xl shrink-0 mt-0.5">
                        {notif.type === 'group_expense_added' ? '💸' : 
                         notif.type === 'added_to_group' ? '👋' : '✅'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm text-white ${!notif.read ? 'font-medium' : ''}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-base-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5 ml-auto"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
