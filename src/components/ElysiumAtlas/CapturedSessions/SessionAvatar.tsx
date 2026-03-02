export default function SessionAvatar() {
  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <rect width="40" height="40" fill="#e5e7eb" />
          <circle cx="20" cy="16" r="7" fill="#9ca3af" />
          <ellipse cx="20" cy="34" rx="12" ry="8" fill="#9ca3af" />
        </svg>
      </div>
      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-teal-green border-2 border-white dark:border-[#1b1b1b]" />
    </div>
  );
}
